import { useRef, useCallback } from 'react';
import { useTranslation } from 'next-i18next';
import { IEventSession } from '@/types';

interface SessionPickerProps {
  sessions: IEventSession[];
  activeSessionId: number;
  onSelect: (sessionId: number) => void;
}

export default function SessionPicker({ sessions, activeSessionId, onSelect }: SessionPickerProps) {
  const { t } = useTranslation('common');
  const containerRef = useRef<HTMLDivElement>(null);

  const formatSessionDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekday = date.toLocaleDateString('ro-RO', { weekday: 'short' });
    const day = date.getDate();
    const month = date.toLocaleDateString('ro-RO', { month: 'short' });
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
      className="inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-1.5"
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
            className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 font-[family-name:var(--font-body)] text-[0.875rem] font-[600] transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] ${
              isActive
                ? 'text-[var(--theme-bg)]'
                : 'text-[var(--theme-text)] hover:bg-[color-mix(in_srgb,var(--theme-text)_5%,transparent)]'
            }`}
            style={isActive ? { backgroundColor: 'var(--brand-primary)' } : undefined}
            onClick={() => onSelect(session.id)}
          >
            {session.label || formatSessionDate(session.date)}
          </button>
        );
      })}
    </div>
  );
}
