import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import SectionShell from '@/components/event/sections/SectionShell';
import type { ITravelRec } from '@/types';

interface TravelSectionProps {
	recommendations: ITravelRec[];
}

const TYPE_ICONS: Record<string, string> = {
	hotel: 'mdi:bed',
	restaurant: 'mdi:silverware-fork-knife',
	flight: 'mdi:airplane',
	transport: 'mdi:bus',
	other: 'mdi:map-marker-star',
};

export default function TravelSection({ recommendations }: TravelSectionProps) {
	const { t } = useTranslation('common');
	if (!recommendations.length) return null;

	// Group by type
	const grouped = recommendations.reduce<Record<string, ITravelRec[]>>((acc, rec) => {
		if (!acc[rec.type]) acc[rec.type] = [];
		acc[rec.type].push(rec);
		return acc;
	}, {});

	const typeOrder = ['hotel', 'restaurant', 'flight', 'transport', 'other'];
	const sortedTypes = Object.keys(grouped).sort(
		(a, b) => typeOrder.indexOf(a) - typeOrder.indexOf(b)
	);

	return (
		<SectionShell label={t('sections.travel')}>
			<div className="space-y-6">
				{sortedTypes.map((type) => {
					const icon = TYPE_ICONS[type] || TYPE_ICONS.other;
					return (
						<div key={type}>
							<p className="mb-3 flex items-center gap-2 font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[color-mix(in_srgb,var(--theme-text)_45%,transparent)]">
								<Icon
									icon={icon}
									width={14}
									className="text-[var(--brand-accent)]"
								/>
								{t(`travel.${type}`, { defaultValue: t('travel.other') })}
							</p>
							<div className="space-y-3">
								{grouped[type].map((rec) => (
									<div
										key={rec.id}
										className="rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-4"
									>
										<div className="flex items-start justify-between gap-3">
											<div className="min-w-0">
												{rec.url && /^https?:\/\//i.test(rec.url) ? (
													<a
														href={rec.url}
														target="_blank"
														rel="noopener noreferrer"
														className="rounded-sm font-[family-name:var(--font-display)] text-[1.0625rem] font-[700] tracking-[-0.01em] text-[var(--brand-accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
													>
														{rec.name}
													</a>
												) : (
													<p className="font-[family-name:var(--font-display)] text-[1.0625rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)]">
														{rec.name}
													</p>
												)}
												{rec.address && (
													<p className="mt-1 flex items-center gap-1 text-[0.8125rem] text-[var(--theme-text-muted)]">
														<Icon
															icon="mdi:map-marker-outline"
															width={14}
															className="shrink-0 text-[color-mix(in_srgb,var(--theme-text)_45%,transparent)]"
														/>
														{rec.address}
													</p>
												)}
											</div>
											{rec.price_range && (
												<span className="shrink-0 rounded-full border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] px-2.5 py-1 font-[family-name:var(--font-data)] text-[0.75rem] font-medium tabular-nums text-[var(--theme-text-muted)]">
													{rec.price_range}
												</span>
											)}
										</div>
										{rec.description && (
											<p className="mt-2.5 text-[0.875rem] leading-relaxed text-[var(--theme-text-muted)]">
												{rec.description}
											</p>
										)}
									</div>
								))}
							</div>
						</div>
					);
				})}
			</div>
		</SectionShell>
	);
}
