import { Icon } from '@iconify/react';
import { ITicketType } from '@/types';
import CapacityBadge from '@/components/event/CapacityBadge';

interface TicketTypeRowProps {
  ticket: ITicketType;
  quantity: number;
  onQuantityChange: (ticketTypeId: number, quantity: number) => void;
}

export default function TicketTypeRow({ ticket, quantity, onQuantityChange }: TicketTypeRowProps) {
  const isSoldOut = ticket.remaining_capacity === 0;
  const maxQty = Math.min(
    ticket.remaining_capacity ?? Infinity,
    ticket.max_tickets_per_user ?? 10
  );
  const isSelected = quantity > 0;

  return (
    <div
      className={`rounded-2xl border-2 p-4 transition-all duration-200 ${
        isSoldOut
          ? 'border-[color-mix(in_srgb,var(--theme-text)_6%,transparent)] opacity-55'
          : isSelected
            ? 'border-[var(--brand-accent)] bg-[color-mix(in_srgb,var(--brand-accent)_3%,var(--theme-bg))]'
            : 'border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-bg)] hover:border-[color-mix(in_srgb,var(--theme-text)_15%,transparent)]'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Selection indicator */}
        <div className="shrink-0">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
              isSelected
                ? 'border-[var(--brand-accent)] bg-[var(--brand-accent)]'
                : 'border-[color-mix(in_srgb,var(--theme-text)_20%,transparent)]'
            }`}
          >
            {isSelected && (
              <Icon icon="mdi:check" width={14} className="text-white" />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-[family-name:var(--font-display)] text-[0.9375rem] font-[700] text-[var(--theme-text)]">
              {ticket.name}
            </h4>
            <CapacityBadge remainingCapacity={ticket.remaining_capacity} />
          </div>
          {ticket.description && (
            <p className="mt-0.5 text-[0.75rem] leading-relaxed text-[var(--theme-text-muted)]">
              {ticket.description}
            </p>
          )}
        </div>

        {/* Price */}
        <span className="shrink-0 font-[family-name:var(--font-data)] text-[1rem] font-bold tabular-nums text-[var(--theme-text)]">
          {ticket.price} <span className="text-[0.75rem] font-medium text-[var(--theme-text-muted)]">{ticket.currency}</span>
        </span>

        {/* Quantity or Sold Out */}
        {isSoldOut ? (
          <span className="inline-flex shrink-0 items-center rounded-xl bg-[#DC2626]/10 px-3 py-1.5 font-[family-name:var(--font-data)] text-[0.8125rem] font-semibold text-[#DC2626]">
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
      className="inline-flex shrink-0 items-center rounded-xl border border-[color-mix(in_srgb,var(--theme-text)_10%,transparent)] bg-[var(--theme-bg)]"
      role="group"
      aria-label={`Quantity for ${ticketName}`}
    >
      <button
        className="flex h-9 w-9 items-center justify-center rounded-l-xl text-[var(--theme-text-muted)] transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--theme-text)_5%,transparent)] disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-offset-2"
        onClick={() => onChange(Math.max(0, quantity - 1))}
        disabled={quantity === 0}
        aria-label={`Decrease quantity for ${ticketName}`}
      >
        <Icon icon="mdi:minus" width={18} />
      </button>
      <span className="min-w-[32px] text-center font-[family-name:var(--font-data)] text-[0.875rem] font-semibold tabular-nums text-[var(--theme-text)]">
        {quantity}
      </span>
      <button
        className="flex h-9 w-9 items-center justify-center rounded-r-xl text-[var(--brand-accent)] transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--brand-accent)_5%,transparent)] disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-offset-2"
        onClick={() => onChange(Math.min(maxQty, quantity + 1))}
        disabled={quantity >= maxQty}
        aria-label={`Increase quantity for ${ticketName}`}
      >
        <Icon icon="mdi:plus" width={18} />
      </button>
    </div>
  );
}
