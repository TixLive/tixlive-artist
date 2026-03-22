import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { IEventDetail } from '@/types';
import ShareButton from '@/components/event/ShareButton';

interface EventSidebarProps {
  priceFrom: number;
  currency: string;
  event: IEventDetail;
  totalQuantity: number;
  totalPrice: number;
  onScrollToTickets: () => void;
  onBuy: () => void;
}

export default function EventSidebar({
  priceFrom,
  currency,
  event,
  totalQuantity,
  totalPrice,
  onScrollToTickets,
  onBuy,
}: EventSidebarProps) {

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <aside className="hidden w-[340px] flex-shrink-0 md:block">
      <div className="sticky top-20">
        <div className="rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_15%,transparent)] bg-[var(--theme-surface)] p-5 shadow-sm">
          {/* Price */}
          <div className="mb-4 text-center">
            {priceFrom > 0 ? (
              <>
                <span className="text-[0.8125rem] text-[var(--theme-text-muted)]">From </span>
                <span className="font-[family-name:var(--font-data)] text-[1.75rem] font-bold text-[var(--theme-text)]">
                  {priceFrom}
                </span>
                <span className="ml-1 text-[0.875rem] text-[var(--theme-text-muted)]">{currency}</span>
              </>
            ) : (
              <span className="font-[family-name:var(--font-data)] text-[1.75rem] font-bold text-[var(--theme-text)]">
                Free
              </span>
            )}
          </div>

          {/* CTA */}
          {totalQuantity > 0 ? (
            <>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[0.875rem] text-[var(--theme-text-muted)]">
                  {totalQuantity} {totalQuantity === 1 ? 'ticket' : 'tickets'}
                </span>
                <span className="font-[family-name:var(--font-data)] text-[1.125rem] font-bold text-[var(--theme-text)]">
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
            </>
          ) : (
            <Button
              variant="solid"
              size="lg"
              className="w-full rounded-full font-[family-name:var(--font-display)] font-semibold text-white"
              style={{ backgroundColor: 'var(--brand-primary)' }}
              onPress={onScrollToTickets}
            >
              Buy Tickets
            </Button>
          )}

          {/* Key facts */}
          <div className="mt-4 space-y-3 border-t border-[color-mix(in_srgb,var(--theme-text)_10%,transparent)] pt-4 text-[0.8125rem]">
            <div className="flex items-center gap-2.5 text-[var(--theme-text)]">
              <Icon icon="mdi:calendar" width={16} className="shrink-0 text-[var(--theme-text-muted)]" />
              <span className="font-[family-name:var(--font-data)]">{formatDate(event.date_start)}</span>
            </div>
            {event.venue_name && (
              <div className="flex items-center gap-2.5 text-[var(--theme-text)]">
                <Icon icon="mdi:map-marker" width={16} className="shrink-0 text-[var(--theme-text-muted)]" />
                <span>{event.venue_name}</span>
              </div>
            )}
          </div>

          {/* Share */}
          <div className="mt-4 flex items-center justify-center border-t border-[color-mix(in_srgb,var(--theme-text)_10%,transparent)] pt-3">
            <ShareButton title={event.title} variant="inline" />
          </div>
        </div>
      </div>
    </aside>
  );
}
