// Meta Pixel (browser half of the Facebook Pixel feature). Loaded ONLY after the visitor
// grants marketing consent. The besttix server fires the same events via the Conversions
// API and deduplicates against these using event_id = order id. See the pixel-contract.

type FbqParams = Record<string, unknown>;
type Fbq = ((...args: unknown[]) => void) & {
	callMethod?: (...args: unknown[]) => void;
	queue: unknown[][];
	loaded?: boolean;
	version?: string;
	push?: unknown;
};

declare global {
	interface Window {
		fbq?: Fbq;
		_fbq?: Fbq;
	}
}

let initializedPixelId: string | null = null;

/** Injects the Meta Pixel base code (once) and inits the given pixel. Idempotent per id. */
export function initPixel(pixelId: string): void {
	if (typeof window === 'undefined' || !pixelId || initializedPixelId === pixelId) return;

	if (!window.fbq) {
		const fbq = function (...args: unknown[]) {
			if (fbq.callMethod) fbq.callMethod(...args);
			else fbq.queue.push(args);
		} as Fbq;
		fbq.queue = [];
		fbq.loaded = true;
		fbq.version = '2.0';
		fbq.push = fbq;
		window.fbq = fbq;
		if (!window._fbq) window._fbq = fbq;

		const script = document.createElement('script');
		script.async = true;
		script.src = 'https://connect.facebook.net/en_US/fbevents.js';
		const first = document.getElementsByTagName('script')[0];
		first?.parentNode?.insertBefore(script, first);
	}

	window.fbq('init', pixelId);
	initializedPixelId = pixelId;
}

/**
 * Fires a standard event. `eventID` is the dedup key shared with the server CAPI event
 * (the besttix order id), so Facebook collapses the browser + server copies into one.
 */
export function track(event: string, params?: FbqParams, eventID?: string): void {
	if (typeof window === 'undefined' || !window.fbq || !initializedPixelId) return;
	if (eventID) window.fbq('track', event, params ?? {}, { eventID });
	else window.fbq('track', event, params ?? {});
}

const FBCLID_KEY = 'tixlive_fbclid';

/**
 * Remember the `fbclid` ad-click id from the landing URL so checkout can rebuild `_fbc` even
 * when the consent-gated pixel never loaded to set the `_fbc` cookie (e.g. the visitor lands
 * via a Facebook ad, browses, then consents at checkout — by which point fbclid is long gone
 * from the URL). Stored locally only; it is forwarded to CAPI exclusively with consent.
 * Call from an effect / event handler (uses Date.now).
 */
export function captureFbclid(): void {
	if (typeof window === 'undefined') return;
	const fbclid = new URLSearchParams(window.location.search).get('fbclid');
	if (!fbclid) return;
	try {
		window.localStorage.setItem(FBCLID_KEY, JSON.stringify({ value: fbclid, ts: Date.now() }));
	} catch {
		/* localStorage unavailable (private mode) — ignore */
	}
}

/** Facebook's `_fbc` format derived from a stored fbclid: fb.1.<clickTime>.<fbclid>. */
function fbcFromStoredFbclid(): string | undefined {
	if (typeof window === 'undefined') return undefined;
	try {
		const raw = window.localStorage.getItem(FBCLID_KEY);
		if (!raw) return undefined;
		const { value, ts } = JSON.parse(raw) as { value?: string; ts?: number };
		return value && ts ? `fb.1.${ts}.${value}` : undefined;
	} catch {
		return undefined;
	}
}

/**
 * Reads the _fbp / _fbc cookies the pixel sets, forwarded to besttix CAPI at checkout.
 * Falls back to a stored fbclid for `_fbc` when the cookie is absent (organic visitors have
 * no `_fbc`; ad-click visitors do — this recovers attribution the consent gate would lose).
 */
export function getFbCookies(): { fbp?: string; fbc?: string } {
	if (typeof document === 'undefined') return {};
	const read = (name: string) =>
		document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'))?.[1];
	return { fbp: read('_fbp'), fbc: read('_fbc') ?? fbcFromStoredFbclid() };
}

export function isPixelReady(): boolean {
	return initializedPixelId !== null;
}
