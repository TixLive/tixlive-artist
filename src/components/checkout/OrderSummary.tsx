import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import { IEventDetail, ICartItem, IAddonCartItem } from '@/types';

interface OrderSummaryProps {
	event: IEventDetail;
	sessionDate: string;
	cart: ICartItem[];
	addonCart?: IAddonCartItem[];
	bundleCart?: Array<{ bundle_id: number; quantity: number; name: string; price: number }>;
	seatLabels?: string[];
}

export default function OrderSummary({ event, sessionDate, cart, addonCart, bundleCart, seatLabels }: OrderSummaryProps) {
	const { t } = useTranslation('common');
	const formatDate = (dateStr: string) => {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		if (isNaN(date.getTime())) return '';
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const ticketCount = cart.reduce((s, i) => s + i.quantity, 0);

	return (
		<div className="overflow-hidden rounded-[18px] bg-[var(--surface)]" style={{ boxShadow: 'var(--shadow-2)' }}>
			{/* Compact event header */}
			<div className="flex items-center gap-3.5 border-b border-[var(--line)] p-4">
				<div className="relative h-[72px] w-[54px] shrink-0 overflow-hidden rounded-[10px] bg-[var(--ink)]">
					{event.poster_url ? (
						<Image src={event.poster_url} alt={event.title} fill className="object-cover" sizes="54px" />
					) : (
						<div className="flex h-full w-full items-center justify-center text-[16px] font-[800] tracking-[-0.022em] text-white">
							{event.title.charAt(0)}
						</div>
					)}
				</div>
				<div className="min-w-0 flex-1">
					<div className="text-[10.5px] font-[700] uppercase tracking-[0.12em] text-[var(--ink-3)]">
						{t('order_summary.event')}
					</div>
					<h2 className="mt-1 truncate text-[15px] font-[700] tracking-[-0.012em] text-[var(--ink)]">
						{event.title}
					</h2>
					<p className="mt-0.5 text-[12px] text-[var(--ink-3)]">{formatDate(sessionDate)}</p>
				</div>
			</div>

			{/* Line items */}
			<div className="flex flex-col gap-2 p-4">
				{cart.map((item) => (
					<div key={item.ticket_type_id} className="flex items-center justify-between gap-3 text-[13.5px]">
						<span className="text-[var(--ink)]">
							<b className="font-[700]">{item.quantity}×</b>
							<span className="ml-2 text-[var(--ink-3)]">{item.ticket_type_name}</span>
						</span>
						<span className="font-[600] tabular-nums text-[var(--ink)]">
							{(item.price * item.quantity).toFixed(2)} {item.currency}
						</span>
					</div>
				))}
				{addonCart && addonCart.length > 0 && (
					<>
						{addonCart.map((addon) => (
							<div key={addon.addon_id} className="flex items-center justify-between gap-3 text-[13px]">
								<span className="text-[var(--ink-3)]">
									<b className="font-[700]">{addon.quantity}×</b>
									<span className="ml-2">{addon.addon_name}</span>
									{addon.per_ticket && (
										<span className="ml-1 text-[10.5px] opacity-60">{t('order_summary.per_ticket')}</span>
									)}
								</span>
								<span className="font-[600] tabular-nums text-[var(--ink)]">
									+{(addon.price * addon.quantity * (addon.per_ticket ? ticketCount : 1)).toFixed(2)} {addon.currency}
								</span>
							</div>
						))}
					</>
				)}

				{bundleCart && bundleCart.length > 0 && bundleCart.map((b) => (
					<div key={b.bundle_id} className="flex items-center justify-between gap-3 text-[13.5px]">
						<span className="text-[var(--ink)]">
							<b className="font-[700]">{b.quantity}×</b>
							<span className="ml-2 text-[var(--ink-3)]">{b.name}</span>
						</span>
						<span className="font-[600] tabular-nums text-[var(--ink)]">
							{(b.price * b.quantity).toFixed(2)} {cart[0]?.currency ?? event.currency}
						</span>
					</div>
				))}

				{seatLabels && seatLabels.length > 0 && (
					<div className="mt-1 border-t border-[var(--line-2)] pt-3">
						<p className="text-[10.5px] font-[700] uppercase tracking-[0.12em] text-[var(--ink-3)]">
							{seatLabels.length === 1 ? t('order_summary.seat') : t('order_summary.seats')}
						</p>
						<div className="mt-2 flex flex-wrap gap-1.5">
							{seatLabels.map((label) => (
								<span
									key={label}
									className="rounded-full bg-[var(--bg-2)] px-2.5 py-[3px] text-[10.5px] font-[700] tabular-nums tracking-[-0.005em] text-[var(--ink-2)]"
								>
									{label}
								</span>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
