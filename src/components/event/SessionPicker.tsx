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
        // Scroll the new tab into view
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
      className="flex gap-2 overflow-x-auto px-4 py-4 sm:px-6"
      style={{ scrollbarWidth: 'none' }}
      onKeyDown={handleKeyDown}
    >
      {sessions.map((session, index) => {
        const isActive = session.id === activeSessionId;
        const { weekday, day, month } = formatSessionDate(session.date);

        return (
          <button
            key={session.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            className={`flex min-w-[64px] shrink-0 flex-col items-center rounded-xl px-4 py-2.5 text-center transition focus-visible:ring-2 focus-visible:ring-offset-2 ${
              isActive
                ? 'text-white shadow-sm'
                : 'border border-gray-200 hover:opacity-80'
            }`}
            style={isActive ? { backgroundColor: 'var(--brand-primary)' } : { backgroundColor: 'var(--theme-surface)', color: 'var(--theme-text)' }}
            onClick={() => onSelect(session.id)}
          >
            <span className="text-[0.75rem] font-medium uppercase">{weekday}</span>
            <span className="text-[1.125rem] font-bold leading-tight">{day}</span>
            <span className="text-[0.75rem]">{month}</span>
          </button>
        );
      })}
    </div>
  );
}
