import { Icon } from '@iconify/react';
import { ITicketType } from '@/types';
import CapacityBadge from '@/components/event/CapacityBadge';

interface TicketTypeRowProps {
  ticket: ITicketType;
  quantity: number;
  onQuantityChange: (ticketTypeId: number, quantity: number) => void;
  /** Gate the low-stock urgency badge on the event's `fomo_low_stock` toggle. */
  showLowStockUrgency?: boolean;
  /** 1-based position in the ladder, rendered as the rail's "T01" label. */
  index?: number;
}

/**
 * V2 price-ladder row: a dark price rail paired with a tier card. The rail anchors
 * the price; the card holds the name, capacity and a pill stepper.
 */
export default function TicketTypeRow({
  ticket,
  quantity,
  onQuantityChange,
  showLowStockUrgency,
  index,
}: TicketTypeRowProps) {
  const isSoldOut = ticket.remaining_capacity === 0;
  const maxQty = Math.min(
    ticket.remaining_capacity ?? Infinity,
    ticket.max_tickets_per_user ?? 10
  );
  const isSelected = quantity > 0;

  return (
    <div
      className={`grid grid-cols-[64px_1fr] gap-2 sm:grid-cols-[88px_1fr] sm:gap-3 ${
        isSoldOut ? 'opacity-55' : ''
      }`}
    >
      {/* Price rail */}
      <div className="flex flex-col justify-between rounded-2xl bg-[var(--brand-primary)] p-3 text-[var(--theme-bg)] sm:p-4">
        {index != null && (
          <div className="font-[family-name:var(--font-mono)] text-[0.5625rem] tracking-[0.15em] opacity-65">
            T{String(index).padStart(2, '0')}
          </div>
        )}
        <div>
          <div className="font-[family-name:var(--font-data)] text-[1.5rem] font-[800] leading-[0.9] tracking-[-0.02em] tabular-nums sm:text-[1.75rem]">
            {ticket.price}
          </div>
          <div className="mt-0.5 font-[family-name:var(--font-mono)] text-[0.5625rem] tracking-[0.1em] opacity-65">
            {ticket.currency}
          </div>
        </div>
      </div>

      {/* Tier card */}
      <div
        className={`flex flex-col justify-between gap-2.5 rounded-2xl border p-4 transition-colors duration-200 sm:p-5 ${
          isSelected
            ? 'border-[var(--brand-accent)] bg-[color-mix(in_srgb,var(--brand-accent)_5%,var(--theme-surface))]'
            : 'border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)]'
        }`}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-[family-name:var(--font-display)] text-[1rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)] sm:text-[1.0625rem]">
              {ticket.name}
            </h4>
            <CapacityBadge remainingCapacity={ticket.remaining_capacity} showLowStockUrgency={showLowStockUrgency} />
          </div>
          {ticket.description && (
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-[var(--theme-text-muted)]">
              {ticket.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end">
          {isSoldOut ? (
            <span className="inline-flex items-center rounded-full bg-[#DC2626]/10 px-3 py-1.5 font-[family-name:var(--font-mono)] text-[0.6875rem] uppercase tracking-[0.1em] text-[#DC2626]">
              Sold Out
            </span>
          ) : (
            <QuantityStepper
              quantity={quantity}
              maxQty={maxQty}
              ticketName={ticket.name}
              onChange={(qty) => onQuantityChange(ticket.id, qty)}
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
}: {
  quantity: number;
  maxQty: number;
  ticketName: string;
  onChange: (qty: number) => void;
}) {
  return (
    <div
      className="inline-flex h-9 items-stretch rounded-full border border-[color-mix(in_srgb,var(--theme-text)_10%,transparent)] bg-[var(--theme-bg)] p-0.5"
      role="group"
      aria-label={`Quantity for ${ticketName}`}
    >
      <button
        className="flex w-8 items-center justify-center rounded-full text-[var(--theme-text-muted)] transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--theme-text)_5%,transparent)] disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
        onClick={() => onChange(Math.max(0, quantity - 1))}
        disabled={quantity === 0}
        aria-label={`Decrease quantity for ${ticketName}`}
      >
        <Icon icon="mdi:minus" width={16} />
      </button>
      <span
        className={`flex min-w-8 items-center justify-center rounded-full px-1 font-[family-name:var(--font-data)] text-[0.875rem] font-[700] tabular-nums transition-colors duration-200 ${
          quantity > 0 ? 'bg-[var(--brand-accent)] text-white' : 'text-[var(--theme-text)]'
        }`}
      >
        {quantity}
      </span>
      <button
        className="flex w-8 items-center justify-center rounded-full text-[var(--theme-text)] transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--theme-text)_5%,transparent)] disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
        onClick={() => onChange(Math.min(maxQty, quantity + 1))}
        disabled={quantity >= maxQty}
        aria-label={`Increase quantity for ${ticketName}`}
      >
        <Icon icon="mdi:plus" width={16} />
      </button>
    </div>
  );
}
