import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { IEventListItem } from '@/types';

interface FeaturedHeroProps {
  events: IEventListItem[];
}

/**
 * FeaturedHero — shows the soonest open event as a full-width hero,
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
      <div className="relative w-full overflow-hidden bg-[var(--theme-text)]">
        <div className="relative h-[420px] sm:h-[480px] md:h-[540px]">
          {/* Blurred poster background */}
          {featured.poster_url ? (
            <Image
              src={featured.poster_url}
              alt=""
              fill
              className="scale-110 object-cover blur-2xl opacity-30"
              priority
              aria-hidden="true"
            />
          ) : (
            <div className="absolute inset-0 bg-[var(--theme-text)]" />
          )}

          {/* Content overlay */}
          <div className="relative z-10 flex h-full items-center justify-center px-6">
            <div className="flex max-w-4xl flex-col items-center gap-8 md:flex-row md:items-center md:gap-12">
              {/* Poster thumbnail */}
              {featured.poster_url && (
                <div className="relative hidden aspect-[3/4] w-[220px] flex-shrink-0 overflow-hidden rounded-2xl shadow-2xl md:block">
                  <Image
                    src={featured.poster_url}
                    alt={`${featured.title} poster`}
                    fill
                    className="object-cover"
                    sizes="220px"
                    priority
                  />
                </div>
              )}

              {/* Text + CTA */}
              <div className="flex flex-col items-center text-center md:items-start md:text-left">
                <h2 className="max-w-xl font-[family-name:var(--font-display)] text-[2.25rem] font-[900] leading-[1.1] tracking-[-0.03em] text-[var(--theme-bg)] sm:text-[2.75rem]">
                  {featured.title}
                </h2>
                <p className="mt-3 font-[family-name:var(--font-data)] text-[0.8125rem] tracking-wide text-[var(--theme-bg)]/60">
                  {formatDate(featured.date_start)}
                  {featured.venue_name && ` · ${featured.venue_name}`}
                </p>
                {featured.price_from != null && (
                  <span className="mt-4 inline-block rounded-full bg-[var(--theme-bg)]/10 px-4 py-1.5 font-[family-name:var(--font-data)] text-[0.875rem] font-medium text-[var(--theme-bg)] backdrop-blur-sm">
                    From {featured.price_from} {featured.currency}
                  </span>
                )}
                <Link href={`/events/${featured.slug}`} className="mt-6">
                  <Button
                    variant="solid"
                    size="lg"
                    className="rounded-xl bg-[var(--theme-bg)] font-[family-name:var(--font-display)] font-[700] text-[var(--theme-text)] transition-opacity duration-200 hover:opacity-90"
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
        <div className="border-b border-[color-mix(in_srgb,var(--theme-text)_6%,transparent)] bg-[var(--theme-surface)] px-4 py-4 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <p className="mb-3 font-[family-name:var(--font-display)] text-[0.6875rem] font-[700] uppercase tracking-[0.1em] text-[var(--theme-text-muted)]">
              Also coming up
            </p>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
              {upcoming.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="group flex flex-shrink-0 items-center gap-3 rounded-xl bg-[var(--theme-bg)] p-2.5 pr-5 transition-all duration-200 hover:shadow-[0_1px_3px_rgba(20,19,18,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
                >
                  {event.poster_url ? (
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={event.poster_url}
                        alt={`${event.title} poster`}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                  ) : (
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--theme-surface)]">
                      <Icon icon="mdi:calendar" className="text-[var(--theme-text-muted)]" width={24} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-[family-name:var(--font-display)] text-[0.875rem] font-[700] text-[var(--theme-text)]">
                      {event.title}
                    </p>
                    <p className="font-[family-name:var(--font-data)] text-[0.6875rem] tracking-wide text-[var(--theme-text-muted)]">
                      {formatDate(event.date_start)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
