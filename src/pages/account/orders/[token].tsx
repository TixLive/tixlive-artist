import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Icon } from '@iconify/react';
import AccountLayout from '@/components/account/AccountLayout';
import OrderDetailView from '@/components/account/OrderDetailView';
import { useAttendee } from '@/hooks/useAttendee';
import { useOrganizer } from '@/contexts/OrganizerContext';
import Layout from '@/components/layout/Layout';
import type { NextPageWithLayout } from '@/pages/_app';
import { directGetOrder } from '@/lib/directApi';
import type { IOrderDetail } from '@/types';

const OrderDetailPage: NextPageWithLayout = function OrderDetailPage() {
	const { t } = useTranslation('common');
	const router = useRouter();
	const { organizer } = useOrganizer();
	const { attendee, loading: authLoading } = useAttendee();
	const token = router.query.token as string | undefined;
	const [order, setOrder] = useState<IOrderDetail | null>(null);

	useEffect(() => {
		if (!authLoading && !attendee) { router.replace(`/login?next=${encodeURIComponent(router.asPath)}`); }
	}, [authLoading, attendee, router]);

	useEffect(() => {
		if (!attendee || !token) return;
		directGetOrder(token).then(setOrder).catch(() => {});
	}, [attendee, token]);

	if (authLoading || !attendee || !order) return null;

	return (
		<AccountLayout organizer={organizer} email={attendee.email} active="orders" title={order.event_title}>
			<Link
				href="/account/orders"
				className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] py-2 pl-2.5 pr-4 font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[var(--theme-text-muted)] transition-colors duration-200 hover:text-[var(--theme-text)]"
			>
				<Icon icon="mdi:arrow-left" width={14} />
				{t('order_detail.back_to_orders')}
			</Link>
			<OrderDetailView order={order} locale={router.locale} />
		</AccountLayout>
	);
};

OrderDetailPage.getLayout = (page) => <Layout>{page}</Layout>;

export default OrderDetailPage;

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '@/i18n.config';

export const getStaticPaths = () => ({ paths: [], fallback: true });
export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: await serverSideTranslations(locale ?? 'ro', ['common'], nextI18NextConfig),
  revalidate: 60,
});