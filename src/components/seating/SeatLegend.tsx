import { useTranslation } from 'next-i18next';
import { Icon } from '@iconify/react';
import type { ISeatingTier } from '@/types';
import { tierColor } from '@/lib/tierColors';

interface SeatLegendProps {
	tiers: ISeatingTier[];
	counts: Map<number, number>;
	colorByTierId: Map<number, string>;
	currency: string;
}

export default function SeatLegend({ tiers, counts, colorByTierId, currency }: SeatLegendProps) {
	const { t } = useTranslation('common');

	return (
		<div>
			<h3 className="mb-3 text-[10.5px] font-[700] uppercase tracking-[0.12em] text-[var(--ink-3)]">
				{t('seating.categories')}
			</h3>
			<ul className="flex flex-wrap gap-2">
				{tiers.map((tier, i) => {
					const selected = counts.get(tier.ticket_package_id) ?? 0;
					return (
						<li
							key={tier.ticket_package_id}
							className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-2)] py-1.5 pl-2.5 pr-3"
						>
							<span
								className="h-2.5 w-2.5 shrink-0 rounded-full"
								style={{ backgroundColor: colorByTierId.get(tier.ticket_package_id) ?? tierColor(tier, i) }}
								aria-hidden="true"
							/>
							<span className="text-[12.5px] font-[700] tracking-[-0.005em] text-[var(--ink)]">
								{tier.name}
							</span>
							<span className="text-[11.5px] font-[600] tabular-nums text-[var(--ink-3)]">
								{tier.price} {currency}
							</span>
							{selected > 0 && (
								<span
									className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-[var(--ink)] px-2 py-0.5 text-[10.5px] font-[700] tabular-nums text-white"
									aria-label={t('seating.seat_count_sr', { count: selected, tier: tier.name })}
								>
									<Icon icon="mdi:check" width={11} aria-hidden="true" />
									{selected}
								</span>
							)}
						</li>
					);
				})}
			</ul>
		</div>
	);
}
