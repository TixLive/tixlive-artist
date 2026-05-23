import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';

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
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] px-4 py-3">
        <div className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-[var(--theme-text-muted)]">
          <Icon icon="mdi:timer-outline" width={16} className="text-[var(--brand-accent)]" />
          <span>Event starts in</span>
        </div>
        <div className="flex items-center gap-3">
          {units.map((unit) => (
            <div key={unit.label} className="flex flex-col items-center">
              <span className="font-[family-name:var(--font-data)] text-[1.125rem] font-bold tabular-nums leading-none text-[var(--theme-text)]">
                {String(unit.value).padStart(2, '0')}
              </span>
              <span className="mt-0.5 text-[0.5625rem] font-semibold uppercase tracking-wider text-[var(--theme-text-muted)]">
                {unit.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
