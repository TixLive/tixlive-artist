import { useRef, useCallback } from 'react';
import { IEventSession } from '@/types';

interface SessionPickerProps {
  sessions: IEventSession[];
  activeSessionId: number;
  onSelect: (sessionId: number) => void;
}

export default function SessionPicker({ sessions, activeSessionId, onSelect }: SessionPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const formatSessionDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
      day: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
    };
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = sessions.findIndex((s) => s.id === activeSessionId);
      let newIndex = currentIndex;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        newIndex = Math.min(currentIndex + 1, sessions.length - 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        newIndex = Math.max(currentIndex - 1, 0);
      }

      if (newIndex !== currentIndex) {
        onSelect(sessions[newIndex].id);
        const tabEl = containerRef.current?.children[newIndex] as HTMLElement;
        tabEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    },
    [sessions, activeSessionId, onSelect]
  );

  if (sessions.length <= 1) return null;

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label="Event sessions"
      className="flex gap-2 overflow-x-auto"
      style={{ scrollbarWidth: 'none' }}
      onKeyDown={handleKeyDown}
    >
      {sessions.map((session) => {
        const isActive = session.id === activeSessionId;
        const { weekday, day, month } = formatSessionDate(session.date);

        return (
          <button
            key={session.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            className={`flex min-w-[68px] shrink-0 flex-col items-center rounded-xl px-4 py-2.5 text-center transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 ${
              isActive
                ? 'text-[var(--theme-bg)]'
                : 'border border-[color-mix(in_srgb,var(--theme-text)_10%,transparent)] text-[var(--theme-text)] hover:border-[color-mix(in_srgb,var(--theme-text)_20%,transparent)]'
            }`}
            style={isActive ? { backgroundColor: 'var(--brand-primary)' } : { backgroundColor: 'var(--theme-bg)' }}
            onClick={() => onSelect(session.id)}
          >
            <span className="font-[family-name:var(--font-data)] text-[0.6875rem] font-medium uppercase tracking-wider">{weekday}</span>
            <span className="font-[family-name:var(--font-display)] text-[1.125rem] font-[800] leading-tight">{day}</span>
            <span className="font-[family-name:var(--font-data)] text-[0.6875rem]">{month}</span>
          </button>
        );
      })}
    </div>
  );
}
