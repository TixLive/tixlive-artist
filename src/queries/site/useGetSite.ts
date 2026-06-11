import { useQuery } from '@tanstack/react-query';
import ApiService from '@/services/Api.Service';
import StorageService from '@/services/Storage.Service';
import type { IOrganizer } from '@/types';

export const GetSiteKey = 'site';

// Site config is identical for every visitor of a given domain and changes
// rarely, so we cache it in localStorage. On a hard refresh the React Query
// cache (in-memory) is empty, which used to flash the navbar logo while
// `/api/public/site` was in flight. Seeding from localStorage makes the logo
// available on first paint; the query still revalidates in the background.
const CACHE_KEY = 'site_config';

type Params = {
	enabled?: boolean;
};

export const useGetSite = ({ enabled = true }: Params = {}) => {
	return useQuery({
		queryKey: [GetSiteKey],
		queryFn: async () => {
			const data = await ApiService.get<IOrganizer>('/api/public/site');
			StorageService.set(CACHE_KEY, data);
			return data;
		},
		enabled,
		staleTime: 5 * 60 * 1000,
		initialData: () => StorageService.get<IOrganizer>(CACHE_KEY) ?? undefined,
		// Treat the cached value as stale so we always revalidate on mount —
		// the cached config is shown instantly, fresh data swaps in silently.
		initialDataUpdatedAt: 0,
	});
};
