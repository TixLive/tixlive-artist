import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AccountIndexPage() {
	const router = useRouter();
	useEffect(() => { router.replace('/account/orders'); }, [router]);
	return null;
}
