import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { IEventListItem } from '@/types';

interface FeaturedHeroProps {
  events: IEventListItem[];
}

/**
 * FeaturedHero — replaces auto-advancing carousel.
 * Shows the soonest open event as a full-width hero,
 * with an "Also coming up" horizontal strip below.
 */
export default function HeroCarousel({ events }: FeaturedHeroProps) {
  const openEvents = events.filter((e) => e.status === 'open');
  if (openEvents.length === 0) return null;

  const featured = openEvents[0];
  const upcoming = openEvents.slice(1, 4);

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
    <section>
      {/* Featured hero */}
      <div className="relative w-full overflow-hidden bg-black">
        <div className="relative h-[400px] sm:h-[460px] md:h-[520px]">
          {/* Blurred poster background */}
          {featured.poster_url ? (
            <Image
              src={featured.poster_url}
              alt=""
              fill
              className="scale-110 object-cover blur-2xl opacity-40"
              priority
              aria-hidden="true"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-700" />
          )}

          {/* Content overlay */}
          <div className="relative z-10 flex h-full items-center justify-center px-6">
            <div className="flex max-w-4xl flex-col items-center gap-6 md:flex-row md:items-center md:gap-10">
              {/* Poster thumbnail */}
              {featured.poster_url && (
                <div className="relative hidden aspect-[3/4] w-[200px] flex-shrink-0 overflow-hidden rounded-xl shadow-2xl md:block">
                  <Image
                    src={featured.poster_url}
                    alt={`${featured.title} poster`}
                    fill
                    className="object-cover"
                    sizes="200px"
                    priority
                  />
                </div>
              )}

              {/* Text + CTA */}
              <div className="flex flex-col items-center text-center md:items-start md:text-left">
                <h2 className="max-w-xl font-[family-name:var(--font-display)] text-[2rem] font-bold leading-tight text-white drop-shadow-lg sm:text-[2.5rem]">
                  {featured.title}
                </h2>
                <p className="mt-2 font-[family-name:var(--font-mono)] text-[0.8125rem] uppercase tracking-wider text-white/70">
                  {formatDate(featured.date_start)}
                  {featured.venue_name && ` · ${featured.venue_name}`}
                </p>
                {featured.price_from != null && (
                  <span className="mt-3 inline-block rounded-full bg-white/15 px-4 py-1.5 font-[family-name:var(--font-data)] text-[0.875rem] font-medium text-white backdrop-blur-sm">
                    From {featured.price_from} {featured.currency}
                  </span>
                )}
                <Link href={`/events/${featured.slug}`} className="mt-5">
                  <Button
                    variant="solid"
                    size="lg"
                    className="rounded-full font-[family-name:var(--font-display)] font-semibold text-white"
                    style={{ backgroundColor: 'var(--brand-primary)' }}
                  >
                    Get Tickets
                    <Icon icon="mdi:arrow-right" className="ml-1" width={20} />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* "Also coming up" strip */}
      {upcoming.length > 0 && (
        <div className="border-b border-white/10 bg-black/90 px-4 py-4 sm:px-6">
          <p className="mb-3 font-[family-name:var(--font-display)] text-[0.75rem] font-semibold uppercase tracking-widest text-white/50">
            Also coming up
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {upcoming.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="group flex flex-shrink-0 items-center gap-3 rounded-lg bg-white/5 p-2 pr-4 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
              >
                {event.poster_url ? (
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md">
                    <Image
                      src={event.poster_url}
                      alt={`${event.title} poster`}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-md bg-white/10">
                    <Icon icon="mdi:calendar" className="text-white/40" width={24} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-[family-name:var(--font-display)] text-[0.875rem] font-semibold text-white">
                    {event.title}
                  </p>
                  <p className="font-[family-name:var(--font-mono)] text-[0.6875rem] uppercase tracking-wider text-white/50">
                    {formatDate(event.date_start)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
