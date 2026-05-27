import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import AccountLayout from '@/components/account/AccountLayout';
import OrdersList from '@/components/account/OrdersList';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useGetMyOrders } from '@/queries/orders/useGetMyOrders';
import { useOrganizer } from '@/contexts/OrganizerContext';
import Layout from '@/components/layout/Layout';
import type { NextPageWithLayout } from '@/pages/_app';

function OrdersPageContent() {
	const { t } = useTranslation('common');
	const router = useRouter();
	const { organizer } = useOrganizer();
	const { user } = useAuth();
	const { data: orders = [] } = useGetMyOrders();

	return (
		<AccountLayout organizer={organizer} email={user!.email} active="orders" title={t('account.orders')}>
			<div className="mb-8">
				<h1 className="font-[family-name:var(--font-display)] text-[1.75rem] font-[700] tracking-[-0.02em] text-[var(--theme-text)] sm:text-[2rem]">
					{t('account.orders')}
				</h1>
			</div>
			<OrdersList orders={orders} locale={router.locale} />
		</AccountLayout>
	);
}

const OrdersPage: NextPageWithLayout = function OrdersPage() {
	return (
		<ProtectedRoute>
			<OrdersPageContent />
		</ProtectedRoute>
	);
};

OrdersPage.getLayout = (page) => <Layout>{page}</Layout>;

export default OrdersPage;

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '@/i18n.config';

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: await serverSideTranslations(locale ?? 'ro', ['common'], nextI18NextConfig),
});
