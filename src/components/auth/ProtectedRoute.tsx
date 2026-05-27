import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
	children: ReactNode;
	fallback?: ReactNode;
}

export function ProtectedRoute({ children, fallback = null }: ProtectedRouteProps) {
	const { user, loading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!loading && !user) {
			router.replace(`/login?from=${encodeURIComponent(router.asPath)}`);
		}
	}, [user, loading, router]);

	if (loading || !user) return <>{fallback}</>;
	return <>{children}</>;
}
