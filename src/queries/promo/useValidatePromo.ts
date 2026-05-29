import { useMutation } from '@tanstack/react-query';
import { useRecaptcha } from '@/contexts/RecaptchaContext';
import ApiService from '@/services/Api.Service';
import type { IPromoValidateResponse } from '@/types';

interface ValidateParams {
	eventId: number;
	code: string;
}

export const useValidatePromo = () => {
	const { executeRecaptcha } = useRecaptcha();
	return useMutation({
		mutationFn: async ({ eventId, code }: ValidateParams) => {
			const recaptchaToken = executeRecaptcha ? await executeRecaptcha() : undefined;
			return ApiService.post<IPromoValidateResponse>('/api/public/promo/validate', {
				event_id: eventId,
				code,
				recaptchaToken,
			});
		},
	});
};
