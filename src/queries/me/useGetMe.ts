import { useQuery } from '@tanstack/react-query';
import ApiService, { getAccessToken, getRefreshToken } from '@/services/Api.Service';
import type { IMe } from '@/types';

export const GetMeKey = 'me';

type Params = {
	enabled?: boolean;
};

export const useGetMe = ({ enabled = true }: Params = {}) => {
	return useQuery({
		queryKey: [GetMeKey],
		queryFn: async () => ApiService.get<IMe>('/api/public/me'),
		enabled: enabled && (!!getAccessToken() || !!getRefreshToken()),
		staleTime: 5 * 60 * 1000,
		retry: 0,
	});
};
