// Dynamic sitemap (`/sitemap.xml`).
// The event inventory is live and per-tenant, so the sitemap is generated at the
// edge from besttix rather than baked at build time. Lists the landing page plus
// every upcoming event. Past events are intentionally excluded (the archive is
// noindex). Falls back to a home-only sitemap if besttix is unavailable.
import { besttixBase, fetchBesttix } from './_lib/og';

interface Env {
	BESTTIX_API_URL?: string;
	/** Local-dev only: forces org resolution via x-org-id (see orgHeader). Unset in prod. */
	DEV_ORG_ID?: string;
}

interface Ctx {
	request: Request;
	env: Env;
}

// Mirror of /api/public/events list items (only the fields we need).
interface EventItem {
	slug?: string;
	status?: string;
}

interface EventsPage {
	data?: EventItem[];
	next_offset?: number | null;
}

function xmlEscape(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function onRequest({ request, env }: Ctx): Promise<Response> {
	const url = new URL(request.url);
	const origin = url.origin;
	const base = besttixBase(env);

	const slugs: string[] = [];
	let offset: number | null = 0;
	// Guard against a misbehaving next_offset so we can't loop forever.
	for (let page = 0; offset != null && page < 20; page++) {
		const result: EventsPage | null = await fetchBesttix<EventsPage>(
			base,
			`/api/public/events?timeframe=upcoming&limit=100&offset=${offset}`,
			url.hostname,
			env,
		);
		if (!result?.data?.length) break;
		for (const ev of result.data) {
			if (ev.slug && ev.status !== 'draft') slugs.push(ev.slug);
		}
		offset = result.next_offset ?? null;
	}

	const locs = [
		`${origin}/`,
		...slugs.map((s) => `${origin}/events/${encodeURIComponent(s)}`),
	];
	const body =
		`<?xml version="1.0" encoding="UTF-8"?>\n` +
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
		locs.map((loc) => `  <url><loc>${xmlEscape(loc)}</loc></url>`).join('\n') +
		`\n</urlset>\n`;

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=86400',
		},
	});
}
