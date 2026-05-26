import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { directGetSite } from '@/lib/directApi';
import type { IOrganizer } from '@/types';

interface OrganizerCtx {
	organizer: IOrganizer | null;
	loading: boolean;
}

const OrganizerContext = createContext<OrganizerCtx>({ organizer: null, loading: true });

export function OrganizerProvider({ children }: { children: ReactNode }) {
	const [organizer, setOrganizer] = useState<IOrganizer | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		directGetSite()
			.then(setOrganizer)
			.catch(() => {})
			.finally(() => setLoading(false));
	}, []);

	return <OrganizerContext.Provider value={{ organizer, loading }}>{children}</OrganizerContext.Provider>;
}

export function useOrganizer() {
	return useContext(OrganizerContext);
}
