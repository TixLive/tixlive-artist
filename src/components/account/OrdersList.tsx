import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import type { IOrderDetail } from '@/types';
import OrderCard from './OrderCard';

interface OrdersListProps {
	orders: IOrderDetail[];
	locale?: string;
}

export default function OrdersList({ orders, locale }: OrdersListProps) {
	const { t } = useTranslation('common');

	if (orders.length === 0) {
		return (
			<div className="flex flex-col items-center gap-4 py-20 text-center">
				<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--theme-surface)]">
					<Icon icon="mdi:receipt-text-outline" width={28} className="text-[var(--theme-text-muted)]" />
				</div>
				<div>
					<p className="text-[1rem] font-medium text-[var(--theme-text-muted)]">
						{t('orders.empty_title')}
					</p>
					<Link
						href="/"
						className="mt-2 inline-flex items-center gap-1 text-[0.875rem] font-medium text-[var(--brand-accent)] transition-colors duration-200 hover:text-[var(--theme-text)]"
					>
						{t('orders.empty_cta')}
						<Icon icon="mdi:arrow-right" width={16} />
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{orders.map((order) => (
				<OrderCard key={order.id} order={order} locale={locale} />
			))}
		</div>
	);
}
