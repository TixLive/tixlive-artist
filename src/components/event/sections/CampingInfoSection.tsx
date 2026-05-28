import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import SectionShell from '@/components/event/sections/SectionShell';

interface CampingInfoSectionProps {
	checkin?: string;
	checkout?: string;
	showers?: string;
	electricity?: string;
}

const INFO_ICONS = [
	{ key: 'checkin', icon: 'mdi:login-variant' },
	{ key: 'checkout', icon: 'mdi:logout-variant' },
	{ key: 'showers', icon: 'mdi:shower' },
	{ key: 'electricity', icon: 'mdi:flash' },
] as const;

export default function CampingInfoSection(props: CampingInfoSectionProps) {
	const { t } = useTranslation('common');
	const hasContent = props.checkin || props.checkout || props.showers || props.electricity;
	if (!hasContent) return null;

	const valueMap: Record<string, string | undefined> = {
		checkin: props.checkin,
		checkout: props.checkout,
		showers: props.showers,
		electricity: props.electricity,
	};

	return (
		<SectionShell label={t('sections.camping_info')}>
			<div className="grid grid-cols-2 gap-3">
				{INFO_ICONS.map((item) => {
					const value = valueMap[item.key];
					if (!value) return null;
					return (
						<div
							key={item.key}
							className="rounded-[14px] bg-[var(--surface)] p-4"
							style={{ boxShadow: 'var(--shadow-1)' }}
						>
							<div className="mb-2 flex items-center gap-2">
								<span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[var(--bg-2)] text-[var(--ink)]">
									<Icon icon={item.icon} width={14} />
								</span>
								<span className="text-[10.5px] font-[700] uppercase tracking-[0.12em] text-[var(--ink-3)]">
									{t(`camping.${item.key}`)}
								</span>
							</div>
							<p className="text-[15px] font-[700] leading-snug tracking-[-0.012em] text-[var(--ink)]">{value}</p>
						</div>
					);
				})}
			</div>
		</SectionShell>
	);
}
