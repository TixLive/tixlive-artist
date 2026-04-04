import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { IEventDetail } from '@/types';

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
    return date.toLocaleDateString('ro-RO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ro-RO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const maxPrice = event.ticket_types?.length
    ? Math.max(...event.ticket_types.map(tt => tt.price))
    : priceFrom;

  return (
    <aside className="hidden w-[360px] flex-shrink-0 md:block">
      <div className="sticky top-24 space-y-3">
        {/* Main card — price, CTA, date/venue */}
        <div className="rounded-[20px] border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-6">
          {/* Price */}
          <div className="mb-5">
            {totalQuantity > 0 ? (
              <div className="flex items-baseline gap-1.5">
                <span className="font-[family-name:var(--font-data)] text-[2rem] font-bold tabular-nums text-[var(--theme-text)]">
                  {totalPrice}
                </span>
                <span className="text-[0.875rem] text-[var(--theme-text-muted)]">{currency}</span>
              </div>
            ) : priceFrom > 0 ? (
              <div className="flex items-baseline gap-1.5">
                <span className="font-[family-name:var(--font-data)] text-[2rem] font-bold tabular-nums text-[var(--theme-text)]">
                  {priceFrom}
                </span>
                <span className="text-[0.875rem] text-[var(--theme-text-muted)]">
                  – {maxPrice} {currency}
                </span>
              </div>
            ) : (
              <span className="font-[family-name:var(--font-display)] text-[2rem] font-[800] text-[var(--theme-text)]">
                Free
              </span>
            )}
          </div>

          {/* CTA */}
          {totalQuantity > 0 ? (
            <>
              <Button
                variant="solid"
                size="lg"
                className="w-full rounded-xl font-[family-name:var(--font-display)] text-[0.9375rem] font-[700] text-[var(--theme-bg)]"
                style={{ backgroundColor: 'var(--brand-primary)' }}
                onPress={onBuy}
              >
                Checkout · {totalPrice} {currency}
              </Button>
              <p className="mt-2 text-[0.75rem] text-[var(--theme-text-muted)]">
                {totalQuantity} {totalQuantity === 1 ? 'bilet selectat' : 'bilete selectate'}
              </p>
            </>
          ) : (
            <Button
              variant="solid"
              size="lg"
              className="w-full rounded-xl font-[family-name:var(--font-display)] text-[0.9375rem] font-[700] text-[var(--theme-bg)]"
              style={{ backgroundColor: 'var(--brand-primary)' }}
              onPress={onScrollToTickets}
            >
              Cumpără Bilet
            </Button>
          )}

          {/* Date & venue */}
          <div className="mt-6 space-y-3 border-t border-[color-mix(in_srgb,var(--theme-text)_6%,transparent)] pt-5">
            <div>
              <div className="flex items-center gap-2 text-[0.6875rem] font-medium uppercase tracking-[0.05em] text-[var(--theme-text-muted)]">
                <Icon icon="mdi:calendar-outline" width={14} className="shrink-0" />
                <span>Data și ora</span>
              </div>
              <p className="mt-1 pl-[22px] text-[0.8125rem] font-medium text-[var(--theme-text)]">
                {formatDate(event.date_start)}, {formatTime(event.date_start)}
              </p>
            </div>

            {event.venue_name && (
              <div>
                <div className="flex items-center gap-2 text-[0.6875rem] font-medium uppercase tracking-[0.05em] text-[var(--theme-text-muted)]">
                  <Icon icon="mdi:map-marker-outline" width={14} className="shrink-0" />
                  <span>Locație</span>
                </div>
                <p className="mt-1 pl-[22px] text-[0.8125rem] font-medium text-[var(--theme-text)]">
                  {event.venue_name}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Share */}
        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] py-3 text-[0.8125rem] font-medium text-[var(--theme-text-muted)] transition-colors duration-200 hover:border-[color-mix(in_srgb,var(--theme-text)_15%,transparent)] hover:text-[var(--theme-text)]"
          onClick={() => {
            const url = window.location.href;
            if (typeof navigator.share === 'function') {
              navigator.share({ title: event.title, url }).catch(() => {});
            } else {
              navigator.clipboard.writeText(url).catch(() => {});
            }
          }}
        >
          <Icon icon="mdi:share-variant-outline" width={18} />
          Distribuie evenimentul
        </button>
      </div>
    </aside>
  );
}
