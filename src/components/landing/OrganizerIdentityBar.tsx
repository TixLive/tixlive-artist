import Image from 'next/image';
import { Icon } from '@iconify/react';
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
  const socialEntries = Object.entries(organizer.social_links || {}).filter(([, url]) => url);

  return (
    <div className="border-b border-[var(--theme-surface)] bg-[var(--theme-bg)] px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        {/* Logo */}
        {organizer.logo_url ? (
          <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full">
            <Image
              src={organizer.logo_url}
              alt={`${organizer.name} logo`}
              fill
              className="object-cover"
              sizes="36px"
            />
          </div>
        ) : (
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--theme-surface)]">
            <Icon icon="mdi:account-group" className="text-[var(--theme-text-muted)]" width={20} />
          </div>
        )}

        {/* Name + tagline */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-[family-name:var(--font-display)] text-[0.9375rem] font-semibold text-[var(--theme-text)]">
              {organizer.name}
            </span>
            {eventCount > 0 && (
              <span className="flex-shrink-0 font-[family-name:var(--font-data)] text-[0.75rem] text-[var(--theme-text-muted)]">
                · {eventCount} event{eventCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {organizer.bio && (
            <p className="truncate text-[0.75rem] text-[var(--theme-text-muted)]">
              {organizer.bio}
            </p>
          )}
        </div>

        {/* Social icons */}
        {socialEntries.length > 0 && (
          <div className="hidden items-center gap-1 sm:flex">
            {socialEntries.map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--theme-text-muted)] transition-colors hover:text-[var(--brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
                aria-label={`${organizer.name} on ${platform}`}
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
