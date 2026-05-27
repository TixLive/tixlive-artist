import { useInfiniteQuery } from '@tanstack/react-query';
import ApiService from '@/services/Api.Service';
import type { IEventListItem } from '@/types';

export const GetEventsKey = 'events';

interface EventsPage {
	events: IEventListItem[];
	total: number;
}

type Params = {
	enabled?: boolean;
};

export const useGetEvents = ({ enabled = true }: Params = {}) => {
	return useInfiniteQuery({
		queryKey: [GetEventsKey],
		queryFn: async ({ pageParam }) => {
			const offset = pageParam as number;
			const qs = offset ? `?offset=${offset}` : '';
			return ApiService.get<EventsPage>(`/api/public/events${qs}`);
		},
		initialPageParam: 0,
		getNextPageParam: (lastPage, pages) => {
			const loaded = pages.reduce((sum, p) => sum + p.events.length, 0);
			return loaded < lastPage.total ? loaded : undefined;
		},
		enabled,
		staleTime: 60 * 1000,
	});
};
