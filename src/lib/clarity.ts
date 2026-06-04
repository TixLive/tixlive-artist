// Thin, guarded wrapper around the Microsoft Clarity SDK — the single place that touches
// `@microsoft/clarity`. Mirrors the shape of `fbpixel.ts`. Every call no-ops when Clarity is
// disabled (no NEXT_PUBLIC_CLARITY_PROJECT_ID) or before the tag has been initialised, and is
// wrapped in try/catch so analytics can never break a user flow.
//
// Clarity's model (different from the Meta Pixel): `event(name)` carries NO payload — it just marks
// a filterable moment. Context for a session is attached separately via `setTag(key, value)` (string
// values only). `upgrade(reason)` forces a sampled session to be recorded. `identify(id)` stitches a
// session to a user; Clarity hashes the id ON THE CLIENT before sending, so a raw email is safe to
// pass as the id — but `friendlyName` is NOT hashed, so we never pass PII there.

import Clarity from '@microsoft/clarity';
import type { ClarityEvent, ClarityTag } from '@/lib/clarity.constants';

const PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ?? '';

/** A Clarity project is configured for this deployment. */
export const clarityEnabled = !!PROJECT_ID;

let started = false;

/** Load the Clarity tag once. Safe to call repeatedly (StrictMode / re-renders). */
export function initClarity(): void {
	if (!clarityEnabled || started || typeof window === 'undefined') return;
	started = true;
	try {
		Clarity.init(PROJECT_ID);
	} catch {
		started = false;
	}
}

/** Drive Clarity's cookie access from the consent banner (Consent Mode). */
export function setConsent(analyticsGranted: boolean, adsGranted: boolean): void {
	if (!started) return;
	try {
		Clarity.consentV2({
			analytics_Storage: analyticsGranted ? 'granted' : 'denied',
			ad_Storage: adsGranted ? 'granted' : 'denied',
		});
	} catch {
		// ignore
	}
}

/** Label the current session with a filterable dimension. Values must be strings. */
export function setTag(key: ClarityTag, value: string | string[]): void {
	if (!started || !value || (Array.isArray(value) && value.length === 0)) return;
	try {
		Clarity.setTag(key, value);
	} catch {
		// ignore
	}
}

/** Mark a named funnel moment (no payload — use setTag for context). */
export function trackEvent(name: ClarityEvent): void {
	if (!started) return;
	try {
		Clarity.event(name);
	} catch {
		// ignore
	}
}

/** Force this session to be recorded even if it would otherwise be sampled out. */
export function upgradeSession(reason: string): void {
	if (!started) return;
	try {
		Clarity.upgrade(reason);
	} catch {
		// ignore
	}
}

/** Stitch the session to a known attendee. `customId` is hashed client-side by Clarity before it
 *  leaves the browser. Callers MUST gate this on analytics consent. Never pass PII as friendlyName. */
export function identify(customId: string): void {
	if (!started || !customId) return;
	try {
		Clarity.identify(customId);
	} catch {
		// ignore
	}
}
