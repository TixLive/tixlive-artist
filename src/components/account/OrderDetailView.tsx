import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import type { IOrderDetail } from '@/types';

interface OrderDetailViewProps {
	order: IOrderDetail;
	locale?: string;
}

const STATUS_COLORS: Record<IOrderDetail['status'], { bg: string; fg: string }> = {
	paid: { bg: 'color-mix(in srgb, #16A34A 12%, transparent)', fg: '#16A34A' },
	pending: { bg: 'color-mix(in srgb, #D97706 12%, transparent)', fg: '#D97706' },
	failed: { bg: 'color-mix(in srgb, #DC2626 12%, transparent)', fg: '#DC2626' },
};

export default function OrderDetailView({ order, locale = 'en' }: OrderDetailViewProps) {
	const { t } = useTranslation('common');
	const statusColor = STATUS_COLORS[order.status];

	const formatDate = (dateStr: string) => {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		return date.toLocaleDateString(locale, {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
		});
	};

	const formatTime = (dateStr: string) => {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		return date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
	};

	return (
		<div className="space-y-5">
			{/* Summary card */}
			<div className="overflow-hidden rounded-[22px] border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] shadow-[0_1px_2px_rgba(20,19,18,0.04),0_8px_24px_rgba(20,19,18,0.06)]">
				{/* Header */}
				<div className="flex items-start justify-between gap-4 border-b border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] px-6 py-5">
					<div className="min-w-0">
						<h1 className="font-[family-name:var(--font-display)] text-[1.5rem] font-[700] tracking-[-0.02em] text-[var(--theme-text)]">
							{order.event_title}
						</h1>
						<div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[var(--theme-text-muted)]">
							<div className="flex items-center gap-2">
								<Icon icon="mdi:calendar" width={15} />
								<span className="font-[family-name:var(--font-data)] text-[0.875rem] tabular-nums">
									{formatDate(order.session_date)}
								</span>
							</div>
							<div className="flex items-center gap-2">
								<Icon icon="mdi:clock-outline" width={15} />
								<span className="font-[family-name:var(--font-data)] text-[0.875rem] tabular-nums">
									{formatTime(order.session_date)}
								</span>
							</div>
						</div>
					</div>
					<span
						className="shrink-0 rounded-full px-3 py-1 font-[family-name:var(--font-mono)] text-[0.625rem] font-[600] uppercase tracking-[0.1em]"
						style={{ backgroundColor: statusColor.bg, color: statusColor.fg }}
					>
						{t(`orders.status_${order.status}`)}
					</span>
				</div>

				{/* Items */}
				<div className="px-6 py-5">
					<h2 className="mb-3 font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[var(--theme-text-muted)]">
						{t('order_detail.items')}
					</h2>
					<div className="space-y-2">
						{order.items.map((item, i) => (
							<div
								key={i}
								className="flex items-baseline justify-between gap-4 rounded-xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-bg)] px-4 py-3"
							>
								<div className="min-w-0">
									<p className="truncate font-[family-name:var(--font-display)] text-[0.9375rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)]">{item.name}</p>
									<p className="mt-0.5 font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.1em] tabular-nums text-[var(--theme-text-muted)]">
										× {item.quantity}
									</p>
								</div>
								<p className="font-[family-name:var(--font-data)] text-[0.9375rem] tabular-nums text-[var(--theme-text)]">
									{item.price} {order.currency}
								</p>
							</div>
						))}
					</div>
				</div>

				{/* Total — dark strip */}
				<div className="flex items-center justify-between gap-4 bg-[var(--brand-primary)] px-6 py-5 text-[var(--theme-bg)]">
					<p className="font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] opacity-60">
						{t('order_detail.total')}
					</p>
					<p className="font-[family-name:var(--font-display)] text-[1.5rem] font-[800] leading-none tracking-[-0.02em] tabular-nums">
						{order.total} <span className="text-[0.875rem] font-[700]">{order.currency}</span>
					</p>
				</div>
			</div>

			{/* Download */}
			{order.pdf_url && (
				<a href={order.pdf_url} target="_blank" rel="noopener noreferrer" className="block">
					<Button
						variant="solid"
						size="lg"
						className="w-full rounded-full font-[family-name:var(--font-body)] text-[0.9375rem] font-[700] text-[var(--theme-bg)]"
						style={{ backgroundColor: 'var(--brand-primary)' }}
						startContent={<Icon icon="mdi:download" width={18} />}
					>
						{t('order_detail.download_pdf')}
					</Button>
				</a>
			)}
		</div>
	);
}
