import { useQuery } from '@tanstack/react-query';
import ApiService from '@/services/Api.Service';
import type { IOrganizer } from '@/types';

export const GetSiteKey = 'site';

type Params = {
	enabled?: boolean;
};

export const useGetSite = ({ enabled = true }: Params = {}) => {
	return useQuery({
		queryKey: [GetSiteKey],
		queryFn: async () => ApiService.get<IOrganizer>('/api/public/site'),
		enabled,
		staleTime: 5 * 60 * 1000,
	});
};
