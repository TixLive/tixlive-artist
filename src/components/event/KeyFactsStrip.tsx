import { useEffect, useState, type ReactNode } from 'react';
import { Trans, useTranslation } from 'next-i18next';

interface KeyFactsStripProps {
	event: {
		id: number;
		date_start: string;
		remaining_capacity?: number | null;
		fomo_enabled?: boolean;
		fomo_live_viewers?: boolean;
		fomo_recent_sales?: boolean;
		fomo_low_stock?: boolean;
		fomo_countdown?: boolean;
	};
	/** ISO date string — preferred over event.date_start when provided (e.g. first session). */
	target?: string;
}

/**
 * Deterministic pseudo-random integer in [min, max], seeded by the event id.
 * The admin only stores on/off toggles; numbers are simulated but stable per id.
 */
function seededValue(seed: number, min: number, max: number): number {
	const frac = Math.abs(Math.sin(seed)) % 1;
	return min + Math.floor(frac * (max - min + 1));
}

interface CountdownPart {
	n: number;
	unitKey: 'unit_month' | 'unit_day' | 'unit_hour' | 'unit_minute' | 'unit_second';
}

function getCountdownParts(targetMs: number, nowMs: number): CountdownPart[] | null {
	const ms = targetMs - nowMs;
	if (ms <= 0) return null;
	const totalDays = Math.floor(ms / 86_400_000);
	const months = Math.floor(totalDays / 30);
	const days = totalDays - months * 30;
	const hours = Math.floor((ms % 86_400_000) / 3_600_000);
	const mins = Math.floor((ms % 3_600_000) / 60_000);
	const secs = Math.floor((ms % 60_000) / 1_000);

	const parts: CountdownPart[] = [];
	if (months > 0) parts.push({ n: months, unitKey: 'unit_month' });
	if (days > 0) parts.push({ n: days, unitKey: 'unit_day' });
	if (hours > 0) parts.push({ n: hours, unitKey: 'unit_hour' });
	if (mins > 0) parts.push({ n: mins, unitKey: 'unit_minute' });
	if (secs > 0 || parts.length < 2) parts.push({ n: secs, unitKey: 'unit_second' });
	return parts.slice(0, 3);
}

export default function KeyFactsStrip({ event, target }: KeyFactsStripProps) {
	const { t } = useTranslation('common');
	const fomoOn = !!event.fomo_enabled;
	const showViewers = fomoOn && !!event.fomo_live_viewers;
	const showRecentSales = fomoOn && !!event.fomo_recent_sales;
	const showAvailable = fomoOn && !!event.fomo_low_stock && event.remaining_capacity != null;
	const showCountdown = fomoOn && !!event.fomo_countdown;

	const targetIso = target ?? event.date_start;
	const targetMs = new Date(targetIso).getTime();
	const [parts, setParts] = useState<CountdownPart[] | null>(null);

	useEffect(() => {
		if (!showCountdown || !Number.isFinite(targetMs)) return;
		const tick = () => setParts(getCountdownParts(targetMs, Date.now()));
		tick();
		const interval = setInterval(tick, 1_000);
		return () => clearInterval(interval);
	}, [showCountdown, targetMs]);

	const countdownReady = showCountdown && parts != null;
	if (!showViewers && !showRecentSales && !showAvailable && !countdownReady) return null;

	const viewers = seededValue(event.id + 7, 18, 64);
	const recentSales = seededValue(event.id + 23, 12, 48);

	return (
		<div className="flex w-full items-center rounded-[12px] bg-[var(--bg-2)] px-1.5 py-2.5">
			{showViewers && (
				<Cell
					dot="#C73E3E"
					pulse
					value={
						<Trans
							i18nKey="fomo.viewing_now_value"
							count={viewers}
							components={{ b: <b /> }}
							defaults={`<b>${viewers}</b>`}
						/>
					}
					label={<Trans i18nKey="fomo.viewing_now_label" defaults="viewing now" />}
				/>
			)}
			{showViewers && (showRecentSales || showAvailable || countdownReady) && <Divider />}
			{showRecentSales && (
				<Cell
					dot="#3D7B5C"
					value={<span className="tabular-nums">{recentSales}</span>}
					label={<Trans i18nKey="fomo.sold_recently_label" defaults="sold in last hour" />}
				/>
			)}
			{showRecentSales && (showAvailable || countdownReady) && <Divider />}
			{showAvailable && (
				<Cell
					dot="#D9892E"
					value={<span className="tabular-nums">{event.remaining_capacity!.toLocaleString()}</span>}
					label={<Trans i18nKey="fomo.available_label" defaults="available" />}
				/>
			)}
			{showAvailable && countdownReady && <Divider />}
			{countdownReady && parts && (
				<Cell
					dot="var(--ink)"
					value={
						<span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
							{parts.map((p, i) => (
								<span key={i} className="inline-flex items-baseline gap-[3px]">
									<span className="tabular-nums">{p.n}</span>
									<span className="text-[0.6em] font-[600] tracking-normal text-[var(--ink-3)]">
										{t(`fomo.${p.unitKey}_${p.n === 1 ? 'one' : 'other'}`)}
									</span>
								</span>
							))}
						</span>
					}
					label={<Trans i18nKey="fomo.until_event" defaults="until event" />}
				/>
			)}
		</div>
	);
}

interface CellProps {
	dot: string;
	pulse?: boolean;
	value: ReactNode;
	label: ReactNode;
}

function Cell({ dot, pulse, value, label }: CellProps) {
	return (
		<div className="flex min-w-0 flex-1 flex-col gap-0.5 px-3.5 py-1">
			<div className="flex min-w-0 items-center gap-[7px]">
				<span
					className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full${pulse ? ' animate-v2-pulse-dot' : ''}`}
					style={{ background: dot }}
				/>
				<span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px] font-[800] leading-[1.2] tracking-[-0.015em] tabular-nums text-[var(--ink)]">
					{value}
				</span>
			</div>
			<div className="flex min-w-0 items-center gap-[7px]">
				<span className="w-1.5 shrink-0" />
				<span className="overflow-hidden text-ellipsis whitespace-nowrap text-[10.5px] font-[600] tracking-[0.02em] text-[var(--ink-3)]">
					{label}
				</span>
			</div>
		</div>
	);
}

function Divider() {
	return <div className="mx-0 w-px self-stretch bg-black/10" />;
}
