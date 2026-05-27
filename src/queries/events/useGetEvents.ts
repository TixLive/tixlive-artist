import { useInfiniteQuery } from '@tanstack/react-query';
import ApiService from '@/services/Api.Service';
import type { IEventListItem, IPaginatedResponse } from '@/types';

export const GetEventsKey = 'events';

type Params = {
	enabled?: boolean;
};

export const useGetEvents = ({ enabled = true }: Params = {}) => {
	return useInfiniteQuery({
		queryKey: [GetEventsKey],
		queryFn: async ({ pageParam }) => {
			const offset = pageParam as number;
			const qs = offset ? `?offset=${offset}` : '';
			return ApiService.get<IPaginatedResponse<IEventListItem>>(`/api/public/events${qs}`);
		},
		initialPageParam: 0,
		getNextPageParam: (lastPage) => lastPage.next_offset ?? undefined,
		enabled,
		staleTime: 60 * 1000,
	});
};
