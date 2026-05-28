import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import { IEventDetail, ICartItem, IAddonCartItem } from '@/types';

interface OrderSummaryProps {
  event: IEventDetail;
  sessionDate: string;
  cart: ICartItem[];
  addonCart?: IAddonCartItem[];
  /** Seated events: human-readable labels ("VIP · A-12") for the chosen seats. */
  seatLabels?: string[];
}

export default function OrderSummary({ event, sessionDate, cart, addonCart, seatLabels }: OrderSummaryProps) {
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
    <div className="overflow-hidden rounded-[22px] border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] shadow-[0_1px_2px_rgba(20,19,18,0.04),0_8px_24px_rgba(20,19,18,0.06)]">
      {/* Event header */}
      <div className="flex gap-4 border-b border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] p-5">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
          {event.poster_url ? (
            <Image src={event.poster_url} alt={event.title} fill className="object-cover" sizes="80px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[color-mix(in_srgb,var(--theme-text)_8%,transparent)]">
              <span className="font-[family-name:var(--font-display)] text-[1rem] font-[800] text-[var(--theme-text-muted)]">
                {event.title.charAt(0)}
              </span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-[family-name:var(--font-mono)] text-[0.5625rem] uppercase tracking-[0.15em] text-[var(--theme-text-muted)]">
            {t('order_summary.event')}
          </div>
          <h2 className="mt-1 truncate font-[family-name:var(--font-display)] text-[1.0625rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)]">
            {event.title}
          </h2>
          <p className="mt-0.5 font-[family-name:var(--font-data)] text-[0.75rem] text-[var(--theme-text-muted)]">
            {formatDate(sessionDate)}
          </p>
        </div>
      </div>

      {/* Line items */}
      <div className="space-y-2 p-5">
        {cart.map((item) => (
          <div key={item.ticket_type_id} className="flex items-center justify-between gap-3 text-[0.8125rem]">
            <span className="text-[var(--theme-text)]">
              <b className="font-[family-name:var(--font-display)] font-[700]">{item.quantity}×</b>
              <span className="ml-2 text-[var(--theme-text-muted)]">{item.ticket_type_name}</span>
            </span>
            <span className="font-[family-name:var(--font-data)] font-medium tabular-nums text-[var(--theme-text)]">
              {(item.price * item.quantity).toFixed(2)} {item.currency}
            </span>
          </div>
        ))}
        {addonCart && addonCart.length > 0 && (
          <>
            {addonCart.map((addon) => (
              <div key={addon.addon_id} className="flex items-center justify-between gap-3 text-[0.8125rem]">
                <span className="text-[var(--theme-text-muted)]">
                  <b className="font-[family-name:var(--font-display)] font-[700]">{addon.quantity}×</b>
                  <span className="ml-2">{addon.addon_name}</span>
                  {addon.per_ticket && <span className="ml-1 text-[0.6875rem] opacity-60">{t('order_summary.per_ticket')}</span>}
                </span>
                <span className="font-[family-name:var(--font-data)] font-medium tabular-nums text-[var(--theme-text)]">
                  +{(addon.price * addon.quantity * (addon.per_ticket ? ticketCount : 1)).toFixed(2)} {addon.currency}
                </span>
              </div>
            ))}
          </>
        )}

        {seatLabels && seatLabels.length > 0 && (
          <div className="mt-1 border-t border-[color-mix(in_srgb,var(--theme-text)_6%,transparent)] pt-3">
            <p className="font-[family-name:var(--font-mono)] text-[0.5625rem] uppercase tracking-[0.15em] text-[var(--theme-text-muted)]">
              {seatLabels.length === 1 ? t('order_summary.seat') : t('order_summary.seats')}
            </p>
            <p className="mt-1 font-[family-name:var(--font-data)] text-[0.8125rem] tabular-nums text-[var(--theme-text)]">
              {seatLabels.join(', ')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
