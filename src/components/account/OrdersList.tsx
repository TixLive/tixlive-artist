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
			<div
				className="flex flex-col items-center gap-4 rounded-[18px] bg-[var(--surface)] py-16 text-center"
				style={{ boxShadow: 'var(--shadow-2)' }}
			>
				<div className="flex h-16 w-16 items-center justify-center rounded-[14px] bg-[var(--bg-2)] text-[var(--ink-3)]">
					<Icon icon="mdi:receipt-text-outline" width={26} />
				</div>
				<div>
					<p className="m-0 text-[15px] font-[500] text-[var(--ink-3)]">{t('orders.empty_title')}</p>
					<Link
						href="/"
						className="mt-2 inline-flex items-center gap-1 text-[14px] font-[600] tracking-[-0.005em] text-[var(--ink)] underline-offset-2 hover:underline"
					>
						{t('orders.empty_cta')} <Icon icon="mdi:arrow-right" width={14} />
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2.5">
			{orders.map((order) => (
				<OrderCard key={order.id} order={order} locale={locale} />
			))}
		</div>
	);
}
