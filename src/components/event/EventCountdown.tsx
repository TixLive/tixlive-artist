import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';

interface EventCountdownProps {
  /** ISO datetime the event starts (first session). */
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

/**
 * Live countdown to the event start. Gated by the caller on
 * `fomo_enabled && fomo_countdown`. Starts null on the server (no hydration
 * mismatch) and ticks client-side; renders nothing once the date has passed.
 */
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
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 self-start rounded-[22px] border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] px-5 py-3.5">
      <div className="flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[var(--theme-text-muted)]">
        <Icon icon="mdi:timer-outline" width={15} className="text-[var(--brand-accent)]" />
        <span>{t('countdown.event_starts_in')}</span>
      </div>
      <div className="flex items-center gap-4">
        {units.map((unit) => (
          <div key={unit.label} className="flex flex-col items-center">
            <span className="font-[family-name:var(--font-data)] text-[1.25rem] font-bold leading-none tabular-nums text-[var(--theme-text)]">
              {String(unit.value).padStart(2, '0')}
            </span>
            <span className="mt-1 font-[family-name:var(--font-mono)] text-[0.5625rem] uppercase tracking-[0.12em] text-[var(--theme-text-muted)]">
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
