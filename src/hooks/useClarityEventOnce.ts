import { useEffect, useRef } from 'react';
import { trackEvent, upgradeSession } from '@/lib/clarity';
import type { ClarityEvent } from '@/lib/clarity.constants';

interface ClarityEventOnceOptions {
	/** Event name to fire (also used as the upgrade reason). */
	name: ClarityEvent;
	/** Fires on the first render where this is true. */
	when: boolean;
	/** Also force the session to be recorded (Clarity samples by default). */
	upgrade?: boolean;
}

/**
 * Fires a Clarity funnel event exactly once — the first render where `when` becomes true (per mount).
 * Replaces the repeated `useEffect` + `useRef('fired')` boilerplate on funnel pages.
 *
 * Pass `upgrade: true` to also force the session to be recorded; the event name doubles as the
 * upgrade reason. For events fired from handlers (clicks, form submits) call `trackEvent` from
 * `@/lib/clarity` directly instead — this hook is only for the "fire when a render condition first
 * holds" case.
 */
export function useClarityEventOnce({ name, when, upgrade = false }: ClarityEventOnceOptions): void {
	const firedRef = useRef(false);
	useEffect(() => {
		if (firedRef.current || !when) return;
		firedRef.current = true;
		trackEvent(name);
		if (upgrade) upgradeSession(name);
	}, [when, name, upgrade]);
}
