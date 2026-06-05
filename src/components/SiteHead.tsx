import Head from 'next/head';
import { useOrganizer } from '@/contexts/OrganizerContext';

/**
 * Injects the white-label browser-tab icon (favicon).
 *
 * The favicon is configured per-organizer in besttix and delivered via
 * `/api/public/site` (`favicon_url`). This site is a static export, so the
 * icon cannot be baked per-request at build time — we set it client-side once
 * the organizer context resolves. When no dedicated favicon has been uploaded
 * we inject nothing (the logo is not a good favicon) and let the browser fall
 * back to its default tab icon.
 */
function iconMimeType(url: string): string | undefined {
	const clean = url.split('?')[0].toLowerCase();
	if (clean.endsWith('.svg')) return 'image/svg+xml';
	if (clean.endsWith('.png')) return 'image/png';
	if (clean.endsWith('.ico')) return 'image/x-icon';
	if (clean.endsWith('.webp')) return 'image/webp';
	if (clean.endsWith('.jpg') || clean.endsWith('.jpeg')) return 'image/jpeg';
	return undefined;
}

export default function SiteHead() {
	const { organizer } = useOrganizer();
	const favicon = organizer?.favicon_url ?? null;

	if (!favicon) return null;

	const type = iconMimeType(favicon);

	return (
		<Head>
			<link rel="icon" href={favicon} {...(type ? { type } : {})} />
			<link rel="apple-touch-icon" href={favicon} />
		</Head>
	);
}
