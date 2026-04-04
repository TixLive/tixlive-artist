import EventCard from '@/components/landing/EventCard';
import { IEventListItem } from '@/types';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';

interface EventGridProps {
  events: IEventListItem[];
  total: number;
  onLoadMore: () => void;
  loading?: boolean;
  organizerBio?: string;
  categoryLabel?: string;
}

export default function EventGrid({ events, total, onLoadMore, loading, organizerBio, categoryLabel }: EventGridProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <Icon icon="mdi:calendar-blank-outline" className="mb-4 h-10 w-10 text-[var(--theme-text-muted)]" />
        <h3 className="font-[family-name:var(--font-display)] text-[1.5rem] font-[800] tracking-tight text-[var(--theme-text)]">No upcoming events</h3>
        {organizerBio && (
          <p className="mt-3 max-w-md text-[0.875rem] leading-relaxed text-[var(--theme-text-muted)]">{organizerBio}</p>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Section label */}
      <div className="mb-6 flex items-baseline justify-between px-4 sm:px-6">
        <h2 className="font-[family-name:var(--font-display)] text-[1.5rem] font-[800] tracking-tight text-[var(--theme-text)]">
          {categoryLabel && categoryLabel !== 'All' ? `${categoryLabel} Events` : 'All Events'}
        </h2>
        <span className="font-[family-name:var(--font-data)] text-[0.8125rem] text-[var(--theme-text-muted)]">
          {total} event{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4 px-4 sm:grid-cols-3 sm:px-6 lg:grid-cols-4 xl:grid-cols-5">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {/* Load more */}
      {total > events.length && (
        <div className="mt-10 flex justify-center pb-8">
          <Button
            variant="bordered"
            className="rounded-xl border-[color-mix(in_srgb,var(--theme-text)_15%,transparent)] px-8 font-[family-name:var(--font-display)] font-[700] text-[var(--theme-text)] transition-colors duration-200 hover:border-[color-mix(in_srgb,var(--theme-text)_30%,transparent)]"
            onPress={onLoadMore}
            isLoading={loading}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
