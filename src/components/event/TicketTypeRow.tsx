import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import { ITicketType } from '@/types';
import CapacityBadge from '@/components/event/CapacityBadge';

interface TicketTypeRowProps {
	ticket: ITicketType;
	quantity: number;
	/** Headroom left for the WHOLE order (maxPerOrder − total selected across all tiers). */
	orderRemaining: number;
	onQuantityChange: (ticketTypeId: number, quantity: number) => void;
	showLowStockUrgency?: boolean;
}

/**
 * One tier row inside the ticket list. The parent wraps all rows in a single
 * bordered surface with hairline dividers (`divide-y`), so the row carries no
 * chrome of its own: name + inline availability + optional description on the
 * left, price and the quantity stepper on the right, vertically centred. When a
 * tier is sold out the stepper is replaced by a muted dash.
 */
export default function TicketTypeRow({
	ticket,
	quantity,
	orderRemaining,
	onQuantityChange,
	showLowStockUrgency,
}: TicketTypeRowProps) {
	const { t } = useTranslation('common');
	const isSoldOut = ticket.remaining_capacity === 0;
	// Capped by this tier's stock AND the order-wide headroom: this row can grow to
	// its current quantity plus whatever is left before the order hits maxPerOrder.
	const maxQty = Math.min(
		ticket.remaining_capacity ?? Infinity,
		quantity + orderRemaining
	);

	return (
		<div
			className={`flex items-center gap-3 px-4 py-3.5 sm:gap-[18px] sm:px-[22px] sm:py-[18px] ${
				isSoldOut ? 'opacity-50' : ''
			}`}
		>
			{/* Name + availability + description */}
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-2">
					<h4 className="font-[family-name:var(--font-display)] text-[15px] font-[700] tracking-[-0.018em] text-[var(--ink)] sm:text-[18px]">
						{ticket.name}
					</h4>
					<CapacityBadge remainingCapacity={ticket.remaining_capacity} showLowStockUrgency={showLowStockUrgency} />
				</div>
				{ticket.description && (
					<p className="mt-1 text-[12px] leading-[1.4] text-[var(--ink-3)] sm:text-[13px]">{ticket.description}</p>
				)}
			</div>

			{/* Price */}
			<div className="shrink-0 text-right">
				<div className="font-[family-name:var(--font-display)] text-[17px] font-[800] leading-none tracking-[-0.025em] tabular-nums text-[var(--ink)] sm:text-[20px]">
					{ticket.price}
				</div>
				<div className="mt-0.5 font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-[0.1em] text-[var(--ink-4)]">
					{ticket.currency}
				</div>
			</div>

			{/* Stepper — or a muted dash for a sold-out tier */}
			{isSoldOut ? (
				<span className="shrink-0 font-[family-name:var(--font-mono)] text-[13px] tracking-[0.1em] text-[var(--ink-4)]">—</span>
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
			className="inline-flex h-9 shrink-0 items-stretch rounded-full bg-[var(--bg-2)] p-0.5"
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
