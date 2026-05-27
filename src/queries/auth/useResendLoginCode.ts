import { useMutation } from '@tanstack/react-query';
import ApiService from '@/services/Api.Service';

interface EmailCodeResponse {
	success?: boolean;
	resendTime?: number;
}

export const useResendLoginCode = () => {
	return useMutation({
		mutationFn: async (email: string) => {
			return ApiService.post<EmailCodeResponse>('/api/public/auth/email-code', { email, resend: true });
		},
	});
};
