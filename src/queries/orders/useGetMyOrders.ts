import { useInfiniteQuery } from '@tanstack/react-query';
import ApiService from '@/services/Api.Service';
import type { IOrderDetail, IPaginatedResponse } from '@/types';

export const GetMyOrdersKey = 'my-orders';

type Params = {
	enabled?: boolean;
};

export const useGetMyOrders = ({ enabled = true }: Params = {}) => {
	return useInfiniteQuery({
		queryKey: [GetMyOrdersKey],
		queryFn: async ({ pageParam }) => {
			const offset = pageParam as number;
			const qs = offset ? `?offset=${offset}` : '';
			return ApiService.get<IPaginatedResponse<IOrderDetail>>(`/api/public/orders${qs}`);
		},
		initialPageParam: 0,
		getNextPageParam: (lastPage) => lastPage.next_offset ?? undefined,
		enabled,
		retry: 0,
	});
};
