import { useQueryClient } from '@tanstack/react-query';
import { fetchEvent, GetEventKey } from '@/queries/events/useGetEvent';

/**
 * Returns a prefetch callback for an event slug. Wire to `onMouseEnter` /
 * `onTouchStart` on event links so the besttix fetch starts during the
 * user's pointer-to-click latency, making navigation feel instant.
 */
export function usePrefetchEvent() {
	const qc = useQueryClient();
	return (slug: string) => {
		qc.prefetchQuery({
			queryKey: [GetEventKey, slug],
			queryFn: () => fetchEvent(slug),
			staleTime: 60 * 1000,
		});
	};
}
