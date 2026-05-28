import { useMutation } from '@tanstack/react-query';
import { useRecaptcha } from '@/contexts/RecaptchaContext';
import ApiService, { setTokens } from '@/services/Api.Service';

interface ValidateResponse {
	success?: boolean;
	accessToken?: string;
	refreshToken?: string;
	accessExpiresInDays?: number;
	refreshExpiresInDays?: number;
	email?: string;
	organizer_id?: number;
}

interface ValidatedSession {
	email: string;
	organizer_id: number;
}

interface ValidateParams {
	email: string;
	code: string;
}

export const useValidateLoginCode = () => {
	const { executeRecaptcha } = useRecaptcha();
	return useMutation({
		mutationFn: async ({ email, code }: ValidateParams): Promise<ValidatedSession> => {
			const recaptchaToken = executeRecaptcha ? await executeRecaptcha() : undefined;
			const data = await ApiService.post<ValidateResponse>('/api/public/auth/email-code/validate', {
				email,
				code,
				recaptchaToken,
			});
			if (
				typeof data.accessToken !== 'string' ||
				typeof data.refreshToken !== 'string' ||
				typeof data.accessExpiresInDays !== 'number' ||
				typeof data.refreshExpiresInDays !== 'number'
			) {
				throw new Error('invalid_code');
			}
			setTokens(data.accessToken, data.refreshToken, data.accessExpiresInDays, data.refreshExpiresInDays);
			return { email: data.email ?? email, organizer_id: data.organizer_id ?? 0 };
		},
	});
};
