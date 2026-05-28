import Image from 'next/image';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import type { ISpeaker } from '@/types';
import SectionShell from '@/components/event/sections/SectionShell';

interface SpeakersSectionProps {
	speakers: ISpeaker[];
}

export default function SpeakersSection({ speakers }: SpeakersSectionProps) {
	const { t } = useTranslation('common');
	if (!speakers.length) return null;

	return (
		<SectionShell label={t('sections.speakers')}>
			<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
				{speakers.map((speaker) => (
					<div
						key={speaker.id}
						className="flex gap-4 rounded-[16px] bg-[var(--surface)] p-4"
						style={{ boxShadow: 'var(--shadow-2)' }}
					>
						{speaker.image_url ? (
							<Image
								src={speaker.image_url}
								alt={speaker.name}
								width={64}
								height={64}
								className="h-16 w-16 shrink-0 rounded-full object-cover"
							/>
						) : (
							<div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--bg-2)] text-[var(--ink-3)]">
								<Icon icon="mdi:account" width={32} />
							</div>
						)}
						<div className="min-w-0">
							<p className="text-[16px] font-[700] tracking-[-0.012em] text-[var(--ink)]">{speaker.name}</p>
							{(speaker.title || speaker.company) && (
								<p className="mt-0.5 text-[13px] text-[var(--ink-3)]">
									{[speaker.title, speaker.company].filter(Boolean).join(' · ')}
								</p>
							)}
							{speaker.bio && (
								<p className="mt-2 line-clamp-2 text-[13px] leading-[1.5] text-[var(--ink-3)]">{speaker.bio}</p>
							)}
						</div>
					</div>
				))}
			</div>
		</SectionShell>
	);
}
