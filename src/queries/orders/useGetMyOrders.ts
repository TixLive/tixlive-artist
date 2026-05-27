import { useQuery } from '@tanstack/react-query';
import ApiService from '@/services/Api.Service';
import type { IOrderDetail } from '@/types';

export const GetMyOrdersKey = 'my-orders';

type Params = {
	enabled?: boolean;
};

export const useGetMyOrders = ({ enabled = true }: Params = {}) => {
	return useQuery({
		queryKey: [GetMyOrdersKey],
		queryFn: async () => ApiService.get<IOrderDetail[]>('/api/public/orders'),
		enabled,
		retry: 0,
	});
};
