import { useQuery } from '@tanstack/react-query';
import ApiService from '@/services/Api.Service';
import type { ISeatingResponse } from '@/types';

export const GetSeatingKey = 'seating';

type Params = {
	slug: string | null | undefined;
	sessionId: number | null | undefined;
	enabled?: boolean;
	/** Re-read the hall on a timer (ms) — for screens that outlive one snapshot. */
	refetchInterval?: number | false;
	/** A payload the caller already holds — seeds the cache instead of re-fetching it. */
	initialData?: ISeatingResponse;
};

export const useGetSeating = ({
	slug,
	sessionId,
	enabled = true,
	refetchInterval = false,
	initialData,
}: Params) => {
	return useQuery({
		queryKey: [GetSeatingKey, slug, sessionId],
		queryFn: async () =>
			ApiService.get<ISeatingResponse>(
				`/api/public/seating/${encodeURIComponent(slug!)}?session_id=${sessionId}`
			),
		enabled: !!slug && !!sessionId && enabled,
		staleTime: 30 * 1000,
		refetchInterval,
		initialData,
	});
};

export async function fetchSeating(slug: string, sessionId: number): Promise<ISeatingResponse> {
	return ApiService.get<ISeatingResponse>(
		`/api/public/seating/${encodeURIComponent(slug)}?session_id=${sessionId}`
	);
}
