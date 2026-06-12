// Client-side SEO helpers — the deliberate mirror of the edge OG injection in
// functions/_lib/og.ts. The static export fetches everything from the browser, so a
// crawler that runs JS (Googlebot) and a real user both build their <head> from React.
// Non-JS crawlers (Facebook, AI engines) instead get the same tags baked in at the edge.
// Keeping these two in sync is what guarantees crawler-content == user-content (no cloaking):
// change a tag here and you must change it in functions/_lib/og.ts too, and vice-versa.
import type { IEventDetail, IOrganizer } from '@/types';

// Collapse whitespace and cap length (matches truncate() in functions/_lib/og.ts).
export function truncate(s: string | null | undefined, n = 300): string {
	const t = (s ?? '').replace(/\s+/g, ' ').trim();
	return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
}

// Organization entity for the white-label organizer (landing `/`).
// Mirror of the orgLd object in functions/index.ts.
export function organizationLd(organizer: IOrganizer, canonical: string) {
	const description = truncate(organizer.bio) || `Get tickets for ${organizer.name}'s events.`;
	return {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: organizer.name,
		url: canonical,
		...(organizer.logo_url && { logo: organizer.logo_url }),
		...(description && { description }),
	};
}

// Event entity for an event page (`/events/:slug`).
// Mirror of the jsonLd object in functions/events/[slug].ts.
export function eventLd(event: IEventDetail, canonical: string, siteName?: string | null) {
	const image = event.poster_url || event.poster_portrait_url || null;
	return {
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
}
