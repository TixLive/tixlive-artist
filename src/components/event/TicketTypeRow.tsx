import { Button } from '@heroui/react';
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

  return (
    <div
      className={`rounded-xl border border-gray-100 p-4 transition ${
        isSoldOut ? 'opacity-60' : ''
      }`}
      style={{ backgroundColor: 'var(--theme-surface)' }}
    >
      {/* Mobile layout */}
      <div className="flex flex-col gap-3 md:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h4 className="text-[1.125rem] font-semibold" style={{ color: 'var(--theme-text)' }}>{ticket.name}</h4>
            {ticket.description && (
              <p className="mt-0.5 text-[0.75rem]" style={{ color: 'var(--theme-text-muted)' }}>{ticket.description}</p>
            )}
            <CapacityBadge remainingCapacity={ticket.remaining_capacity} />
          </div>
          <span className="shrink-0 text-[1.125rem] font-bold" style={{ color: 'var(--theme-text)' }}>
            {ticket.price} {ticket.currency}
          </span>
        </div>
        {isSoldOut ? (
          <span className="inline-flex items-center justify-center rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
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

      {/* Desktop layout */}
      <div className="hidden items-center gap-4 md:flex">
        <div className="min-w-0 flex-1">
          <h4 className="text-[1.125rem] font-semibold text-gray-900">{ticket.name}</h4>
          {ticket.description && (
            <p className="mt-0.5 text-[0.75rem] text-gray-500">{ticket.description}</p>
          )}
          <CapacityBadge remainingCapacity={ticket.remaining_capacity} />
        </div>
        <span className="shrink-0 text-[1.125rem] font-bold text-gray-900">
          {ticket.price} {ticket.currency}
        </span>
        {isSoldOut ? (
          <span className="inline-flex min-w-[120px] items-center justify-center rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
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
      className="inline-flex items-center rounded-lg border border-gray-200"
      role="group"
      aria-label={`Quantity for ${ticketName}`}
    >
      <button
        className="flex h-11 w-11 items-center justify-center text-gray-500 transition hover:text-gray-900 disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-offset-2"
        onClick={() => onChange(Math.max(0, quantity - 1))}
        disabled={quantity === 0}
        aria-label={`Decrease quantity for ${ticketName}`}
      >
        <Icon icon="mdi:minus" width={20} />
      </button>
      <span className="min-w-[40px] text-center text-[0.875rem] font-semibold tabular-nums">
        {quantity}
      </span>
      <button
        className="flex h-11 w-11 items-center justify-center text-gray-500 transition hover:text-gray-900 disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-offset-2"
        onClick={() => onChange(Math.min(maxQty, quantity + 1))}
        disabled={quantity >= maxQty}
        aria-label={`Increase quantity for ${ticketName}`}
      >
        <Icon icon="mdi:plus" width={20} />
      </button>
    </div>
  );
}
