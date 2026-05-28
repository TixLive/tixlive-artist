import { useTranslation } from 'next-i18next';

interface CapacityBadgeProps {
  remainingCapacity: number | null | undefined;
  /**
   * Show the low-stock urgency badges ("X left" / "Only X left!"). Gated by the
   * event's `fomo_low_stock` toggle on the detail page. "Sold Out" always shows
   * regardless — it is a real availability state, not a marketing nudge.
   * Defaults true so other surfaces (landing cards) keep their behavior.
   */
  showLowStockUrgency?: boolean;
}

/**
 * 4-tier urgency badge:
 * - Available (>20): no badge
 * - Low stock (<=20): warm amber
 * - Critical (<=5): red + pulse animation
 * - Sold out (0): red static
 */
export default function CapacityBadge({
  remainingCapacity,
  showLowStockUrgency = true,
}: CapacityBadgeProps) {
  const { t } = useTranslation('common');
  if (remainingCapacity == null || remainingCapacity > 20) return null;

  if (remainingCapacity === 0) {
    return (
      <span
        className="inline-block rounded-full bg-[#DC2626]/10 px-2.5 py-1 text-[10.5px] font-[700] uppercase tracking-[0.06em] text-[#DC2626] line-through"
        aria-label="0 tickets remaining"
      >
        {t('event.sold_out')}
      </span>
    );
  }

  if (!showLowStockUrgency) return null;

  if (remainingCapacity <= 5) {
    return (
      <span
        className="animate-urgency-pulse inline-block rounded-full bg-[#DC2626]/10 px-2.5 py-1 text-[10.5px] font-[700] uppercase tracking-[0.06em] text-[#DC2626]"
        aria-label={`${remainingCapacity} tickets remaining`}
      >
        {t('event.only_left', { count: remainingCapacity })}
      </span>
    );
  }

  // <=20
  return (
    <span
      className="inline-block rounded-full bg-[#D97706]/10 px-2.5 py-1 text-[10.5px] font-[700] uppercase tracking-[0.06em] text-[#D97706]"
      aria-label={`${remainingCapacity} tickets remaining`}
    >
      {t('event.left', { count: remainingCapacity })}
    </span>
  );
}
