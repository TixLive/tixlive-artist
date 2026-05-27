import { useMutation, useQueryClient } from '@tanstack/react-query';
import ApiService from '@/services/Api.Service';
import { GetMeKey } from '@/queries/me/useGetMe';
import type { IMe, IMeUpdate } from '@/types';

export const useUpdateMe = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (body: IMeUpdate) => ApiService.patch<IMe>('/api/public/me', body),
		onSuccess: (data) => {
			queryClient.setQueryData([GetMeKey], data);
		},
	});
};
