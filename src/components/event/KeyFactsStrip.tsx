import { Icon } from '@iconify/react';
import { Trans, useTranslation } from 'next-i18next';

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
  useTranslation('common');
  const showViewers = !!(event.fomo_enabled && event.fomo_live_viewers);
  const showRecentSales = !!(event.fomo_enabled && event.fomo_recent_sales);

  if (!showViewers && !showRecentSales) return null;

  const viewers = seededValue(event.id + 7, 18, 64);
  const recentSales = seededValue(event.id + 23, 12, 48);

  return (
    <div className="inline-flex flex-wrap items-center gap-x-4 gap-y-2 self-start rounded-full border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] px-4 py-2.5 text-[0.8125rem] text-[var(--theme-text-muted)]">
      {/* Live viewers */}
      {showViewers && (
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#16A34A] animate-v2-pulse-dot" />
          <span>
            <Trans
              i18nKey="fomo.viewing_now"
              count={viewers}
              components={{ b: <b className="font-[family-name:var(--font-display)] font-[700] text-[var(--theme-text)]" /> }}
            />
          </span>
        </span>
      )}

      {showViewers && showRecentSales && (
        <span className="h-4 w-px bg-[color-mix(in_srgb,var(--theme-text)_12%,transparent)]" />
      )}

      {/* Recent sales */}
      {showRecentSales && (
        <span className="flex items-center gap-1.5">
          <Icon icon="mdi:fire" width={15} className="text-[#D97706]" />
          <span>
            <Trans
              i18nKey="fomo.sold_recently"
              count={recentSales}
              components={{ b: <b className="font-[family-name:var(--font-display)] font-[700] text-[var(--theme-text)]" /> }}
            />
          </span>
        </span>
      )}
    </div>
  );
}
