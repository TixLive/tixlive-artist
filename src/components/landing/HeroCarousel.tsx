import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import { IEventListItem } from '@/types';

interface FeaturedHeroProps {
  events: IEventListItem[];
}

export default function HeroCarousel({ events }: FeaturedHeroProps) {
  const { t } = useTranslation('common');
  const openEvents = events.filter((e) => e.status === 'open');
  if (openEvents.length === 0) return null;

  const featured = openEvents[0];
  const upcoming = openEvents.slice(1, 4);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ro-RO', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <section className="bg-[var(--theme-bg)]">
      {/* Featured hero — cinematic rounded media card */}
      <div className="mx-auto max-w-[1120px] px-4 pt-8 sm:px-6 md:pt-12">
        <div className="mb-4 flex items-center gap-3 font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[var(--theme-text-muted)]">
          <span className="h-px w-6 bg-[color-mix(in_srgb,var(--theme-text)_18%,transparent)]" />
          FEATURED
        </div>

        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[22px] bg-[var(--brand-primary)] shadow-[0_1px_2px_rgba(20,19,18,0.04),0_8px_24px_rgba(20,19,18,0.06)] sm:aspect-[16/9] sm:rounded-[28px] lg:aspect-[21/9]">
          {/* Blurred backdrop fill */}
          {featured.poster_url ? (
            <Image
              src={featured.poster_url}
              alt=""
              fill
              className="scale-110 object-cover opacity-40 blur-2xl"
              priority
              aria-hidden="true"
            />
          ) : null}

          {/* Sharp cover */}
          {featured.poster_url && (
            <Image
              src={featured.poster_url}
              alt={`${featured.title} poster`}
              fill
              className="object-cover"
              sizes="(max-width: 1120px) 100vw, 1120px"
              priority
            />
          )}

          {/* Cinematic gradient */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(0,0,0,.28) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 52%, rgba(0,0,0,.82) 100%)',
            }}
          />

          {/* Top-left pills */}
          <div className="absolute left-4 top-4 z-10 flex gap-2 sm:left-7 sm:top-7">
            <span className="inline-flex items-center rounded-full bg-[var(--brand-accent)] px-3.5 py-1.5 font-[family-name:var(--font-mono)] text-[0.6875rem] uppercase tracking-[0.15em] text-white">
              FEATURED
            </span>
            {featured.event_type && (
              <span className="inline-flex items-center rounded-full bg-[var(--theme-bg)]/95 px-3.5 py-1.5 font-[family-name:var(--font-mono)] text-[0.6875rem] uppercase tracking-[0.15em] text-[var(--theme-text)] backdrop-blur-sm">
                {featured.event_type}
              </span>
            )}
          </div>

          {/* Title + meta + CTA — bottom */}
          <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-5 sm:px-7 sm:pb-8">
            <h2 className="max-w-3xl font-[family-name:var(--font-display)] font-[900] leading-[0.95] tracking-[-0.03em] text-white text-[clamp(2.25rem,8vw,3rem)] [text-shadow:0_6px_28px_rgba(0,0,0,0.45)] sm:text-[clamp(3rem,6vw,5rem)]">
              {featured.title}
            </h2>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <p className="font-[family-name:var(--font-data)] text-[0.8125rem] tracking-wide text-white/80">
                {formatDate(featured.date_start)}
                {featured.venue_name && ` · ${featured.venue_name}`}
              </p>

              <Link href={`/events/${featured.slug}`} className="sm:ml-auto">
                <Button
                  variant="solid"
                  size="lg"
                  className="rounded-full bg-white pl-6 pr-1.5 font-[family-name:var(--font-display)] font-[700] text-[var(--theme-text)] shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition-opacity duration-200 hover:opacity-95"
                >
                  {t('events.get_tickets')}
                  {featured.price_from != null && (
                    <span className="ml-3 inline-flex items-center rounded-full bg-[var(--brand-accent)] px-3.5 py-1.5 font-[family-name:var(--font-mono)] text-[0.6875rem] uppercase tracking-[0.1em] text-white">
                      {t('events.price_from', { price: featured.price_from, currency: featured.currency ?? '' })}
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* "Also coming up" strip */}
      {upcoming.length > 0 && (
        <div className="mx-auto max-w-[1120px] px-4 pt-8 sm:px-6">
          <p className="mb-3 font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[var(--theme-text-muted)]">
            {t('events.also_coming_up')}
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {upcoming.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="group flex flex-shrink-0 items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-2.5 pr-5 shadow-[0_1px_2px_rgba(20,19,18,0.04),0_8px_24px_rgba(20,19,18,0.06)] transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
              >
                {event.poster_url ? (
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src={event.poster_url}
                      alt={`${event.title} poster`}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--theme-bg)]">
                    <Icon icon="mdi:calendar" className="text-[var(--theme-text-muted)]" width={24} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[var(--theme-text-muted)]">
                    {formatDate(event.date_start)}
                  </p>
                  <p className="mt-1 truncate font-[family-name:var(--font-display)] text-[0.9375rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)]">
                    {event.title}
                  </p>
                  {event.venue_name && (
                    <p className="truncate font-[family-name:var(--font-body)] text-[0.75rem] text-[var(--theme-text-muted)]">
                      {event.venue_name}
                    </p>
                  )}
                </div>
                <Icon
                  icon="mdi:arrow-right"
                  className="ml-1 flex-shrink-0 text-[var(--theme-text-muted)] transition-transform duration-200 group-hover:translate-x-0.5"
                  width={16}
                />
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
