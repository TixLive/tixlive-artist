import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import AccountLayout from '@/components/account/AccountLayout';
import OrdersList from '@/components/account/OrdersList';
import { getSite, getMyOrders } from '@/lib/api';
import { withAttendeeAuth } from '@/middleware/Attendee.Middleware';
import { ACCESS_COOKIE } from '@/lib/cookies';
import type { IOrderDetail, IOrganizer } from '@/types';

interface OrdersPageProps {
	organizer: IOrganizer;
	orders: IOrderDetail[];
	email: string;
	brandPrimary: string;
	brandAccent: string;
}

export default function OrdersPage({
	organizer,
	orders,
	email,
	brandPrimary,
	brandAccent,
}: OrdersPageProps) {
	const { t } = useTranslation('common');
	const router = useRouter();

	return (
		<AccountLayout
			organizer={organizer}
			brandPrimary={brandPrimary}
			brandAccent={brandAccent}
			email={email}
			active="orders"
			title={t('account.orders')}
		>
			<div className="mb-6">
				<h1 className="font-[family-name:var(--font-display)] text-[1.5rem] font-[800] tracking-tight text-[var(--theme-text)]">
					{t('account.orders')}
				</h1>
			</div>
			<OrdersList orders={orders} locale={router.locale} />
		</AccountLayout>
	);
}

export const getServerSideProps = withAttendeeAuth<OrdersPageProps>(async (ctx, attendee) => {
	const token = ctx.req.cookies?.[ACCESS_COOKIE] || '';
	const [organizer, orders] = await Promise.all([getSite(), getMyOrders(token)]);

	return {
		props: {
			organizer,
			orders,
			email: attendee.email,
			brandPrimary: organizer.brand_primary_color || '',
			brandAccent: organizer.brand_accent_color || '',
			...(await serverSideTranslations(ctx.locale ?? 'en', ['common'])),
		},
	};
});
