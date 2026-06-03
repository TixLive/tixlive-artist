import { useTranslation } from 'next-i18next';

interface CapacityBadgeProps {
  remainingCapacity: number | null | undefined;
  /**
   * Show the low-stock urgency indicators ("X left" / "Only X left!"). Gated by
   * the event's `fomo_low_stock` toggle on the detail page. "Sold Out" always
   * shows regardless — it is a real availability state, not a marketing nudge.
   * Defaults true so other surfaces keep their behavior.
   */
  showLowStockUrgency?: boolean;
}

/**
 * Inline availability indicator for the ticket list:
 * - Sold out (0): solid red pill — always shown.
 * - Critical (≤5): red dot + "Only X left!" + pulse — gated by showLowStockUrgency.
 * - Low (≤20): amber dot + "X left" — gated by showLowStockUrgency.
 * - Plentiful (>20): nothing.
 */
export default function CapacityBadge({
  remainingCapacity,
  showLowStockUrgency = true,
}: CapacityBadgeProps) {
  const { t } = useTranslation('common');

  if (remainingCapacity === 0) {
    return (
      <span
        className="inline-flex items-center rounded-full bg-[#DC2626] px-2 py-0.5 font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-[0.1em] text-white"
        aria-label="0 tickets remaining"
      >
        {t('event.sold_out')}
      </span>
    );
  }

  if (!showLowStockUrgency || remainingCapacity == null || remainingCapacity > 20) return null;

  const critical = remainingCapacity <= 5;
  const tone = critical ? '#DC2626' : '#D97706';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.04em] ${
        critical ? 'animate-urgency-pulse' : ''
      }`}
      style={{ color: tone }}
      aria-label={`${remainingCapacity} tickets remaining`}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone }} />
      {critical
        ? t('event.only_left', { count: remainingCapacity })
        : t('event.left', { count: remainingCapacity })}
    </span>
  );
}
