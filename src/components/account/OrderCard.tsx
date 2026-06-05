import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import type { IOrderDetail } from '@/types';
import { formatEventDate } from '@/lib/datetime';

interface OrderCardProps {
	order: IOrderDetail;
	locale?: string;
}

const STATUS_COLORS: Record<IOrderDetail['status'], { bg: string; fg: string }> = {
	paid: { bg: 'rgba(61, 123, 92, 0.14)', fg: '#2A5A42' },
	pending: { bg: 'rgba(217, 137, 46, 0.14)', fg: '#8B5A1F' },
	failed: { bg: 'rgba(199, 62, 62, 0.12)', fg: '#9E2E2E' },
};

export default function OrderCard({ order, locale = 'en' }: OrderCardProps) {
	const { t } = useTranslation('common');

	const itemsCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
	const status = order.status;
	const statusColor = STATUS_COLORS[status];

	// Date in the venue's timezone (not the viewer's).
	const formattedDate = formatEventDate(order.session_date, order.timezone, locale, {
		weekday: undefined,
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});

	return (
		<Link href={`/account/orders/${order.id}`} className="group block">
			<article
				className="flex items-center gap-4 rounded-[16px] bg-[var(--surface)] p-4 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]"
				style={{ boxShadow: 'var(--shadow-2)' }}
			>
				<div className="flex h-[68px] w-[52px] shrink-0 items-center justify-center rounded-[10px] bg-[var(--bg-2)] text-[var(--ink-3)]">
					<Icon icon="mdi:receipt-text-outline" width={20} />
				</div>

				<div className="min-w-0 flex-1 leading-[1.35]">
					{formattedDate && (
						<div className="text-[10.5px] font-[700] uppercase tracking-[0.14em] text-[var(--ink-3)]">
							{formattedDate}
						</div>
					)}
					<h3 className="m-0 mt-1 truncate text-[15px] font-[700] tracking-[-0.012em] text-[var(--ink)]">
						{order.event_title}
					</h3>
					<div className="mt-1 text-[12px] font-[500] text-[var(--ink-3)]">
						<span className="tabular-nums">{t('orders.items_count', { count: itemsCount })}</span>
						<span className="mx-1.5 opacity-50">·</span>
						<span className="tabular-nums">
							{order.total} {order.currency}
						</span>
					</div>
				</div>

				<div className="flex shrink-0 items-center gap-3">
					<span
						className="rounded-full px-2.5 py-1 text-[10.5px] font-[800] uppercase tracking-[0.08em]"
						style={{ backgroundColor: statusColor.bg, color: statusColor.fg }}
					>
						{t(`orders.status_${status}`)}
					</span>
					<Icon
						icon="mdi:chevron-right"
						width={14}
						className="text-[var(--ink-3)] transition-colors duration-150 group-hover:text-[var(--ink)]"
					/>
				</div>
			</article>
		</Link>
	);
}
