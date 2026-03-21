import { Icon } from '@iconify/react';
import ShareButton from '@/components/event/ShareButton';
import { IEventDetail } from '@/types';

interface KeyFactsStripProps {
  event: IEventDetail;
}

export default function KeyFactsStrip({ event }: KeyFactsStripProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="border-b border-[var(--theme-surface)] bg-[var(--theme-bg)] px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1.5">
        {/* Date */}
        <div className="flex items-center gap-1.5 text-[0.8125rem] text-[var(--theme-text)]">
          <Icon icon="mdi:calendar" className="text-[var(--theme-text-muted)]" width={16} />
          <span className="font-[family-name:var(--font-data)]">
            {formatDate(event.date_start)}, {formatTime(event.date_start)}
          </span>
        </div>

        <span className="hidden text-[var(--theme-text-muted)] sm:inline">·</span>

        {/* Venue */}
        {event.venue_name && (
          <>
            <div className="flex items-center gap-1.5 text-[0.8125rem] text-[var(--theme-text)]">
              <Icon icon="mdi:map-marker" className="text-[var(--theme-text-muted)]" width={16} />
              <span>{event.venue_name}</span>
            </div>
            <span className="hidden text-[var(--theme-text-muted)] sm:inline">·</span>
          </>
        )}

        {/* Price */}
        {event.price_from != null && (
          <>
            <div className="flex items-center gap-1.5 text-[0.8125rem] text-[var(--theme-text)]">
              <Icon icon="mdi:ticket" className="text-[var(--theme-text-muted)]" width={16} />
              <span className="font-[family-name:var(--font-data)] font-medium">
                From {event.price_from} {event.currency}
              </span>
            </div>
            <span className="hidden text-[var(--theme-text-muted)] sm:inline">·</span>
          </>
        )}

        {/* Share button */}
        <div className="ml-auto">
          <ShareButton title={event.title} variant="inline" />
        </div>
      </div>
    </div>
  );
}
