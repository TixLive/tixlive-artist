import { useRef, useCallback } from 'react';
import { useTranslation } from 'next-i18next';
import { IEventSession } from '@/types';
import { formatEventDateParts } from '@/lib/datetime';

interface SessionPickerProps {
  sessions: IEventSession[];
  activeSessionId: number;
  onSelect: (sessionId: number) => void;
}

export default function SessionPicker({ sessions, activeSessionId, onSelect }: SessionPickerProps) {
  const { t } = useTranslation('common');
  const containerRef = useRef<HTMLDivElement>(null);

  // Format in the session's own venue timezone (not the viewer's).
  const formatSessionDate = (dateStr: string, timeZone?: string) => {
    const { weekday, day, month } = formatEventDateParts(dateStr, timeZone, 'ro-RO', { weekday: 'short', month: 'short' });
    return `${weekday} ${day} ${month}`;
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
      aria-label={t('sessions.label')}
      className="inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-[var(--bg-2)] p-1.5"
      style={{ scrollbarWidth: 'none' }}
      onKeyDown={handleKeyDown}
    >
      {sessions.map((session) => {
        const isActive = session.id === activeSessionId;

        return (
          <button
            key={session.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[13.5px] font-[600] tracking-[-0.005em] transition-colors duration-150 ${
              isActive
                ? 'bg-[var(--ink)] text-white'
                : 'text-[var(--ink)] hover:bg-[var(--bg-3)]'
            }`}
            onClick={() => onSelect(session.id)}
          >
            {session.label || formatSessionDate(session.date, session.timezone)}
          </button>
        );
      })}
    </div>
  );
}
