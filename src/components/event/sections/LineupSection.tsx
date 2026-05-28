import Image from 'next/image';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import type { IArtist } from '@/types';
import SectionShell from '@/components/event/sections/SectionShell';

interface LineupSectionProps {
	artists: IArtist[];
}

export default function LineupSection({ artists }: LineupSectionProps) {
	const { t } = useTranslation('common');
	if (!artists.length) return null;

	return (
		<SectionShell label={t('sections.lineup')}>
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
				{artists.map((artist) => {
					const isHeadliner = artist.role ? /headlin/i.test(artist.role) : false;

					return (
						<div
							key={artist.id}
							className={`group relative overflow-hidden rounded-[22px] border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] ${
								isHeadliner ? 'col-span-2' : ''
							}`}
						>
							<div className={`relative ${isHeadliner ? 'aspect-[1/0.75]' : 'aspect-[1/1.15]'}`}>
								{artist.image_url ? (
									<Image
										src={artist.image_url}
										alt={artist.name}
										fill
										className="object-cover transition-transform duration-500 group-hover:scale-105"
										sizes="(max-width: 640px) 50vw, 33vw"
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center bg-[color-mix(in_srgb,var(--brand-accent)_6%,transparent)]">
										<Icon
											icon="mdi:account-music"
											width={48}
											className="text-[color-mix(in_srgb,var(--brand-accent)_55%,transparent)]"
										/>
									</div>
								)}
								<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-3.5 pb-3.5 pt-12">
									{artist.role && (
										<span className="inline-flex rounded-full bg-[color-mix(in_srgb,#ffffff_18%,transparent)] px-2 py-0.5 font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-white/85 backdrop-blur-sm">
											{artist.role}
										</span>
									)}
									<p className={`mt-1.5 font-[family-name:var(--font-display)] font-[700] leading-tight tracking-[-0.01em] text-white ${
										isHeadliner ? 'text-[1.25rem]' : 'text-[1.0625rem]'
									}`}>
										{artist.name}
									</p>
								</div>
							</div>
							{artist.category && (
								<div className="px-3.5 py-2.5">
									<span className="font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[color-mix(in_srgb,var(--theme-text)_45%,transparent)]">
										{artist.category}
									</span>
								</div>
							)}
						</div>
					);
				})}
			</div>
		</SectionShell>
	);
}
