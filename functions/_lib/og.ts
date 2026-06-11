// Shared helpers for edge-side Open Graph injection.
//
// Why this exists: the white-label site is a static export with all data fetched
// from the browser. Social crawlers (Facebook, WhatsApp, Telegram, Twitter, …)
// don't run JS, so the `next/head` OG tags that pages set client-side are invisible
// to them — shared links render a blank preview. These functions detect a crawler,
// fetch the site/event data from besttix at the edge, and rewrite the static shell's
// <head> so the preview is correct. Real users are never touched.
//
// `_lib` is underscore-prefixed so Cloudflare Pages excludes it from routing.

const BESTTIX_DEFAULT = 'https://tix.live';

// Conservative allow-list of preview/crawler user agents. Real browsers never match,
// so they skip the besttix roundtrip and get the untouched static shell.
// Three groups: social-preview bots, classic search crawlers, and AI/answer-engine
// crawlers. The AI group is what makes the site eligible for ChatGPT/Perplexity/
// Claude/AI-Overview citations — none of them run JS, so without edge injection they
// only ever see the empty shell.
const CRAWLER_RE =
	/facebookexternalhit|facebot|twitterbot|telegrambot|whatsapp|discordbot|linkedinbot|slackbot|slack-imgproxy|pinterest|redditbot|googlebot|bingbot|applebot|embedly|quora link preview|outbrain|vkshare|skypeuripreview|viber|line-poker|tumblr|bitlybot|nuzzel|iframely|google-inspectiontool|gptbot|oai-searchbot|chatgpt-user|perplexitybot|perplexity-user|claudebot|claude-searchbot|anthropic-ai|google-extended|applebot-extended|ccbot|amazonbot|bytespider|meta-externalagent|cohere-ai|duckassistbot|youbot/i;

export function isCrawler(ua: string | null): boolean {
	return !!ua && CRAWLER_RE.test(ua);
}

export function besttixBase(env: { BESTTIX_API_URL?: string }): string {
	return (env.BESTTIX_API_URL ?? BESTTIX_DEFAULT).replace(/\/$/, '');
}

export function esc(v: unknown): string {
	return String(v ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

// Build a single <meta> tag, or '' when there's no content to advertise.
export function meta(key: string, content: string | null | undefined, attr: 'property' | 'name' = 'property'): string {
	if (!content) return '';
	return `<meta ${attr}="${key}" content="${esc(content)}">`;
}

export function truncate(s: string | null | undefined, n = 300): string {
	const t = (s ?? '').replace(/\s+/g, ' ').trim();
	return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
}

// Build a <link> tag (e.g. rel="canonical"), or '' when there's no href.
export function link(rel: string, href: string | null | undefined): string {
	if (!href) return '';
	return `<link rel="${rel}" href="${esc(href)}">`;
}

// Serialize an object into a JSON-LD <script>. Escapes `<` so the payload can't
// break out of the <script> element. Returns '' for an empty payload.
export function ldjson(obj: unknown): string {
	if (!obj) return '';
	return `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
}

function isLocalHost(host: string): boolean {
	return (
		host === 'localhost' ||
		host === '127.0.0.1' ||
		host.endsWith('.local') ||
		/^\d+\.\d+\.\d+\.\d+$/.test(host)
	);
}

// Org-identity header for besttix. Production resolves the white-label org by
// domain (`x-site-domain`). In local dev the host is `localhost`, which besttix
// can't map by domain — so when a `DEV_ORG_ID` binding is present we fall back to
// `x-org-id`, mirroring Api.Service.ts's browser rule. DEV_ORG_ID is never set in
// production (and the prod host is never localhost), so this path can't fire there.
export function orgHeader(host: string, env: { DEV_ORG_ID?: string }): Record<string, string> {
	if (isLocalHost(host) && env.DEV_ORG_ID) return { 'x-org-id': env.DEV_ORG_ID };
	return { 'x-site-domain': host };
}

// Fetch JSON from besttix, resolving the white-label org via the request host.
// Returns null on any failure so callers can fall back to the plain shell.
export async function fetchBesttix<T>(
	base: string,
	path: string,
	host: string,
	env: { DEV_ORG_ID?: string } = {},
): Promise<T | null> {
	try {
		const r = await fetch(`${base}${path}`, { headers: orgHeader(host, env) });
		if (!r.ok) return null;
		return (await r.json()) as T;
	} catch {
		return null;
	}
}

// Replace the document <title> and append OG/Twitter meta into <head>.
// Removing the existing <title> first guarantees exactly one, regardless of what
// the static shell shipped.
export function injectHead(res: Response, titleText: string, tags: string[]): Response {
	const headHtml = `<title>${esc(titleText)}</title>${tags.filter(Boolean).join('')}`;
	const out = new HTMLRewriter()
		.on('title', { element: (e) => e.remove() })
		.on('head', { element: (e) => e.append(headHtml, { html: true }) })
		.transform(res);
	// Short edge cache so repeat crawler scans don't hammer besttix.
	out.headers.set('Cache-Control', 'public, max-age=300');
	return out;
}
