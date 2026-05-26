import { useQuery } from '@tanstack/react-query';

export interface Attendee {
	email: string;
}

interface State {
	attendee: Attendee | null;
	loading: boolean;
}

/**
 * Client-side auth check. Calls /api/me (our thin proxy) which reads the
 * httpOnly access cookie and verifies/refreshes it server-side. Cached
 * across pages via TanStack Query so account-page navigation reuses the
 * result instead of refetching on every mount.
 */
export function useAttendee(): State {
	const { data, isLoading } = useQuery<Attendee | null>({
		queryKey: ['attendee'],
		queryFn: async () => {
			const res = await fetch('/api/me');
			if (!res.ok) return null;
			const body = (await res.json().catch(() => null)) as { email?: unknown } | null;
			if (!body || typeof body.email !== 'string') return null;
			return { email: body.email };
		},
		staleTime: 5 * 60 * 1000,
		retry: false,
	});

	return { attendee: data ?? null, loading: isLoading };
}
