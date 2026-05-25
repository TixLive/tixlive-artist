import { Icon } from '@iconify/react';

export type TicketAvailabilityVariant = 'sold_out' | 'coming_soon' | 'closed';

// Colors follow the DESIGN.md semantic palette (Error / Info / muted).
const VARIANTS: Record<
  TicketAvailabilityVariant,
  { icon: string; title: string; subtitle: string; color: string }
> = {
  sold_out: {
    icon: 'mdi:alert-circle',
    title: 'Sold Out',
    subtitle: 'This event is no longer available',
    color: '#DC2626',
  },
  coming_soon: {
    icon: 'mdi:clock-outline',
    title: 'Coming Soon',
    subtitle: 'Tickets are not on sale yet',
    color: '#2563EB',
  },
  closed: {
    icon: 'mdi:lock-outline',
    title: 'Sales Ended',
    subtitle: 'Ticket sales for this event have closed',
    color: 'var(--theme-text-muted)',
  },
};

interface TicketAvailabilityNoticeProps {
  variant: TicketAvailabilityVariant;
}

/**
 * Replaces the ticket selector when an event cannot be purchased — whether it is
 * sold out, not yet on sale (`soon`), or no longer on sale (`closed`).
 */
export default function TicketAvailabilityNotice({ variant }: TicketAvailabilityNoticeProps) {
  const { icon, title, subtitle, color } = VARIANTS[variant];

  return (
    <div className="rounded-[22px] border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] py-10 text-center">
      <Icon icon={icon} className="mx-auto mb-2.5" width={34} style={{ color }} />
      <p className="font-[family-name:var(--font-display)] text-[1.125rem] font-[700] tracking-[-0.01em]" style={{ color }}>
        {title}
      </p>
      <p className="mt-1.5 text-[0.875rem] text-[var(--theme-text-muted)]">{subtitle}</p>
    </div>
  );
}
