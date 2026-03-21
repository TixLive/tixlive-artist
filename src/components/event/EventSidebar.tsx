import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { ITicketType, ICartItem, IEventSession } from '@/types';
import SessionPicker from '@/components/event/SessionPicker';
import TicketTypeRow from '@/components/event/TicketTypeRow';

interface EventSidebarProps {
  sessions: IEventSession[];
  activeSessionId: number;
  onSessionSelect: (id: number) => void;
  ticketTypes: ITicketType[];
  quantities: Record<number, number>;
  onQuantityChange: (ticketTypeId: number, qty: number) => void;
  cartItems: ICartItem[];
  currency: string;
  onBuy: () => void;
  isEventSoldOut: boolean;
}

export default function EventSidebar({
  sessions,
  activeSessionId,
  onSessionSelect,
  ticketTypes,
  quantities,
  onQuantityChange,
  cartItems,
  currency,
  onBuy,
  isEventSoldOut,
}: EventSidebarProps) {
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <aside className="w-full md:w-[340px] md:flex-shrink-0">
      <div className="md:sticky md:top-20">
        <div className="rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_15%,transparent)] bg-[var(--theme-surface)] p-4 shadow-sm md:shadow-lg">
          {/* Session picker */}
          {sessions.length > 1 && (
            <div className="mb-4">
              <SessionPicker
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelect={onSessionSelect}
              />
            </div>
          )}

          {/* Ticket types */}
          {!isEventSoldOut ? (
            <>
              <h3 className="mb-3 font-[family-name:var(--font-display)] text-[1.125rem] font-semibold text-[var(--theme-text)]">
                Tickets
              </h3>
              <div className="flex flex-col gap-2">
                {ticketTypes.map((ticket) => (
                  <TicketTypeRow
                    key={ticket.id}
                    ticket={ticket}
                    quantity={quantities[ticket.id] ?? 0}
                    onQuantityChange={onQuantityChange}
                  />
                ))}
              </div>

              {/* Buy summary + CTA */}
              {totalQuantity > 0 && (
                <div className="mt-4 border-t border-[var(--theme-surface)] pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[0.875rem] text-[var(--theme-text-muted)]">
                      {totalQuantity} {totalQuantity === 1 ? 'ticket' : 'tickets'}
                    </span>
                    <span className="font-[family-name:var(--font-data)] text-[1.25rem] font-bold text-[var(--theme-text)]">
                      {totalPrice} {currency}
                    </span>
                  </div>
                  <Button
                    variant="solid"
                    size="lg"
                    className="w-full rounded-full font-[family-name:var(--font-display)] font-semibold text-white"
                    style={{ backgroundColor: 'var(--brand-primary)' }}
                    onPress={onBuy}
                  >
                    Buy Tickets
                    <Icon icon="mdi:arrow-right" className="ml-1" width={20} />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="py-4 text-center">
              <Icon icon="mdi:alert-circle" className="mx-auto mb-2 text-red-500" width={32} />
              <p className="font-[family-name:var(--font-display)] text-[1rem] font-semibold text-red-600">
                Sold Out
              </p>
              <p className="mt-1 text-[0.8125rem] text-[var(--theme-text-muted)]">
                This event is no longer available
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
