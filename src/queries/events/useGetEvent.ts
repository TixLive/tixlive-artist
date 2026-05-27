import { useQuery, keepPreviousData } from '@tanstack/react-query';
import ApiService, { ApiError } from '@/services/Api.Service';
import type { IEventDetail } from '@/types';

export const GetEventKey = 'event';

type Params = {
	slug: string | null | undefined;
	enabled?: boolean;
};

async function fetchEvent(slug: string): Promise<IEventDetail | null> {
	try {
		return await ApiService.get<IEventDetail>(`/api/public/event/${encodeURIComponent(slug)}`);
	} catch (err) {
		if (err instanceof ApiError && err.status === 404) return null;
		throw err;
	}
}

export const useGetEvent = ({ slug, enabled = true }: Params) => {
	return useQuery({
		queryKey: [GetEventKey, slug],
		queryFn: async () => fetchEvent(slug!),
		enabled: !!slug && enabled,
		staleTime: 60 * 1000,
		placeholderData: keepPreviousData,
	});
};

// Used by ApiService callers that need raw access (prefetch, orchestrated useEffect).
export { fetchEvent };
