import { useQuery } from '@tanstack/react-query';
import ApiService, { ApiError } from '@/services/Api.Service';
import type { IOrganizerPage } from '@/types';

export const GetPageKey = 'page';

type Params = {
	pageType: string | null | undefined;
	enabled?: boolean;
};

export const useGetPage = ({ pageType, enabled = true }: Params) => {
	return useQuery({
		queryKey: [GetPageKey, pageType],
		queryFn: async (): Promise<IOrganizerPage | null> => {
			try {
				return await ApiService.get<IOrganizerPage>(`/api/public/pages/${encodeURIComponent(pageType!)}`);
			} catch (err) {
				if (err instanceof ApiError && err.status === 404) return null;
				throw err;
			}
		},
		enabled: !!pageType && enabled,
		staleTime: 5 * 60 * 1000,
	});
};
