import { Icon } from '@iconify/react';

interface KeyFactsStripProps {
  event: {
    id: number;
    fomo_enabled?: boolean;
    fomo_live_viewers?: boolean;
    fomo_recent_sales?: boolean;
  };
}

/**
 * Deterministic pseudo-random integer in [min, max], seeded by the event id.
 * The admin only stores on/off toggles — there is no live viewer/sales feed —
 * so the displayed numbers are simulated. Seeding by event id keeps them stable
 * across renders (no hydration mismatch) while varying between events.
 */
function seededValue(seed: number, min: number, max: number): number {
  const frac = Math.abs(Math.sin(seed)) % 1;
  return min + Math.floor(frac * (max - min + 1));
}

export default function KeyFactsStrip({ event }: KeyFactsStripProps) {
  const showViewers = !!(event.fomo_enabled && event.fomo_live_viewers);
  const showRecentSales = !!(event.fomo_enabled && event.fomo_recent_sales);

  if (!showViewers && !showRecentSales) return null;

  const viewers = seededValue(event.id + 7, 18, 64);
  const recentSales = seededValue(event.id + 23, 12, 48);

  return (
    <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem]">
        {/* Live viewers */}
        {showViewers && (
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#16A34A] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
            </span>
            <span className="font-medium text-[var(--theme-text)]">
              {viewers} people viewing now
            </span>
          </div>
        )}

        {showViewers && showRecentSales && (
          <span className="text-[var(--theme-text-muted)]">·</span>
        )}

        {/* Recent sales */}
        {showRecentSales && (
          <div className="flex items-center gap-1.5 text-[var(--theme-text-muted)]">
            <Icon icon="mdi:fire" width={15} className="text-[#D97706]" />
            <span>{recentSales} tickets sold recently</span>
          </div>
        )}
      </div>
    </div>
  );
}
