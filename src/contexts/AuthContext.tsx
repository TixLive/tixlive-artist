import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGetMe, GetMeKey } from '@/queries/me/useGetMe';
import { clearTokens } from '@/services/Api.Service';
import type { IMe } from '@/types';

interface AuthContextValue {
	user: IMe | null;
	loading: boolean;
	signOut: () => void;
	refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
	user: null,
	loading: true,
	signOut: () => {},
	refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
	const queryClient = useQueryClient();
	const { data, isLoading, refetch } = useGetMe();

	const signOut = useCallback(() => {
		clearTokens();
		queryClient.setQueryData([GetMeKey], null);
	}, [queryClient]);

	const refresh = useCallback(async () => {
		await refetch();
	}, [refetch]);

	const value = useMemo<AuthContextValue>(
		() => ({
			user: data ?? null,
			loading: isLoading,
			signOut,
			refresh,
		}),
		[data, isLoading, signOut, refresh]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	return useContext(AuthContext);
}
