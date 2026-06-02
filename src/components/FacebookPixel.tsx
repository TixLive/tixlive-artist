import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useOrganizer } from '@/contexts/OrganizerContext';
import { useConsent } from '@/contexts/ConsentContext';
import { captureFbclid, initPixel, track } from '@/lib/fbpixel';

/**
 * Loads the Meta Pixel and fires PageView (initial + on client navigation) — but ONLY when
 * the organizer has a pixel configured AND the visitor granted marketing consent. ViewContent
 * and Purchase are fired from their respective pages (event detail / checkout success).
 */
export function FacebookPixel() {
	const { organizer } = useOrganizer();
	const { granted } = useConsent();
	const router = useRouter();
	const pixelId = organizer?.facebook_pixel_id ?? null;

	// Remember the ad-click fbclid as early as possible (before consent), so checkout can
	// rebuild _fbc later. Stored locally; only sent to CAPI with consent. Not consent-gated.
	useEffect(() => {
		captureFbclid();
		const onRouteChange = () => captureFbclid();
		router.events.on('routeChangeComplete', onRouteChange);
		return () => router.events.off('routeChangeComplete', onRouteChange);
	}, [router.events]);

	useEffect(() => {
		if (!granted || !pixelId) return;
		initPixel(pixelId);
		track('PageView');
	}, [granted, pixelId]);

	useEffect(() => {
		if (!granted || !pixelId) return;
		const onRouteChange = () => track('PageView');
		router.events.on('routeChangeComplete', onRouteChange);
		return () => router.events.off('routeChangeComplete', onRouteChange);
	}, [granted, pixelId, router.events]);

	return null;
}
