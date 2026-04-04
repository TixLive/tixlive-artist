import Image from 'next/image';
import { IEventDetail, ICartItem, IAddonCartItem } from '@/types';

interface OrderSummaryProps {
  event: IEventDetail;
  sessionDate: string;
  cart: ICartItem[];
  addonCart?: IAddonCartItem[];
}

export default function OrderSummary({ event, sessionDate, cart, addonCart }: OrderSummaryProps) {
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

  return (
    <div className="flex gap-4 rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-5">
      {/* Poster thumbnail */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
        {event.poster_url ? (
          <Image
            src={event.poster_url}
            alt={event.title}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[color-mix(in_srgb,var(--theme-text)_8%,transparent)]">
            <span className="font-[family-name:var(--font-display)] text-[1rem] font-[800] text-[var(--theme-text-muted)]">
              {event.title.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Event info + line items */}
      <div className="min-w-0 flex-1">
        <h2 className="truncate font-[family-name:var(--font-display)] text-[1.0625rem] font-[700] text-[var(--theme-text)]">{event.title}</h2>
        <p className="mt-0.5 font-[family-name:var(--font-data)] text-[0.75rem] text-[var(--theme-text-muted)]">{formatDate(sessionDate)}</p>

        <div className="mt-3 space-y-1.5">
          {cart.map((item) => (
            <div key={item.ticket_type_id} className="flex items-center justify-between text-[0.8125rem]">
              <span className="text-[var(--theme-text-muted)]">
                {item.quantity}x {item.ticket_type_name}
              </span>
              <span className="font-[family-name:var(--font-data)] font-medium tabular-nums text-[var(--theme-text)]">
                {(item.price * item.quantity).toFixed(2)} {item.currency}
              </span>
            </div>
          ))}
          {addonCart && addonCart.length > 0 && (
            <>
              {addonCart.map((addon) => (
                <div key={addon.addon_id} className="flex items-center justify-between text-[0.8125rem]">
                  <span className="text-[var(--theme-text-muted)]">
                    {addon.quantity}x {addon.addon_name}
                    {addon.per_ticket && (
                      <span className="ml-1 text-[0.6875rem] opacity-60">(per ticket)</span>
                    )}
                  </span>
                  <span className="font-[family-name:var(--font-data)] font-medium tabular-nums text-[var(--theme-text)]">
                    +{(addon.price * addon.quantity * (addon.per_ticket ? cart.reduce((s, i) => s + i.quantity, 0) : 1)).toFixed(2)} {addon.currency}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
