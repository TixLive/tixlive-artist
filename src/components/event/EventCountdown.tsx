import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';

interface EventCountdownProps {
	target: string;
}

interface TimeLeft {
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
}

function getTimeLeft(targetMs: number): TimeLeft | null {
	const diff = targetMs - Date.now();
	if (diff <= 0) return null;
	return {
		days: Math.floor(diff / 86_400_000),
		hours: Math.floor((diff % 86_400_000) / 3_600_000),
		minutes: Math.floor((diff % 3_600_000) / 60_000),
		seconds: Math.floor((diff % 60_000) / 1_000),
	};
}

export default function EventCountdown({ target }: EventCountdownProps) {
	const { t } = useTranslation('common');
	const targetMs = new Date(target).getTime();
	const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

	useEffect(() => {
		if (!Number.isFinite(targetMs)) return;
		const tick = () => setTimeLeft(getTimeLeft(targetMs));
		tick();
		const interval = setInterval(tick, 1_000);
		return () => clearInterval(interval);
	}, [targetMs]);

	if (!timeLeft) return null;

	const units: Array<{ label: string; value: number }> = [
		{ label: t('countdown.days'), value: timeLeft.days },
		{ label: t('countdown.hours'), value: timeLeft.hours },
		{ label: t('countdown.minutes'), value: timeLeft.minutes },
		{ label: t('countdown.seconds'), value: timeLeft.seconds },
	];

	return (
		<div className="flex flex-wrap items-center gap-x-5 gap-y-2 self-start rounded-[18px] bg-[var(--surface)] px-5 py-3.5" style={{ boxShadow: 'var(--shadow-1)' }}>
			<div className="flex items-center gap-1.5 text-[11px] font-[700] uppercase tracking-[0.12em] text-[var(--ink-3)]">
				<Icon icon="mdi:timer-outline" width={13} className="text-[var(--ink)]" />
				<span>{t('countdown.event_starts_in')}</span>
			</div>
			<div className="flex items-center gap-4">
				{units.map((unit) => (
					<div key={unit.label} className="flex flex-col items-center">
						<span className="text-[20px] font-[800] leading-none tracking-[-0.018em] tabular-nums text-[var(--ink)]">
							{String(unit.value).padStart(2, '0')}
						</span>
						<span className="mt-1 text-[9.5px] font-[700] uppercase tracking-[0.12em] text-[var(--ink-3)]">
							{unit.label}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
