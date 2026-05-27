import { createContext, useContext, type ReactNode } from 'react';
import { useGetSite } from '@/queries/site/useGetSite';
import type { IOrganizer } from '@/types';

interface OrganizerCtx {
	organizer: IOrganizer | null;
	loading: boolean;
	error: boolean;
}

const OrganizerContext = createContext<OrganizerCtx>({ organizer: null, loading: true, error: false });

export function OrganizerProvider({ children }: { children: ReactNode }) {
	const { data, isLoading, isError } = useGetSite();
	return (
		<OrganizerContext.Provider value={{ organizer: data ?? null, loading: isLoading, error: isError }}>
			{children}
		</OrganizerContext.Provider>
	);
}

export function useOrganizer() {
	return useContext(OrganizerContext);
}
