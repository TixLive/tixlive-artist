// Edge OG injection for the landing page (`/`).
// Crawlers get site meta baked into the shell's <head>; real users get the
// untouched static index.html (no besttix roundtrip).
import { besttixBase, fetchBesttix, injectHead, isCrawler, ldjson, link, meta, truncate } from './_lib/og';

interface Env {
	BESTTIX_API_URL?: string;
	/** Local-dev only: forces org resolution via x-org-id (see orgHeader). Unset in prod. */
	DEV_ORG_ID?: string;
	ASSETS: AssetsFetcher;
}

interface Ctx {
	request: Request;
	env: Env;
}

// Mirror of /api/public/site (organizer fields are top-level alongside `success`).
interface Site {
	name?: string;
	bio?: string | null;
	logo_url?: string | null;
}

export async function onRequest({ request, env }: Ctx): Promise<Response> {
	const shell = () => env.ASSETS.fetch(request);
	if (request.method !== 'GET' && request.method !== 'HEAD') return shell();
	if (!isCrawler(request.headers.get('user-agent'))) return shell();

	const url = new URL(request.url);
	const [site, res] = await Promise.all([
		fetchBesttix<Site>(besttixBase(env), '/api/public/site', url.hostname, env),
		shell(),
	]);
	if (!site?.name) return res;

	const canonical = `${url.origin}/`;
	const description = truncate(site.bio) || `Get tickets for ${site.name}'s events.`;

	// Organization entity for the white-label organizer — gives AI engines and the
	// Knowledge Graph a canonical name/logo/url to attach citations to. The client renders
	// the same entity for users/JS-crawlers (src/lib/seo.ts → organizationLd); keep in sync.
	const orgLd = {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: site.name,
		url: canonical,
		...(site.logo_url && { logo: site.logo_url }),
		...(description && { description }),
	};

	const tags = [
		link('canonical', canonical),
		meta('og:type', 'website'),
		meta('og:site_name', site.name),
		meta('og:url', canonical),
		meta('og:title', site.name),
		meta('og:description', description),
		meta('og:image', site.logo_url),
		meta('twitter:card', site.logo_url ? 'summary_large_image' : 'summary', 'name'),
		meta('twitter:title', site.name, 'name'),
		meta('twitter:description', description, 'name'),
		meta('twitter:image', site.logo_url, 'name'),
		meta('description', description, 'name'),
		ldjson(orgLd),
	];
	return injectHead(res, site.name, tags);
}
