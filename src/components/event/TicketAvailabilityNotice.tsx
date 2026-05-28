import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';

export type TicketAvailabilityVariant = 'sold_out' | 'coming_soon' | 'closed';

const VARIANT_META: Record<TicketAvailabilityVariant, { icon: string; color: string }> = {
  sold_out: { icon: 'mdi:alert-circle', color: '#DC2626' },
  coming_soon: { icon: 'mdi:clock-outline', color: '#2563EB' },
  closed: { icon: 'mdi:lock-outline', color: 'var(--theme-text-muted)' },
};

interface TicketAvailabilityNoticeProps {
  variant: TicketAvailabilityVariant;
}

export default function TicketAvailabilityNotice({ variant }: TicketAvailabilityNoticeProps) {
  const { t } = useTranslation('common');
  const { icon, color } = VARIANT_META[variant];
  const title = t(`availability.${variant}_title`);
  const subtitle = t(`availability.${variant}_subtitle`);

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
