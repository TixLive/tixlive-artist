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
      className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] focus-visible:ring-offset-2"
    >
      <article className="relative overflow-hidden rounded-2xl aspect-[3/4] transition-transform duration-250 ease-out group-hover:-translate-y-1 active:scale-[0.98]">
        {/* Poster — fills entire card */}
        {event.poster_url ? (
          <Image
            src={event.poster_url}
            alt={`${event.title} poster`}
            fill
            className="object-cover transition-transform duration-250 ease-out group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--theme-text)] p-4">
            <span className="text-center font-[family-name:var(--font-display)] text-lg font-[800] text-[var(--theme-bg)]">
              {event.title}
            </span>
          </div>
        )}

        {/* Gradient overlay — bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

        {/* Sold out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--theme-text)]/60">
            <span className="rounded-xl bg-[#DC2626] px-4 py-1.5 font-[family-name:var(--font-display)] text-sm font-[700] text-white">
              Sold Out
            </span>
          </div>
        )}

        {/* Urgency badge (top-left) */}
        {isCritical && (
          <div className="absolute top-3 left-3">
            <span className="animate-urgency-pulse rounded-full bg-[#DC2626] px-2.5 py-1 font-[family-name:var(--font-data)] text-[0.6875rem] font-semibold text-white">
              Only {event.remaining_capacity} left!
            </span>
          </div>
        )}
        {isLowStock && !isCritical && (
          <div className="absolute top-3 left-3">
            <span className="rounded-full bg-[#D97706] px-2.5 py-1 font-[family-name:var(--font-data)] text-[0.6875rem] font-semibold text-white">
              {event.remaining_capacity} left
            </span>
          </div>
        )}

        {/* Info overlay — bottom of card */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="line-clamp-2 font-[family-name:var(--font-display)] text-[1.0625rem] font-[800] leading-tight text-white">
            {event.title}
          </h3>
          <p className="mt-1.5 font-[family-name:var(--font-data)] text-[0.6875rem] tracking-wide text-white/65">
            {formatDate(event.date_start)}
            {event.venue_name && ` · ${event.venue_name}`}
          </p>
          {event.price_from != null && !isSoldOut && (
            <span className="mt-2 inline-block rounded-lg bg-white/15 px-2.5 py-1 font-[family-name:var(--font-data)] text-[0.75rem] font-semibold text-white backdrop-blur-sm">
              From {event.price_from} {event.currency}
            </span>
          )}
        </div>
      </article>
    </Link>
  );
}
