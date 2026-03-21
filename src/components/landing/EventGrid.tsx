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
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <Icon icon="mdi:calendar-blank-outline" className="mb-4 h-12 w-12 text-[var(--theme-text-muted)]" />
        <h3 className="font-[family-name:var(--font-display)] text-[1.5rem] font-semibold text-[var(--theme-text)]">No upcoming events</h3>
        {organizerBio && (
          <p className="mt-3 max-w-md text-[0.875rem] text-[var(--theme-text-muted)]">{organizerBio}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Section label */}
      <div className="mb-4 flex items-center justify-between px-4 sm:px-6">
        <h2 className="font-[family-name:var(--font-display)] text-[1.5rem] font-semibold text-[var(--theme-text)]">
          {categoryLabel && categoryLabel !== 'All' ? `${categoryLabel} Events` : 'All Events'} <span className="text-[0.875rem] font-normal text-[var(--theme-text-muted)]">({total})</span>
        </h2>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-3 sm:px-6 lg:grid-cols-4 xl:grid-cols-5">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {/* Load more */}
      {total > events.length && (
        <div className="mt-8 flex justify-center pb-8">
          <Button
            variant="ghost"
            className="rounded-full"
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
