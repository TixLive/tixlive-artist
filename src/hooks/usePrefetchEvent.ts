import { useQueryClient } from '@tanstack/react-query';
import { directGetEvent } from '@/lib/directApi';

/**
 * Returns a prefetch callback for an event slug. Wire to `onMouseEnter` /
 * `onTouchStart` on event links so the besttix fetch starts during the
 * user's pointer-to-click latency, making navigation feel instant.
 */
export function usePrefetchEvent() {
	const qc = useQueryClient();
	return (slug: string) => {
		qc.prefetchQuery({
			queryKey: ['event', slug],
			queryFn: () => directGetEvent(slug),
			staleTime: 60 * 1000,
		});
	};
}
