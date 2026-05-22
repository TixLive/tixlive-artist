import { useTranslation } from 'next-i18next';
import { Icon } from '@iconify/react';
import type { ISeatingTier } from '@/types';
import { tierColor } from '@/lib/tierColors';

interface SeatLegendProps {
	tiers: ISeatingTier[];
	/** tier id → number of seats currently selected in that tier. */
	counts: Map<number, number>;
	/** Stable tier id → swatch colour (matches the canvas + selected list). */
	colorByTierId: Map<number, string>;
	currency: string;
}

/**
 * Category legend: a color/price KEY for the hall. One row per tier (dot + name +
 * price). A small brand-accent "selected" badge appears ONLY on tiers the buyer has
 * picked from (count > 0) — 0-selected tiers stay a clean key, so picked categories
 * pop and the row isn't a cluttered scoreboard. Per-seat detail lives in YOUR SEATS.
 */
export default function SeatLegend({ tiers, counts, colorByTierId, currency }: SeatLegendProps) {
	const { t } = useTranslation('common');

	return (
		<div>
			<h3 className="mb-3 font-[family-name:var(--font-display)] text-[0.8125rem] font-[700] uppercase tracking-[0.06em] text-[var(--theme-text-muted)]">
				{t('seating.categories')}
			</h3>
			<ul className="space-y-2.5">
				{tiers.map((tier, i) => {
					const selected = counts.get(tier.ticket_package_id) ?? 0;
					return (
						<li key={tier.ticket_package_id} className="flex items-center gap-3">
							<span
								className="h-3.5 w-3.5 shrink-0 rounded-full"
								style={{ backgroundColor: colorByTierId.get(tier.ticket_package_id) ?? tierColor(tier, i) }}
								aria-hidden="true"
							/>
							<div className="min-w-0 flex-1">
								<p className="truncate text-[0.875rem] font-medium text-[var(--theme-text)]">{tier.name}</p>
							</div>
							<span className="shrink-0 font-[family-name:var(--font-data)] text-[0.8125rem] tabular-nums text-[var(--theme-text-muted)]">
								{tier.price} {currency}
							</span>
							{selected > 0 && (
								<span
									className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-[color-mix(in_srgb,var(--brand-accent)_14%,transparent)] px-1.5 py-0.5 font-[family-name:var(--font-data)] text-[0.6875rem] font-semibold tabular-nums text-[var(--brand-accent)]"
									aria-label={t('seating.seat_count_sr', { count: selected, tier: tier.name })}
								>
									<Icon icon="mdi:check" width={12} aria-hidden="true" />
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
