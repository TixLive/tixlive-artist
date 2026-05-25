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
 * Category legend: a color/price KEY for the hall, rendered as color-dot pills. One
 * pill per tier (dot + name + price). A small brand-accent "selected" badge appears
 * ONLY on tiers the buyer has picked from (count > 0) — 0-selected tiers stay a clean
 * key, so picked categories pop and the row isn't a cluttered scoreboard. Per-seat
 * detail lives in YOUR SEATS.
 */
export default function SeatLegend({ tiers, counts, colorByTierId, currency }: SeatLegendProps) {
	const { t } = useTranslation('common');

	return (
		<div>
			<h3 className="mb-3 font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[var(--theme-text-muted)]">
				{t('seating.categories')}
			</h3>
			<ul className="flex flex-wrap gap-2">
				{tiers.map((tier, i) => {
					const selected = counts.get(tier.ticket_package_id) ?? 0;
					return (
						<li
							key={tier.ticket_package_id}
							className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] py-1.5 pl-2.5 pr-3"
						>
							<span
								className="h-2.5 w-2.5 shrink-0 rounded-full"
								style={{ backgroundColor: colorByTierId.get(tier.ticket_package_id) ?? tierColor(tier, i) }}
								aria-hidden="true"
							/>
							<span className="font-[family-name:var(--font-body)] text-[0.75rem] font-[600] text-[var(--theme-text)]">
								{tier.name}
							</span>
							<span className="font-[family-name:var(--font-mono)] text-[0.6875rem] tracking-[0.03em] text-[var(--theme-text-muted)]">
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
