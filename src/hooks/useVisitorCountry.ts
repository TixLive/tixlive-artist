import { useSyncExternalStore } from 'react';
import { getCountryFromTimezone } from '@/lib/timezoneCountry';

/** No-op subscription: the value never changes after mount. */
const subscribe = () => () => {};

/** Client snapshot — read the browser time zone and map it to a country. */
function getClientCountry(): string | null {
	try {
		return getCountryFromTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
	} catch {
		return null;
	}
}

/** Server snapshot — no real time zone during static export, resolve on the client. */
const getServerCountry = () => null;

/**
 * Resolve the visitor's ISO 3166-1 alpha-2 country code from the browser's
 * time zone. Fully client-side — no IP is sent anywhere (GDPR-friendly).
 * Uses useSyncExternalStore so the static-export prerender (null) and client
 * hydration reconcile without a mismatch. Returns null when unresolved or the
 * time zone isn't mapped, so callers can fall back to another default.
 */
export function useVisitorCountry(): string | null {
	return useSyncExternalStore(subscribe, getClientCountry, getServerCountry);
}
