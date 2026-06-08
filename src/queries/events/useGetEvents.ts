import { useInfiniteQuery } from '@tanstack/react-query';
import ApiService from '@/services/Api.Service';
import type { IEventListItem, IPaginatedResponse } from '@/types';

export const GetEventsKey = 'events';

type Params = {
	enabled?: boolean;
	/** Time filter resolved on the backend: 'upcoming' | 'past' | 'all'. Default 'upcoming'. */
	timeframe?: 'upcoming' | 'past' | 'all';
};

export const useGetEvents = ({ enabled = true, timeframe = 'upcoming' }: Params = {}) => {
	return useInfiniteQuery({
		// timeframe is part of the key so upcoming/past lists cache independently.
		queryKey: [GetEventsKey, timeframe],
		queryFn: async ({ pageParam }) => {
			const offset = pageParam as number;
			const params = new URLSearchParams();
			if (offset) params.set('offset', String(offset));
			params.set('timeframe', timeframe);
			const qs = params.toString();
			return ApiService.get<IPaginatedResponse<IEventListItem>>(
				`/api/public/events${qs ? `?${qs}` : ''}`,
			);
		},
		initialPageParam: 0,
		getNextPageParam: (lastPage) => lastPage.next_offset ?? undefined,
		enabled,
		staleTime: 60 * 1000,
	});
};
