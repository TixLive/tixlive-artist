import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import type { IOrderDetail } from '@/types';

interface OrderCardProps {
	order: IOrderDetail;
	locale?: string;
}

const STATUS_COLORS: Record<IOrderDetail['status'], { bg: string; fg: string }> = {
	paid: { bg: 'color-mix(in srgb, #16A34A 12%, transparent)', fg: '#16A34A' },
	pending: { bg: 'color-mix(in srgb, #D97706 12%, transparent)', fg: '#D97706' },
	failed: { bg: 'color-mix(in srgb, #DC2626 12%, transparent)', fg: '#DC2626' },
};

export default function OrderCard({ order, locale = 'en' }: OrderCardProps) {
	const { t } = useTranslation('common');

	const itemsCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
	const status = order.status;
	const statusColor = STATUS_COLORS[status];

	const formattedDate = order.session_date
		? new Date(order.session_date).toLocaleDateString(locale, {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
			})
		: '';

	return (
		<Link href={`/account/orders/${order.id}`} className="group block">
			<article className="flex items-center gap-4 rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-4 transition-all duration-200 hover:border-[color-mix(in_srgb,var(--theme-text)_15%,transparent)] hover:shadow-[0_4px_12px_rgba(20,19,18,0.06)]">
				<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--theme-text)_6%,transparent)]">
					<Icon icon="mdi:receipt-text-outline" width={24} className="text-[var(--theme-text-muted)]" />
				</div>

				<div className="min-w-0 flex-1">
					<h3 className="truncate font-[family-name:var(--font-display)] text-[1rem] font-[700] text-[var(--theme-text)]">
						{order.event_title}
					</h3>
					<p className="mt-0.5 font-[family-name:var(--font-data)] text-[0.8125rem] text-[var(--theme-text-muted)]">
						{formattedDate}
					</p>
					<div className="mt-1.5 flex items-center gap-2 text-[0.75rem] text-[var(--theme-text-muted)]">
						<span className="font-[family-name:var(--font-data)] tabular-nums">
							{t('orders.items_count', { count: itemsCount })}
						</span>
						<span>·</span>
						<span className="font-[family-name:var(--font-data)] tabular-nums text-[var(--theme-text)]">
							{order.total} {order.currency}
						</span>
					</div>
				</div>

				<div className="flex shrink-0 flex-col items-end gap-2">
					<span
						className="rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold"
						style={{ backgroundColor: statusColor.bg, color: statusColor.fg }}
					>
						{t(`orders.status_${status}`)}
					</span>
					<Icon
						icon="mdi:chevron-right"
						width={18}
						className="text-[var(--theme-text-muted)] transition-colors duration-200 group-hover:text-[var(--theme-text)]"
					/>
				</div>
			</article>
		</Link>
	);
}
