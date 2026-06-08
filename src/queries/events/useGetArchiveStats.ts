import { useQuery } from '@tanstack/react-query';
import ApiService from '@/services/Api.Service';
import type { IArchiveStats } from '@/types';

export const GetArchiveStatsKey = 'archive-stats';

/**
 * Organizer-wide archive aggregates (total past events, distinct cities, year span) for
 * the timeline header — one call, independent of how many archive pages are loaded.
 */
export const useGetArchiveStats = ({ enabled = true }: { enabled?: boolean } = {}) => {
	return useQuery({
		queryKey: [GetArchiveStatsKey],
		queryFn: async () => ApiService.get<IArchiveStats>('/api/public/archive-stats'),
		enabled,
		staleTime: 5 * 60 * 1000,
	});
};
