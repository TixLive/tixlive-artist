import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import { ITicketType } from '@/types';
import CapacityBadge from '@/components/event/CapacityBadge';

interface TicketTypeRowProps {
	ticket: ITicketType;
	quantity: number;
	onQuantityChange: (ticketTypeId: number, quantity: number) => void;
	showLowStockUrgency?: boolean;
	index?: number;
}

/**
 * Price-rail + tier-card row. Rail anchors the price in black with mono-style
 * eyebrow; card holds name, capacity, optional description, and the pill
 * quantity stepper. Selected card lifts via `--shadow-2` and a 1.5px ink ring.
 */
export default function TicketTypeRow({
	ticket,
	quantity,
	onQuantityChange,
	showLowStockUrgency,
	index,
}: TicketTypeRowProps) {
	const { t } = useTranslation('common');
	const isSoldOut = ticket.remaining_capacity === 0;
	const maxQty = Math.min(
		ticket.remaining_capacity ?? Infinity,
		ticket.max_tickets_per_user ?? 10
	);
	const isSelected = quantity > 0;

	return (
		<div
			className={`grid grid-cols-[64px_1fr] gap-2.5 sm:grid-cols-[88px_1fr] sm:gap-3 ${
				isSoldOut ? 'opacity-55' : ''
			}`}
		>
			{/* Price rail */}
			<div className="flex flex-col justify-between rounded-[18px] bg-[var(--ink)] p-3 text-white sm:p-4">
				{index != null && (
					<div className="text-[9px] font-[700] uppercase tracking-[0.15em] text-white/55">
						T{String(index).padStart(2, '0')}
					</div>
				)}
				<div>
					<div className="text-[24px] font-[800] leading-[0.9] tracking-[-0.02em] tabular-nums sm:text-[28px]">
						{ticket.price}
					</div>
					<div className="mt-1 text-[9px] font-[700] uppercase tracking-[0.1em] text-white/55">
						{ticket.currency}
					</div>
				</div>
			</div>

			{/* Tier card */}
			<div
				className="flex flex-col justify-between gap-2.5 rounded-[18px] bg-[var(--surface)] p-4 transition-shadow duration-200 sm:p-5"
				style={{
					boxShadow: isSelected
						? '0 0 0 1.5px var(--ink), var(--shadow-2)'
						: 'var(--shadow-1)',
				}}
			>
				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-2">
						<h4 className="text-[15px] font-[700] tracking-[-0.012em] text-[var(--ink)] sm:text-[17px]">
							{ticket.name}
						</h4>
						<CapacityBadge remainingCapacity={ticket.remaining_capacity} showLowStockUrgency={showLowStockUrgency} />
					</div>
					{ticket.description && (
						<p className="mt-1 text-[13px] leading-[1.5] text-[var(--ink-3)]">{ticket.description}</p>
					)}
				</div>

				<div className="flex items-center justify-end">
					{isSoldOut ? (
						<span className="inline-flex items-center rounded-full bg-[#DC2626]/10 px-3 py-1.5 text-[10.5px] font-[700] uppercase tracking-[0.1em] text-[#DC2626]">
							{t('event.sold_out')}
						</span>
					) : (
						<QuantityStepper
							quantity={quantity}
							maxQty={maxQty}
							ticketName={ticket.name}
							onChange={(qty) => onQuantityChange(ticket.id, qty)}
							t={t}
						/>
					)}
				</div>
			</div>
		</div>
	);
}

function QuantityStepper({
	quantity,
	maxQty,
	ticketName,
	onChange,
	t,
}: {
	quantity: number;
	maxQty: number;
	ticketName: string;
	onChange: (qty: number) => void;
	t: (key: string, opts?: { name?: string }) => string;
}) {
	return (
		<div
			className="inline-flex h-9 items-stretch rounded-full bg-[var(--bg-2)] p-0.5"
			role="group"
			aria-label={t('ticket_row.qty_for', { name: ticketName })}
		>
			<button
				className="flex w-9 items-center justify-center rounded-full text-[var(--ink)] transition-colors duration-150 hover:bg-[var(--bg-3)] disabled:opacity-30"
				onClick={() => onChange(Math.max(0, quantity - 1))}
				disabled={quantity === 0}
				aria-label={t('ticket_row.decrease', { name: ticketName })}
			>
				<Icon icon="mdi:minus" width={14} />
			</button>
			<span
				className={`flex min-w-8 items-center justify-center rounded-full px-1 text-[14px] font-[700] tabular-nums transition-colors duration-150 ${
					quantity > 0 ? 'bg-[var(--ink)] text-white' : 'text-[var(--ink)]'
				}`}
			>
				{quantity}
			</span>
			<button
				className="flex w-9 items-center justify-center rounded-full text-[var(--ink)] transition-colors duration-150 hover:bg-[var(--bg-3)] disabled:opacity-30"
				onClick={() => onChange(Math.min(maxQty, quantity + 1))}
				disabled={quantity >= maxQty}
				aria-label={t('ticket_row.increase', { name: ticketName })}
			>
				<Icon icon="mdi:plus" width={14} />
			</button>
		</div>
	);
}
