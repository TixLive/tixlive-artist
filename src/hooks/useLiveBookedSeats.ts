import { useGetSeating } from '@/queries/seating/useGetSeating';
import type { ISeatingResponse } from '@/types';

/** How often the seat map re-reads availability while the buyer is looking at it. */
export const SEAT_MAP_POLL_INTERVAL_MS = 30_000;

type Params = {
	slug: string | null | undefined;
	sessionId: number | null | undefined;
	/**
	 * The snapshot the page already fetched to build the chart. Seeds the query cache so
	 * entering the map costs one read of the hall, not two — the first extra request is
	 * the beat itself.
	 */
	initial?: ISeatingResponse;
	enabled?: boolean;
};

/**
 * Availability of the hall while the buyer is still looking at it. Nothing reserves a
 * seat until the order row exists, so a map drawn once at mount shows a buyer studying
 * the chart for five minutes the availability of five minutes ago: a seat sold in
 * between stays drawn as free and can still be picked, and the conflict only surfaced
 * at Continue (see `findStaleSeats` in `seatSelection.ts`).
 *
 * react-query's `refetchIntervalInBackground` stays at its default `false`, so the beat
 * runs only while this tab is the visible one, and `refetchOnWindowFocus` (default
 * `true`) covers coming back to it.
 *
 * Hands back `booked` ALONE on purpose. The viewer fits the viewport from the content
 * bounds it derives off `sections`, so handing the whole refetched payload down would
 * re-fit the chart under the buyer's fingers on every beat. Geometry is authored in the
 * dashboard and does not move while someone is buying; availability does.
 */
export function useLiveBookedSeats({ slug, sessionId, initial, enabled = true }: Params): string[] | undefined {
	const { data } = useGetSeating({
		slug,
		sessionId,
		enabled,
		initialData: initial,
		refetchInterval: SEAT_MAP_POLL_INTERVAL_MS,
	});

	return data?.booked;
}
