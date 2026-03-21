import Image from 'next/image';
import Link from 'next/link';
import { IEventListItem } from '@/types';

interface EventCardProps {
  event: IEventListItem;
}

export default function EventCard({ event }: EventCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
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
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 rounded-xl"
    >
      <article className="relative overflow-hidden rounded-xl aspect-[3/4] transition-transform duration-250 ease-out group-hover:-translate-y-0.5 active:scale-[0.98]">
        {/* Poster — fills entire card */}
        {event.poster_url ? (
          <Image
            src={event.poster_url}
            alt={`${event.title} poster`}
            fill
            className="object-cover transition-transform duration-250 ease-out group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 p-4">
            <span
              className="text-center font-[family-name:var(--font-display)] text-lg font-bold text-white"
            >
              {event.title}
            </span>
          </div>
        )}

        {/* Dark gradient overlay — bottom 40% */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-250 group-hover:from-black/80" />

        {/* Sold out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-bold text-white">
              Sold Out
            </span>
          </div>
        )}

        {/* Urgency badge (top-left) */}
        {isCritical && (
          <div className="absolute top-2 left-2">
            <span className="animate-urgency-pulse rounded-full bg-red-500 px-2.5 py-1 text-xs font-semibold text-white">
              Only {event.remaining_capacity} left!
            </span>
          </div>
        )}
        {isLowStock && !isCritical && (
          <div className="absolute top-2 left-2">
            <span className="rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white">
              {event.remaining_capacity} left
            </span>
          </div>
        )}

        {/* Info overlay — bottom of card */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="line-clamp-2 font-[family-name:var(--font-display)] text-[1.125rem] font-bold leading-tight text-white">
            {event.title}
          </h3>
          <p className="mt-1 font-[family-name:var(--font-mono)] text-[0.75rem] uppercase tracking-wider text-white/70">
            {formatDate(event.date_start)}
            {event.venue_name && ` · ${event.venue_name}`}
          </p>
          {event.price_from != null && !isSoldOut && (
            <span
              className="mt-2 inline-block rounded-full px-2.5 py-0.5 font-[family-name:var(--font-data)] text-[0.8125rem] font-semibold text-white transition-colors duration-250 group-hover:text-white"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--brand-primary) 80%, transparent)',
              }}
            >
              From {event.price_from} {event.currency}
            </span>
          )}
        </div>
      </article>
    </Link>
  );
}
