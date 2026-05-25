import Image from 'next/image';
import { Icon } from '@iconify/react';
import type { ISpeaker } from '@/types';
import SectionShell from '@/components/event/sections/SectionShell';

interface SpeakersSectionProps {
	speakers: ISpeaker[];
}

export default function SpeakersSection({ speakers }: SpeakersSectionProps) {
	if (!speakers.length) return null;

	return (
		<SectionShell label="Speakers">
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				{speakers.map((speaker) => (
					<div
						key={speaker.id}
						className="flex gap-4 rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-4"
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
							<div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--brand-accent)_25%,transparent)] bg-[color-mix(in_srgb,var(--brand-accent)_6%,transparent)]">
								<Icon
									icon="mdi:account"
									width={32}
									className="text-[color-mix(in_srgb,var(--brand-accent)_55%,transparent)]"
								/>
							</div>
						)}
						<div className="min-w-0">
							<p className="font-[family-name:var(--font-display)] text-[1.0625rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)]">
								{speaker.name}
							</p>
							{(speaker.title || speaker.company) && (
								<p className="mt-0.5 text-[0.8125rem] font-[family-name:var(--font-body)] text-[var(--brand-accent)]">
									{[speaker.title, speaker.company].filter(Boolean).join(' · ')}
								</p>
							)}
							{speaker.bio && (
								<p className="mt-2 line-clamp-2 text-[0.8125rem] leading-relaxed text-[var(--theme-text-muted)]">
									{speaker.bio}
								</p>
							)}
						</div>
					</div>
				))}
			</div>
		</SectionShell>
	);
}
