import Image from 'next/image';
import { Icon } from '@iconify/react';
import type { ISpeaker } from '@/types';

interface SpeakersSectionProps {
	speakers: ISpeaker[];
}

export default function SpeakersSection({ speakers }: SpeakersSectionProps) {
	if (!speakers.length) return null;

	return (
		<section className="mt-8">
			<h2 className="mb-4 font-[family-name:var(--font-display)] text-[1.5rem] font-semibold text-[var(--theme-text)]">
				Speakers
			</h2>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				{speakers.map((speaker) => (
					<div
						key={speaker.id}
						className="flex gap-3 rounded-xl bg-[var(--theme-surface)] p-4"
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
							<div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)]">
								<Icon
									icon="mdi:account"
									width={32}
									className="text-[color-mix(in_srgb,var(--brand-primary)_60%,transparent)]"
								/>
							</div>
						)}
						<div className="min-w-0">
							<p className="font-[family-name:var(--font-display)] text-[0.9375rem] font-semibold text-[var(--theme-text)]">
								{speaker.name}
							</p>
							{(speaker.title || speaker.company) && (
								<p className="mt-0.5 text-[0.75rem] text-[var(--brand-primary)]">
									{[speaker.title, speaker.company].filter(Boolean).join(' · ')}
								</p>
							)}
							{speaker.bio && (
								<p className="mt-1.5 line-clamp-2 text-[0.8125rem] leading-relaxed text-[var(--theme-text-muted)]">
									{speaker.bio}
								</p>
							)}
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
