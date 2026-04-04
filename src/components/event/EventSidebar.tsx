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
    <aside className="hidden w-[340px] flex-shrink-0 md:block">
      <div className="sticky top-20 space-y-3">
        {/* Main card — price, CTA, date/venue */}
        <div className="rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_10%,transparent)] bg-[var(--theme-surface)] p-5">
          {/* Price */}
          <div className="mb-4 text-center">
            {totalQuantity > 0 ? (
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="font-[family-name:var(--font-data)] text-[2rem] font-bold tabular-nums text-[var(--theme-text)]">
                  {totalPrice}
                </span>
                <span className="text-[0.875rem] text-[var(--theme-text-muted)]">{currency}</span>
              </div>
            ) : priceFrom > 0 ? (
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="font-[family-name:var(--font-data)] text-[2rem] font-bold tabular-nums text-[var(--theme-text)]">
                  {priceFrom}
                </span>
                <span className="text-[0.875rem] text-[var(--theme-text-muted)]">
                  – {maxPrice} {currency}
                </span>
              </div>
            ) : (
              <span className="font-[family-name:var(--font-data)] text-[2rem] font-bold text-[var(--theme-text)]">
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
                className="w-full rounded-xl font-[family-name:var(--font-display)] text-[0.9375rem] font-semibold text-white"
                style={{ backgroundColor: 'var(--brand-primary)' }}
                onPress={onBuy}
              >
                Checkout ~ {totalPrice} {currency}
              </Button>
              <p className="mt-2 text-center text-[0.75rem] text-[var(--theme-text-muted)]">
                {totalQuantity} {totalQuantity === 1 ? 'bilet selectat' : 'bilete selectate'}
              </p>
            </>
          ) : (
            <Button
              variant="solid"
              size="lg"
              className="w-full rounded-xl font-[family-name:var(--font-display)] text-[0.9375rem] font-semibold text-white"
              style={{ backgroundColor: 'var(--brand-primary)' }}
              onPress={onScrollToTickets}
            >
              Cumpără Bilet
            </Button>
          )}

          {/* Date & venue */}
          <div className="mt-5 space-y-3 pt-4">
            <div>
              <div className="flex items-center gap-2 text-[0.75rem] text-[var(--theme-text-muted)]">
                <Icon icon="mdi:calendar-outline" width={15} className="shrink-0" />
                <span>Data și ora</span>
              </div>
              <p className="mt-0.5 pl-[23px] text-[0.8125rem] font-semibold text-[var(--theme-text)]">
                {formatDate(event.date_start)}, {formatTime(event.date_start)}
              </p>
            </div>

            {event.venue_name && (
              <div className="flex items-center gap-2 text-[0.75rem] text-[var(--theme-text-muted)]">
                <Icon icon="mdi:map-marker-outline" width={15} className="shrink-0" />
                <span>{event.venue_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Social proof card */}
        <div className="rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_10%,transparent)] bg-[var(--theme-surface)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Icon icon="mdi:eye-outline" width={18} className="shrink-0 text-[var(--theme-text-muted)]" />
            <div>
              <p className="text-[0.8125rem] font-semibold text-[var(--theme-text)]">
                42 persoane văd acum
              </p>
              <p className="text-[0.6875rem] text-[var(--theme-text-muted)]">
                Biletele se vând rapid!
              </p>
            </div>
          </div>
        </div>

        {/* Share */}
        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--theme-text)_12%,transparent)] py-2.5 text-[0.8125rem] font-medium text-[var(--theme-text-muted)] transition-colors hover:border-[color-mix(in_srgb,var(--theme-text)_20%,transparent)] hover:text-[var(--theme-text)]"
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
