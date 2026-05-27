import { useMutation } from '@tanstack/react-query';
import ApiService from '@/services/Api.Service';
import type { IOrderBuyBody, IOrderBuyResponse } from '@/types';

export const useCreateOrder = () => {
	return useMutation({
		mutationFn: async (body: IOrderBuyBody) => ApiService.post<IOrderBuyResponse>('/api/public/order/buy', body),
	});
};
