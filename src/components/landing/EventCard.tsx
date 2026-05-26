import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { IEventListItem } from '@/types';
import { usePrefetchEvent } from '@/hooks/usePrefetchEvent';

interface EventCardProps {
  event: IEventListItem;
}

export default function EventCard({ event }: EventCardProps) {
  const { t } = useTranslation('common');
  const prefetch = usePrefetchEvent();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ro-RO', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const isSoldOut = event.remaining_capacity === 0;
  const isLowStock = !isSoldOut && event.remaining_capacity != null && event.remaining_capacity <= 20;
  const isCritical = !isSoldOut && event.remaining_capacity != null && event.remaining_capacity <= 5;

  return (
    <Link
      href={`/events/${event.slug}`}
      onMouseEnter={() => prefetch(event.slug)}
      onTouchStart={() => prefetch(event.slug)}
      className="group block rounded-[22px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] focus-visible:ring-offset-2"
    >
      <article className="relative aspect-[3/4] overflow-hidden rounded-[22px] shadow-[0_1px_2px_rgba(20,19,18,0.04),0_8px_24px_rgba(20,19,18,0.06)] transition-transform duration-250 ease-out group-hover:-translate-y-1 active:scale-[0.98]">
        {/* Poster — fills entire card */}
        {event.poster_url ? (
          <Image
            src={event.poster_url}
            alt={`${event.title} poster`}
            fill
            className="object-cover transition-transform duration-250 ease-out group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--brand-primary)] p-4">
            <span className="text-center font-[family-name:var(--font-display)] text-lg font-[800] text-[var(--theme-bg)]">
              {event.title}
            </span>
          </div>
        )}

        {/* Gradient overlay — bottom */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0) 48%, rgba(0,0,0,.78) 100%)',
          }}
        />

        {/* Urgency badge (top-left) */}
        {isCritical && (
          <div className="absolute left-3 top-3 z-10">
            <span className="animate-urgency-pulse inline-flex items-center rounded-full bg-[#DC2626] px-2.5 py-1 font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.1em] font-[500] text-white shadow-[0_4px_12px_rgba(0,0,0,0.18)]">
              {t('events.only_left', { count: event.remaining_capacity ?? 0 })}
            </span>
          </div>
        )}
        {isLowStock && !isCritical && (
          <div className="absolute left-3 top-3 z-10">
            <span className="inline-flex items-center rounded-full bg-[#D97706] px-2.5 py-1 font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.1em] font-[500] text-white shadow-[0_4px_12px_rgba(0,0,0,0.18)]">
              {t('events.low_stock', { count: event.remaining_capacity ?? 0 })}
            </span>
          </div>
        )}

        {/* Info overlay — bottom of card */}
        <div className="absolute inset-x-0 bottom-0 z-[2] p-4">
          <h3 className="line-clamp-2 font-[family-name:var(--font-display)] text-[1.0625rem] font-[800] leading-tight tracking-[-0.01em] text-white">
            {event.title}
          </h3>
          <p className="mt-1.5 font-[family-name:var(--font-body)] text-[0.75rem] text-white/85">
            {formatDate(event.date_start)}
            {event.venue_name && ` · ${event.venue_name}`}
          </p>
          {event.price_from != null && !isSoldOut && event.price_from > 0 && (
            <span className="mt-2.5 inline-flex items-center rounded-full bg-white/95 px-2.5 py-1 font-[family-name:var(--font-mono)] text-[0.6875rem] tracking-[0.02em] text-[var(--theme-text)] backdrop-blur-sm">
              {t('events.price_from', { price: event.price_from, currency: event.currency ?? '' })}
            </span>
          )}
          {event.price_from === 0 && !isSoldOut && (
            <span className="mt-2.5 inline-flex items-center rounded-full bg-[#16A34A] px-2.5 py-1 font-[family-name:var(--font-mono)] text-[0.6875rem] uppercase tracking-[0.15em] text-white">
              FREE
            </span>
          )}
        </div>

        {/* Sold out overlay */}
        {isSoldOut && (
          <div
            className="absolute inset-0 z-[4] flex flex-col items-center justify-center px-4 backdrop-blur-[2px]"
            style={{ backgroundColor: 'color-mix(in srgb, var(--theme-text) 72%, transparent)' }}
          >
            <span className="font-[family-name:var(--font-display)] text-[1.75rem] font-[800] tracking-[-0.02em] text-white">
              {t('events.sold_out')}
            </span>
          </div>
        )}
      </article>
    </Link>
  );
}
