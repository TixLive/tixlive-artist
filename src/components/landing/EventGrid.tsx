import EventCard from '@/components/landing/EventCard';
import LoadMore from '@/components/common/LoadMore';
import { IEventListItem } from '@/types';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';

interface EventGridProps {
  events: IEventListItem[];
  total: number;
  onLoadMore: () => void | Promise<unknown>;
  hasNextPage?: boolean;
  loading?: boolean;
  isError?: boolean;
  organizerBio?: string;
  categoryLabel?: string;
}

export default function EventGrid({ events, total, onLoadMore, hasNextPage, loading, isError, organizerBio, categoryLabel }: EventGridProps) {
  const { t } = useTranslation('common');

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[22px] border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)]">
          <Icon icon="mdi:calendar-blank-outline" className="h-9 w-9 text-[var(--theme-text-muted)]" />
        </div>
        <h3 className="font-[family-name:var(--font-display)] text-[1.75rem] font-[700] tracking-[-0.02em] text-[var(--theme-text)]">
          {t('events.no_upcoming')}
        </h3>
        {organizerBio && (
          <p className="mt-3 max-w-md font-[family-name:var(--font-body)] text-[0.9375rem] leading-relaxed text-[var(--theme-text-muted)]">
            {organizerBio}
          </p>
        )}
      </div>
    );
  }

  const headingLabel =
    categoryLabel && categoryLabel !== 'All'
      ? t('events.category_events', { category: categoryLabel })
      : t('events.all_events');

  const countLabel =
    total === 1
      ? t('events.events_count_one', { count: total })
      : t('events.events_count_other', { count: total });

  return (
    <div className="mx-auto max-w-[1120px]">
      {/* Section label */}
      <div className="mb-6 flex items-baseline justify-between px-4 sm:px-6">
        <h2 className="font-[family-name:var(--font-display)] text-[1.75rem] font-[700] tracking-[-0.02em] text-[var(--theme-text)] sm:text-[2rem]">
          {headingLabel}
        </h2>
        <span className="font-[family-name:var(--font-mono)] text-[0.6875rem] uppercase tracking-[0.15em] text-[var(--theme-text-muted)]">
          {countLabel}
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 px-4 sm:px-6 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {/* Load more */}
      <LoadMore
        hasNextPage={hasNextPage ?? total > events.length}
        isFetching={loading ?? false}
        isError={isError}
        onLoadMore={onLoadMore}
        label={t('events.show_more')}
      />
    </div>
  );
}
