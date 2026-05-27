import { useQuery } from '@tanstack/react-query';
import ApiService from '@/services/Api.Service';
import type { IOrderDetail } from '@/types';

export const GetOrderByTokenKey = 'order-by-token';

type Params = {
	token: string | null;
	enabled?: boolean;
	refetchInterval?: number | false | ((q: { state: { data: IOrderDetail | undefined } }) => number | false);
};

export const useGetOrderByToken = ({ token, enabled = true, refetchInterval }: Params) => {
	return useQuery({
		queryKey: [GetOrderByTokenKey, token],
		queryFn: async () => ApiService.get<IOrderDetail>(`/api/public/order/${encodeURIComponent(token!)}`),
		enabled: !!token && enabled,
		retry: 0,
		refetchInterval: refetchInterval as never,
	});
};
