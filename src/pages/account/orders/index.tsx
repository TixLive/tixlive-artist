import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import AccountLayout from '@/components/account/AccountLayout';
import OrdersList from '@/components/account/OrdersList';
import { useAttendee } from '@/hooks/useAttendee';
import { getMyOrders } from '@/lib/attendeeApi';
import { useOrganizer } from '@/contexts/OrganizerContext';
import Layout from '@/components/layout/Layout';
import type { NextPageWithLayout } from '@/pages/_app';
import type { IOrderDetail } from '@/types';

const OrdersPage: NextPageWithLayout = function OrdersPage() {
	const { t } = useTranslation('common');
	const router = useRouter();
	const { organizer } = useOrganizer();
	const { attendee, loading: authLoading } = useAttendee();
	const [orders, setOrders] = useState<IOrderDetail[]>([]);

	useEffect(() => {
		if (!authLoading && !attendee) { router.replace(`/login?next=${encodeURIComponent(router.asPath)}`); }
	}, [authLoading, attendee, router]);

	useEffect(() => {
		if (!attendee) return;
		let cancelled = false;
		getMyOrders()
			.then((data) => { if (!cancelled) setOrders(data); })
			.catch(() => {});
		return () => { cancelled = true; };
	}, [attendee]);

	if (authLoading || !attendee) return null;

	return (
		<AccountLayout organizer={organizer} email={attendee.email} active="orders" title={t('account.orders')}>
			<div className="mb-8">
				<h1 className="font-[family-name:var(--font-display)] text-[1.75rem] font-[700] tracking-[-0.02em] text-[var(--theme-text)] sm:text-[2rem]">
					{t('account.orders')}
				</h1>
			</div>
			<OrdersList orders={orders} locale={router.locale} />
		</AccountLayout>
	);
};

OrdersPage.getLayout = (page) => <Layout>{page}</Layout>;

export default OrdersPage;

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '@/i18n.config';

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: await serverSideTranslations(locale ?? 'ro', ['common'], nextI18NextConfig),
});