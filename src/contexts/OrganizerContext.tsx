import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { directGetSite } from '@/lib/directApi';
import type { IOrganizer } from '@/types';

interface OrganizerCtx {
	organizer: IOrganizer | null;
	loading: boolean;
	error: boolean;
}

const OrganizerContext = createContext<OrganizerCtx>({ organizer: null, loading: true, error: false });

export function OrganizerProvider({ children }: { children: ReactNode }) {
	const [organizer, setOrganizer] = useState<IOrganizer | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(() => {
		directGetSite()
			.then((data) => { setOrganizer(data); setError(false); })
			.catch((e) => { console.error('[OrganizerContext] failed to load site', e); setError(true); })
			.finally(() => setLoading(false));
	}, []);

	return <OrganizerContext.Provider value={{ organizer, loading, error }}>{children}</OrganizerContext.Provider>;
}

export function useOrganizer() {
	return useContext(OrganizerContext);
}
