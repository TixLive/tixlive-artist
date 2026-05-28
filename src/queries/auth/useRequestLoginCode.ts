import { useMutation } from '@tanstack/react-query';
import { useRecaptcha } from '@/contexts/RecaptchaContext';
import ApiService from '@/services/Api.Service';

interface EmailCodeResponse {
	success?: boolean;
	resendTime?: number;
}

export const useRequestLoginCode = () => {
	const { executeRecaptcha } = useRecaptcha();
	return useMutation({
		mutationFn: async (email: string) => {
			const recaptchaToken = executeRecaptcha ? await executeRecaptcha() : undefined;
			return ApiService.post<EmailCodeResponse>('/api/public/auth/email-code', { email, recaptchaToken });
		},
	});
};
