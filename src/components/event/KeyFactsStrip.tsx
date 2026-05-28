import { Trans, useTranslation } from 'next-i18next';

interface KeyFactsStripProps {
	event: {
		id: number;
		fomo_enabled?: boolean;
		fomo_live_viewers?: boolean;
		fomo_recent_sales?: boolean;
	};
}

/**
 * Deterministic pseudo-random integer in [min, max], seeded by the event id.
 * The admin only stores on/off toggles; numbers are simulated but stable per id.
 */
function seededValue(seed: number, min: number, max: number): number {
	const frac = Math.abs(Math.sin(seed)) % 1;
	return min + Math.floor(frac * (max - min + 1));
}

export default function KeyFactsStrip({ event }: KeyFactsStripProps) {
	useTranslation('common');
	const showViewers = !!(event.fomo_enabled && event.fomo_live_viewers);
	const showRecentSales = !!(event.fomo_enabled && event.fomo_recent_sales);

	if (!showViewers && !showRecentSales) return null;

	const viewers = seededValue(event.id + 7, 18, 64);
	const recentSales = seededValue(event.id + 23, 12, 48);

	const cell = 'flex flex-1 flex-col gap-0.5 px-3.5 py-1';
	const value = 'flex items-center gap-2 text-[13.5px] font-[800] leading-[1.2] tracking-[-0.015em] tabular-nums text-[var(--ink)]';
	const label = 'pl-4 text-[10.5px] font-[600] tracking-[0.02em] text-[var(--ink-3)]';
	const divider = 'mx-0 w-px self-stretch bg-black/10';

	return (
		<div className="flex w-full items-center rounded-[12px] bg-[var(--bg-2)] px-1.5 py-2.5">
			{showViewers && (
				<div className={cell}>
					<div className={value}>
						<span className="inline-block h-1.5 w-1.5 rounded-full bg-[#C73E3E] animate-v2-pulse-dot" />
						<span>
							<Trans
								i18nKey="fomo.viewing_now_value"
								count={viewers}
								components={{ b: <b /> }}
								defaults={`<b>${viewers}</b>`}
							/>
						</span>
					</div>
					<span className={label}>
						<Trans i18nKey="fomo.viewing_now_label" defaults="viewing now" />
					</span>
				</div>
			)}
			{showViewers && showRecentSales && <div className={divider} />}
			{showRecentSales && (
				<div className={cell}>
					<div className={value}>
						<span className="inline-block h-1.5 w-1.5 rounded-full bg-[#3D7B5C]" />
						<span className="tabular-nums">{recentSales}</span>
					</div>
					<span className={label}>
						<Trans i18nKey="fomo.sold_recently_label" defaults="sold in the last hour" />
					</span>
				</div>
			)}
		</div>
	);
}
