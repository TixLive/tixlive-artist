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
							className="rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-4"
						>
							<div className="mb-2.5 flex items-center gap-2">
								<Icon
									icon={item.icon}
									width={16}
									className="text-[var(--brand-accent)]"
								/>
								<span className="font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[color-mix(in_srgb,var(--theme-text)_45%,transparent)]">
									{t(`camping.${item.key}`)}
								</span>
							</div>
							<p className="font-[family-name:var(--font-display)] text-[0.9375rem] font-[700] leading-snug tracking-[-0.01em] text-[var(--theme-text)]">
								{value}
							</p>
						</div>
					);
				})}
			</div>
		</SectionShell>
	);
}
