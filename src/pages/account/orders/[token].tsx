import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '@/i18n.config';
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
				className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] py-2 pl-2.5 pr-4 font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[var(--theme-text-muted)] transition-colors duration-200 hover:text-[var(--theme-text)]"
			>
				<Icon icon="mdi:arrow-left" width={14} />
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
				...(await serverSideTranslations(ctx.locale ?? 'en', ['common'], nextI18NextConfig)),
			},
		};
	} catch {
		return { notFound: true };
	}
});
