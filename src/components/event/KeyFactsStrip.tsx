import { Icon } from '@iconify/react';

interface KeyFactsStripProps {
  event: {
    remaining_capacity: number;
  };
}

export default function KeyFactsStrip({ event }: KeyFactsStripProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem]">
        {/* Live viewers */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          <span className="font-medium text-[var(--theme-text)]">
            42 people viewing now
          </span>
        </div>

        <span className="text-[var(--theme-text-muted)]">·</span>

        {/* Recent sales */}
        <div className="flex items-center gap-1.5 text-[var(--theme-text-muted)]">
          <Icon icon="mdi:fire" width={15} className="text-orange-500" />
          <span>30 tickets sold recently</span>
        </div>
      </div>
    </div>
  );
}
