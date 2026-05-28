import { useMutation } from '@tanstack/react-query';
import { useRecaptcha } from '@/contexts/RecaptchaContext';
import ApiService from '@/services/Api.Service';
import type { IOrderBuyBody, IOrderBuyResponse } from '@/types';

export const useCreateOrder = () => {
	const { executeRecaptcha } = useRecaptcha();
	return useMutation({
		mutationFn: async (body: IOrderBuyBody) => {
			const recaptchaToken = executeRecaptcha ? await executeRecaptcha() : undefined;
			return ApiService.post<IOrderBuyResponse>('/api/public/order/buy', { ...body, recaptchaToken });
		},
	});
};
