// Edge OG injection for event pages (`/events/:slug`).
// This function takes precedence over the `_redirects` rewrite, so it serves the
// pre-built `/events/_` shell itself via the ASSETS binding. Crawlers additionally
// get the event's meta baked into <head>; real users get the plain shell.
import { besttixBase, fetchBesttix, injectHead, isCrawler, ldjson, link, meta, truncate } from '../_lib/og';

interface Env {
	BESTTIX_API_URL?: string;
	/** Local-dev only: forces org resolution via x-org-id (see orgHeader). Unset in prod. */
	DEV_ORG_ID?: string;
	ASSETS: AssetsFetcher;
}

interface Ctx {
	request: Request;
	env: Env;
	params: { slug: string | string[] };
}

// Mirror of /api/public/event/:slug (fields top-level alongside `success`).
interface TicketType {
	name?: string;
	price?: number;
	currency?: string;
	remaining_capacity?: number | null;
}

interface EventDetail {
	title?: string;
	description?: string | null;
	poster_url?: string | null;
	poster_portrait_url?: string | null;
	date_start?: string;
	venue_name?: string;
	venue_address?: string;
	ticket_types?: TicketType[];
}

interface Site {
	name?: string;
}

export async function onRequest({ request, env, params }: Ctx): Promise<Response> {
	const url = new URL(request.url);
	// All dynamic slugs render the same static shell.
	const shellUrl = new URL('/events/_', url.origin);
	const shell = () => env.ASSETS.fetch(shellUrl);

	if (request.method !== 'GET' && request.method !== 'HEAD') return shell();
	if (!isCrawler(request.headers.get('user-agent'))) return shell();

	const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
	const base = besttixBase(env);
	const [event, site, res] = await Promise.all([
		fetchBesttix<EventDetail>(base, `/api/public/event/${encodeURIComponent(slug)}`, url.hostname, env),
		fetchBesttix<Site>(base, '/api/public/site', url.hostname, env),
		shell(),
	]);
	if (!event?.title) return res;

	const siteName = site?.name;
	const canonical = `${url.origin}${url.pathname}`;
	const title = `${event.title}${siteName ? ` — ${siteName}` : ''}`;
	const description = truncate(event.description) || `Get tickets for ${event.title}`;
	const image = event.poster_url || event.poster_portrait_url || null;

	// Event JSON-LD. This is the single source of truth for the schema — the client
	// no longer emits its own (every crawler that consumes structured data is in the
	// allow-list above and gets it here), so there's no duplicate-entity risk for
	// JS-rendering crawlers. Mirror keeps parity with the on-page event UI.
	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Event',
		name: event.title,
		...(event.date_start && { startDate: event.date_start }),
		...(image && { image }),
		...(event.description && { description: truncate(event.description, 5000) }),
		url: canonical,
		location: {
			'@type': 'Place',
			name: event.venue_name || '',
			...(event.venue_address && {
				address: { '@type': 'PostalAddress', streetAddress: event.venue_address },
			}),
		},
		...(siteName && { organizer: { '@type': 'Organization', name: siteName } }),
		offers: (event.ticket_types ?? []).map((tt) => ({
			'@type': 'Offer',
			name: tt.name,
			price: tt.price,
			priceCurrency: tt.currency,
			availability:
				tt.remaining_capacity === 0 ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
		})),
	};

	const tags = [
		link('canonical', canonical),
		meta('og:type', 'website'),
		meta('og:site_name', siteName),
		meta('og:url', canonical),
		meta('og:title', event.title),
		meta('og:description', description),
		meta('og:image', image),
		meta('twitter:card', image ? 'summary_large_image' : 'summary', 'name'),
		meta('twitter:title', event.title, 'name'),
		meta('twitter:description', description, 'name'),
		meta('twitter:image', image, 'name'),
		meta('description', description, 'name'),
		ldjson(jsonLd),
	];
	return injectHead(res, title, tags);
}
