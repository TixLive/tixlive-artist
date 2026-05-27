import { useMutation } from '@tanstack/react-query';
import ApiService from '@/services/Api.Service';
import type { IPromoValidateResponse } from '@/types';

interface ValidateParams {
	eventId: number;
	code: string;
}

export const useValidatePromo = () => {
	return useMutation({
		mutationFn: async ({ eventId, code }: ValidateParams) =>
			ApiService.post<IPromoValidateResponse>('/api/public/promo/validate', { event_id: eventId, code }),
	});
};
