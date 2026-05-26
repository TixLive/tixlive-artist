import { useEffect } from 'react';

/**
 * Sets `data-event-type` on <html> while mounted and clears it on unmount,
 * so themes don't leak when navigating between events or to the home page.
 */
export function useEventType(eventType: string | null | undefined) {
	useEffect(() => {
		if (!eventType) return;
		document.documentElement.setAttribute('data-event-type', eventType);
		return () => document.documentElement.removeAttribute('data-event-type');
	}, [eventType]);
}
