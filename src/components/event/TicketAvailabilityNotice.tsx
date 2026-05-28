import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';

export type TicketAvailabilityVariant = 'sold_out' | 'coming_soon' | 'closed';

const VARIANT_META: Record<TicketAvailabilityVariant, { icon: string; color: string }> = {
	sold_out: { icon: 'mdi:alert-circle', color: '#DC2626' },
	coming_soon: { icon: 'mdi:clock-outline', color: '#2563EB' },
	closed: { icon: 'mdi:lock-outline', color: 'var(--ink-3)' },
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
		<div className="rounded-[18px] bg-[var(--surface)] py-10 text-center" style={{ boxShadow: 'var(--shadow-2)' }}>
			<Icon icon={icon} className="mx-auto mb-2.5" width={34} style={{ color }} />
			<p className="text-[18px] font-[800] tracking-[-0.018em]" style={{ color }}>
				{title}
			</p>
			<p className="mt-1.5 text-[13.5px] text-[var(--ink-3)]">{subtitle}</p>
		</div>
	);
}
