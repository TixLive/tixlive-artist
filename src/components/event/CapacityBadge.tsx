interface CapacityBadgeProps {
  remainingCapacity: number | null | undefined;
}

/**
 * 4-tier urgency badge:
 * - Available (>20): no badge
 * - Low stock (≤20): amber
 * - Critical (≤5): red + pulse animation
 * - Sold out (0): red static
 */
export default function CapacityBadge({ remainingCapacity }: CapacityBadgeProps) {
  if (remainingCapacity == null || remainingCapacity > 20) return null;

  if (remainingCapacity === 0) {
    return (
      <span
        className="mt-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-[0.75rem] font-semibold text-red-600 line-through"
        aria-label="0 tickets remaining"
      >
        Sold Out
      </span>
    );
  }

  if (remainingCapacity <= 5) {
    return (
      <span
        className="animate-urgency-pulse mt-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-[0.75rem] font-semibold text-red-600"
        aria-label={`${remainingCapacity} tickets remaining`}
      >
        Only {remainingCapacity} left!
      </span>
    );
  }

  // ≤20
  return (
    <span
      className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[0.75rem] font-semibold text-amber-700"
      aria-label={`${remainingCapacity} tickets remaining`}
    >
      {remainingCapacity} left
    </span>
  );
}
