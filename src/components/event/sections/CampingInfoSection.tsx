import { Icon } from '@iconify/react';

interface CampingInfoSectionProps {
	checkin?: string;
	checkout?: string;
	showers?: string;
	electricity?: string;
}

const infoItems = [
	{ key: 'checkin', icon: 'mdi:login-variant', label: 'Check-in' },
	{ key: 'checkout', icon: 'mdi:logout-variant', label: 'Check-out' },
	{ key: 'showers', icon: 'mdi:shower', label: 'Showers' },
	{ key: 'electricity', icon: 'mdi:flash', label: 'Electricity' },
] as const;

export default function CampingInfoSection(props: CampingInfoSectionProps) {
	const hasContent = props.checkin || props.checkout || props.showers || props.electricity;
	if (!hasContent) return null;

	const valueMap: Record<string, string | undefined> = {
		checkin: props.checkin,
		checkout: props.checkout,
		showers: props.showers,
		electricity: props.electricity,
	};

	return (
		<section className="mt-8">
			<h2 className="mb-4 font-[family-name:var(--font-display)] text-[1.5rem] font-semibold text-[var(--theme-text)]">
				Camping Info
			</h2>
			<div className="grid grid-cols-2 gap-3">
				{infoItems.map((item) => {
					const value = valueMap[item.key];
					if (!value) return null;
					return (
						<div
							key={item.key}
							className="rounded-xl bg-[var(--theme-surface)] p-4"
						>
							<div className="mb-2 flex items-center gap-2">
								<Icon
									icon={item.icon}
									width={20}
									className="text-[var(--brand-primary)]"
								/>
								<span className="text-[0.6875rem] font-medium uppercase tracking-wider text-[var(--theme-text-muted)]">
									{item.label}
								</span>
							</div>
							<p className="text-[0.8125rem] leading-relaxed text-[var(--theme-text)]">
								{value}
							</p>
						</div>
					);
				})}
			</div>
		</section>
	);
}
