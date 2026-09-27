import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRecaptcha } from '@/contexts/RecaptchaContext';
import ApiService, { setTokens } from '@/services/Api.Service';
import { clearUserScopedQueries } from '@/queries/userScopedQueries';

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
	const queryClient = useQueryClient();
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
		onSuccess: () => {
			// Belt-and-suspenders alongside signOut()'s own clear: a fresh login is the exact
			// moment identity changes, so any data still cached under a previous buyer's
			// session (e.g. a tab that was never explicitly signed out) is dropped here too.
			clearUserScopedQueries(queryClient);
		},
	});
};
