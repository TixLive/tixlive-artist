import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { Icon } from '@iconify/react';
import AccountLayout from '@/components/account/AccountLayout';
import OrderDetailView from '@/components/account/OrderDetailView';
import { getSite, getOrder } from '@/lib/api';
import { withAttendeeAuth } from '@/middleware/Attendee.Middleware';
import type { IOrderDetail, IOrganizer } from '@/types';

interface OrderDetailPageProps {
	organizer: IOrganizer;
	order: IOrderDetail;
	email: string;
	brandPrimary: string;
	brandAccent: string;
}

export default function OrderDetailPage({
	organizer,
	order,
	email,
	brandPrimary,
	brandAccent,
}: OrderDetailPageProps) {
	const { t } = useTranslation('common');
	const router = useRouter();

	return (
		<AccountLayout
			organizer={organizer}
			brandPrimary={brandPrimary}
			brandAccent={brandAccent}
			email={email}
			active="orders"
			title={order.event_title}
		>
			<Link
				href="/account/orders"
				className="mb-6 inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-[var(--theme-text-muted)] transition-colors duration-200 hover:text-[var(--theme-text)]"
			>
				<Icon icon="mdi:arrow-left" width={16} />
				{t('order_detail.back_to_orders')}
			</Link>

			<OrderDetailView order={order} locale={router.locale} />
		</AccountLayout>
	);
}

export const getServerSideProps = withAttendeeAuth<OrderDetailPageProps>(async (ctx, attendee) => {
	const token = ctx.params?.token as string | undefined;
	if (!token) {
		return { notFound: true };
	}

	try {
		const [organizer, order] = await Promise.all([getSite(), getOrder(token)]);

		return {
			props: {
				organizer,
				order,
				email: attendee.email,
				brandPrimary: organizer.brand_primary_color || '',
				brandAccent: organizer.brand_accent_color || '',
				...(await serverSideTranslations(ctx.locale ?? 'en', ['common'])),
			},
		};
	} catch {
		return { notFound: true };
	}
});
