import { useEffect, useState } from 'react';

export interface Attendee {
	email: string;
	organizer_id: number;
}

interface State {
	attendee: Attendee | null;
	loading: boolean;
}

/**
 * Client-side auth check. Calls /api/me (our thin proxy) which reads the
 * httpOnly access cookie and verifies/refreshes it server-side.
 */
export function useAttendee(): State {
	const [state, setState] = useState<State>({ attendee: null, loading: true });

	useEffect(() => {
		fetch('/api/me')
			.then(async (res) => {
				if (!res.ok) return setState({ attendee: null, loading: false });
				const data = (await res.json()) as Attendee;
				setState({ attendee: data, loading: false });
			})
			.catch(() => setState({ attendee: null, loading: false }));
	}, []);

	return state;
}
