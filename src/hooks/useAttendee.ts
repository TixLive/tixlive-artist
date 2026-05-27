import { useQuery } from '@tanstack/react-query';
import { getMe, getAccessToken, getRefreshToken } from '@/lib/attendeeApi';

export interface Attendee {
	email: string;
}

interface State {
	attendee: Attendee | null;
	loading: boolean;
}

/**
 * Client-side auth check. Reads the access cookie, and if absent but a refresh
 * cookie exists, triggers rotation transparently via `getMe`. Cached across
 * pages via TanStack Query so navigation reuses the result.
 */
export function useAttendee(): State {
	const { data, isLoading } = useQuery<Attendee | null>({
		queryKey: ['attendee'],
		queryFn: async () => {
			if (!getAccessToken() && !getRefreshToken()) return null;
			try {
				const me = await getMe();
				return { email: me.email };
			} catch {
				return null;
			}
		},
		staleTime: 5 * 60 * 1000,
		retry: false,
	});

	return { attendee: data ?? null, loading: isLoading };
}
