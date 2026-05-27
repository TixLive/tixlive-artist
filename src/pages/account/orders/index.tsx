import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import AccountLayout from '@/components/account/AccountLayout';
import OrdersList from '@/components/account/OrdersList';
import LoadMore from '@/components/common/LoadMore';
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
	const {
		data,
		isLoading,
		fetchNextPage,
		isFetchingNextPage,
		hasNextPage,
		isError,
	} = useGetMyOrders();

	const orders = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);

	return (
		<AccountLayout organizer={organizer} email={user!.email} active="orders" title={t('account.orders')}>
			<div className="mb-8">
				<h1 className="font-[family-name:var(--font-display)] text-[1.75rem] font-[700] tracking-[-0.02em] text-[var(--theme-text)] sm:text-[2rem]">
					{t('account.orders')}
				</h1>
			</div>
			{isLoading ? (
				<div className="space-y-3" role="status" aria-label={t('common.loading')}>
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							key={i}
							className="flex items-center gap-4 rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-4"
						>
							<div className="skeleton h-14 w-14 shrink-0 rounded-xl" />
							<div className="min-w-0 flex-1 space-y-2">
								<div className="skeleton h-3 w-24 rounded-md" />
								<div className="skeleton h-4 w-2/3 rounded-md" />
								<div className="skeleton h-3 w-40 rounded-md" />
							</div>
							<div className="skeleton h-6 w-16 shrink-0 rounded-full" />
						</div>
					))}
				</div>
			) : (
				<>
					<OrdersList orders={orders} locale={router.locale} />
					<LoadMore
						hasNextPage={hasNextPage}
						isFetching={isFetchingNextPage}
						isError={isError}
						onLoadMore={fetchNextPage}
					/>
				</>
			)}
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

import { staticI18nProps } from '@/lib/staticI18n';

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: staticI18nProps(locale),
});
