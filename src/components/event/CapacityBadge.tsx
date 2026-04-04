interface CapacityBadgeProps {
  remainingCapacity: number | null | undefined;
}

/**
 * 4-tier urgency badge:
 * - Available (>20): no badge
 * - Low stock (<=20): warm amber
 * - Critical (<=5): red + pulse animation
 * - Sold out (0): red static
 */
export default function CapacityBadge({ remainingCapacity }: CapacityBadgeProps) {
  if (remainingCapacity == null || remainingCapacity > 20) return null;

  if (remainingCapacity === 0) {
    return (
      <span
        className="inline-block rounded-md bg-[#DC2626]/10 px-2 py-0.5 font-[family-name:var(--font-data)] text-[0.6875rem] font-semibold text-[#DC2626] line-through"
        aria-label="0 tickets remaining"
      >
        Sold Out
      </span>
    );
  }

  if (remainingCapacity <= 5) {
    return (
      <span
        className="animate-urgency-pulse inline-block rounded-md bg-[#DC2626]/10 px-2 py-0.5 font-[family-name:var(--font-data)] text-[0.6875rem] font-semibold text-[#DC2626]"
        aria-label={`${remainingCapacity} tickets remaining`}
      >
        Only {remainingCapacity} left!
      </span>
    );
  }

  // <=20
  return (
    <span
      className="inline-block rounded-md bg-[#D97706]/10 px-2 py-0.5 font-[family-name:var(--font-data)] text-[0.6875rem] font-semibold text-[#D97706]"
      aria-label={`${remainingCapacity} tickets remaining`}
    >
      {remainingCapacity} left
    </span>
  );
}
