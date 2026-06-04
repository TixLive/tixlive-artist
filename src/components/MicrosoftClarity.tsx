import { useEffect, useRef } from 'react';
import { useOrganizer } from '@/contexts/OrganizerContext';
import { useConsent } from '@/contexts/ConsentContext';
import { useAuth } from '@/contexts/AuthContext';
import { clarityEnabled, initClarity, setConsent, setTag, identify } from '@/lib/clarity';
import { CLARITY_TAGS, CLARITY_AUTH_STATE } from '@/lib/clarity.constants';

/**
 * Loads Microsoft Clarity (session recordings + heatmaps) in Consent Mode: the tag loads on every
 * page but stays COOKIELESS until the visitor grants the `analytics` category, then we upgrade via
 * `consentV2`. This requires "Consent Mode" to be ON in the Clarity project dashboard — otherwise
 * the always-loaded tag would set cookies before consent.
 *
 * One shared Clarity project serves every white-label; deployments are told apart by Clarity tags
 * (hostname + organizer). The project id comes from NEXT_PUBLIC_CLARITY_PROJECT_ID; when it's unset
 * (e.g. local/preview) every call is a no-op.
 *
 * This component owns the session-wide context: hostname, organizer, locale, auth state, the consent
 * signal, and (consent-gated) attendee identify. Per-funnel events live in their respective pages.
 */
export function MicrosoftClarity() {
	const { organizer } = useOrganizer();
	const { analyticsGranted, granted, ready } = useConsent();
	const { user } = useAuth();
	const startedRef = useRef(false);
	const identifiedRef = useRef<string | null>(null);

	// Load the tag once. Consent Mode keeps it cookieless until we signal consent. Tag by hostname
	// immediately so every white-label is distinguishable in the Clarity dashboard.
	useEffect(() => {
		if (!clarityEnabled || startedRef.current) return;
		startedRef.current = true;
		initClarity();
		if (typeof window !== 'undefined') setTag(CLARITY_TAGS.HOSTNAME, window.location.hostname);
	}, []);

	// Friendlier per-white-label tag once the organizer profile resolves.
	useEffect(() => {
		if (organizer?.name) setTag(CLARITY_TAGS.ORGANIZER, organizer.name);
	}, [organizer?.name]);

	// Segment guests vs signed-in attendees.
	useEffect(() => {
		setTag(CLARITY_TAGS.AUTH_STATE, user ? CLARITY_AUTH_STATE.AUTHED : CLARITY_AUTH_STATE.GUEST);
	}, [user]);

	// Drive Clarity's cookie access from the consent banner. Fires `denied` on first load (explicit)
	// and re-runs on every change — upgrading on accept, downgrading on revoke.
	useEffect(() => {
		if (!ready) return;
		setConsent(analyticsGranted, granted);
	}, [analyticsGranted, granted, ready]);

	// Stitch the session to a signed-in attendee — but ONLY with analytics consent. Clarity hashes
	// the email on the client before it leaves the browser. Skipped for guests (no stable id).
	useEffect(() => {
		if (!ready || !analyticsGranted || !user?.email) return;
		if (identifiedRef.current === user.email) return;
		identifiedRef.current = user.email;
		identify(user.email);
	}, [ready, analyticsGranted, user?.email]);

	return null;
}
