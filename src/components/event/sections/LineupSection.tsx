import Image from 'next/image';
import { Icon } from '@iconify/react';
import type { IArtist } from '@/types';

interface LineupSectionProps {
	artists: IArtist[];
}

export default function LineupSection({ artists }: LineupSectionProps) {
	if (!artists.length) return null;

	return (
		<section className="mt-10">
			<h2 className="mb-4 font-[family-name:var(--font-display)] text-[1.5rem] font-[700] text-[var(--theme-text)]">
				Lineup
			</h2>
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
				{artists.map((artist) => (
					<div
						key={artist.id}
						className="group relative overflow-hidden rounded-2xl bg-[var(--theme-surface)]"
					>
						<div className="relative aspect-square">
							{artist.image_url ? (
								<Image
									src={artist.image_url}
									alt={artist.name}
									fill
									className="object-cover transition-transform duration-300 group-hover:scale-105"
									sizes="(max-width: 640px) 50vw, 33vw"
								/>
							) : (
								<div className="flex h-full w-full items-center justify-center bg-[color-mix(in_srgb,var(--brand-accent)_15%,transparent)]">
									<Icon
										icon="mdi:account-music"
										width={48}
										className="text-[color-mix(in_srgb,var(--brand-accent)_60%,transparent)]"
									/>
								</div>
							)}
							<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8">
								<p className="font-[family-name:var(--font-display)] text-[0.9375rem] font-[700] leading-tight text-white">
									{artist.name}
								</p>
								{artist.role && (
									<p className="mt-0.5 text-[0.75rem] text-white/70">
										{artist.role}
									</p>
								)}
							</div>
						</div>
						{artist.category && (
							<div className="px-3 py-2">
								<span className="text-[0.6875rem] font-medium uppercase tracking-wider text-[var(--theme-text-muted)]">
									{artist.category}
								</span>
							</div>
						)}
					</div>
				))}
			</div>
		</section>
	);
}
