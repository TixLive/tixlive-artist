import { useInfiniteQuery } from '@tanstack/react-query';
import ApiService from '@/services/Api.Service';
import type { ITicket, IPaginatedResponse } from '@/types';

export const GetMyTicketsKey = 'my-tickets';

type Params = {
	enabled?: boolean;
};

export const useGetMyTickets = ({ enabled = true }: Params = {}) => {
	return useInfiniteQuery({
		queryKey: [GetMyTicketsKey],
		queryFn: async ({ pageParam }) => {
			const offset = pageParam as number;
			const qs = offset ? `?offset=${offset}` : '';
			return ApiService.get<IPaginatedResponse<ITicket>>(`/api/public/tickets${qs}`);
		},
		initialPageParam: 0,
		getNextPageParam: (lastPage) => lastPage.next_offset ?? undefined,
		enabled,
		retry: 0,
	});
};
