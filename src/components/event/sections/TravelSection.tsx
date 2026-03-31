import { Icon } from '@iconify/react';
import type { ITravelRec } from '@/types';

interface TravelSectionProps {
	recommendations: ITravelRec[];
}

const typeConfig: Record<string, { icon: string; label: string }> = {
	hotel: { icon: 'mdi:bed', label: 'Accommodation' },
	restaurant: { icon: 'mdi:silverware-fork-knife', label: 'Food & Drink' },
	flight: { icon: 'mdi:airplane', label: 'Flights' },
	transport: { icon: 'mdi:bus', label: 'Getting There' },
	other: { icon: 'mdi:map-marker-star', label: 'Recommendations' },
};

export default function TravelSection({ recommendations }: TravelSectionProps) {
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
		<section className="mt-8">
			<h2 className="mb-4 font-[family-name:var(--font-display)] text-[1.5rem] font-semibold text-[var(--theme-text)]">
				Travel & Stay
			</h2>
			<div className="space-y-5">
				{sortedTypes.map((type) => {
					const config = typeConfig[type] || typeConfig.other;
					return (
						<div key={type}>
							<p className="mb-2 flex items-center gap-2 text-[0.6875rem] font-medium uppercase tracking-wider text-[var(--theme-text-muted)]">
								<Icon icon={config.icon} width={16} />
								{config.label}
							</p>
							<div className="space-y-2">
								{grouped[type].map((rec) => (
									<div
										key={rec.id}
										className="rounded-lg bg-[var(--theme-surface)] p-3"
									>
										<div className="flex items-start justify-between gap-2">
											<div className="min-w-0">
												{rec.url ? (
													<a
														href={rec.url}
														target="_blank"
														rel="noopener noreferrer"
														className="font-[family-name:var(--font-display)] text-[0.875rem] font-semibold text-[var(--brand-primary)] hover:underline"
													>
														{rec.name}
													</a>
												) : (
													<p className="font-[family-name:var(--font-display)] text-[0.875rem] font-semibold text-[var(--theme-text)]">
														{rec.name}
													</p>
												)}
												{rec.address && (
													<p className="mt-0.5 text-[0.75rem] text-[var(--theme-text-muted)]">
														{rec.address}
													</p>
												)}
											</div>
											{rec.price_range && (
												<span className="shrink-0 font-[family-name:var(--font-data)] text-[0.75rem] font-medium text-[var(--theme-text-muted)]">
													{rec.price_range}
												</span>
											)}
										</div>
										{rec.description && (
											<p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[var(--theme-text-muted)]">
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
		</section>
	);
}
