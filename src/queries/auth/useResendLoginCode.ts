import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'next-i18next';
import { useRecaptcha } from '@/contexts/RecaptchaContext';
import ApiService from '@/services/Api.Service';
import { normalizeLocale } from '@/lib/staticI18n';

interface EmailCodeResponse {
	success?: boolean;
	resendTime?: number;
}

export const useResendLoginCode = () => {
	const { executeRecaptcha } = useRecaptcha();
	const { i18n } = useTranslation();
	return useMutation({
		mutationFn: async (email: string) => {
			const recaptchaToken = executeRecaptcha
				? await executeRecaptcha()
				: undefined;
			return ApiService.post<EmailCodeResponse>('/api/public/auth/email-code', {
				email,
				resend: true,
				recaptchaToken,
				locale: normalizeLocale(i18n.language),
			});
		},
	});
};
