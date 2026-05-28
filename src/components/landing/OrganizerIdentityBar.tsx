import Image from 'next/image';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import { IOrganizer } from '@/types';

interface OrganizerIdentityBarProps {
  organizer: IOrganizer;
  eventCount: number;
}

const SOCIAL_ICONS: Record<string, string> = {
  instagram: 'mdi:instagram',
  facebook: 'mdi:facebook',
  twitter: 'mdi:twitter',
  youtube: 'mdi:youtube',
  tiktok: 'mdi:music-note',
  website: 'mdi:web',
};

export default function OrganizerIdentityBar({ organizer, eventCount }: OrganizerIdentityBarProps) {
  const { t } = useTranslation('common');
  const socialEntries = Object.entries(organizer.social_links || {}).filter(([, url]) => url);

  return (
    <div className="mx-auto max-w-[1120px] px-4 pt-8 sm:px-6">
      <div className="grid grid-cols-1 items-center gap-5 rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-5 shadow-[0_1px_2px_rgba(20,19,18,0.04),0_8px_24px_rgba(20,19,18,0.06)] sm:grid-cols-[auto_1fr_auto] sm:gap-6 sm:px-7 sm:py-6">
        {/* Identity: logo + name + verified pill + count */}
        <div className="flex items-center gap-4">
          {organizer.logo_url ? (
            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl sm:h-16 sm:w-16">
              <Image
                src={organizer.logo_url}
                alt={`${organizer.name} logo`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
          ) : (
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)] sm:h-16 sm:w-16">
              <span className="font-[family-name:var(--font-display)] text-2xl font-[800] text-[var(--theme-bg)]">
                {organizer.name.charAt(0)}
              </span>
            </div>
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-2.5">
              <span className="truncate font-[family-name:var(--font-display)] text-[1.25rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)] sm:text-[1.5rem]">
                {organizer.name}
              </span>
              <span className="inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-bg)] px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[var(--theme-text-muted)]">
                {t('organizer.verified')}
              </span>
            </div>
            {eventCount > 0 && (
              <p className="mt-1.5 font-[family-name:var(--font-mono)] text-[0.6875rem] uppercase tracking-[0.15em] text-[var(--theme-text-muted)]">
                {t('organizer.event_count', { count: eventCount })}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        {organizer.bio && (
          <p className="max-w-[30rem] font-[family-name:var(--font-body)] text-[0.9375rem] leading-relaxed text-[var(--theme-text-muted)]">
            {organizer.bio}
          </p>
        )}

        {/* Social icons */}
        {socialEntries.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {socialEntries.map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-bg)] text-[var(--theme-text)] transition-colors duration-200 hover:text-[var(--brand-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
                aria-label={t('organizer.social_label', { name: organizer.name, platform })}
              >
                <Icon icon={SOCIAL_ICONS[platform] || 'mdi:link'} width={18} />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
