import { useRef } from 'react';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import type { IArtist } from '@/types';
import SectionShell from '@/components/event/sections/SectionShell';

interface LineupSectionProps {
	artists: IArtist[];
}

/**
 * Horizontal scroll rail of 240px artist cards. Right-side arrow buttons (38px
 * pill, prev=bg-2 / next=ink) scroll 80% of the visible rail width.
 */
export default function LineupSection({ artists }: LineupSectionProps) {
	const { t } = useTranslation('common');
	const railRef = useRef<HTMLDivElement>(null);
	if (!artists.length) return null;

	const scroll = (dir: -1 | 1) => {
		const el = railRef.current;
		if (!el) return;
		el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
	};

	const sub = t('sections.lineup_sub', { count: artists.length });

	return (
		<SectionShell
			label={t('sections.lineup')}
			sub={sub}
			rightSlot={
				<div className="flex items-center gap-2">
					<button
						onClick={() => scroll(-1)}
						aria-label={t('sections.scroll_prev')}
						className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[var(--bg-2)] text-[var(--ink)] transition-colors duration-150 hover:bg-[var(--bg-3)]"
					>
						<Icon icon="mdi:chevron-left" width={14} />
					</button>
					<button
						onClick={() => scroll(1)}
						aria-label={t('sections.scroll_next')}
						className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[var(--ink)] text-white transition-colors duration-150 hover:bg-[var(--ink-2)]"
					>
						<Icon icon="mdi:chevron-right" width={14} />
					</button>
				</div>
			}
		>
			<div
				ref={railRef}
				className="flex gap-3.5 overflow-x-auto pb-2"
				style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}
			>
				{artists.map((artist) => (
					<div
						key={artist.id}
						className="rounded-[18px] bg-[var(--surface)] p-3.5"
						style={{ flex: '0 0 240px', scrollSnapAlign: 'start', boxShadow: 'var(--shadow-2)' }}
					>
						<div
							className="relative overflow-hidden rounded-[12px] bg-[var(--bg-2)]"
							style={{ aspectRatio: '1 / 1' }}
						>
							{artist.image_url ? (
								<Image
									src={artist.image_url}
									alt={artist.name}
									fill
									className="object-cover"
									sizes="240px"
								/>
							) : (
								<div className="flex h-full w-full items-center justify-center text-[36px] font-[800] tracking-[-0.03em] text-[var(--ink-3)]">
									{artist.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
								</div>
							)}
						</div>
						<div className="mt-3 flex min-w-0 flex-col gap-0.5">
							<span className="truncate text-[15px] font-[700] tracking-[-0.012em] text-[var(--ink)]">
								{artist.name}
							</span>
							{artist.role && (
								<span className="text-[12px] font-[500] text-[var(--ink-3)]">{artist.role}</span>
							)}
						</div>
					</div>
				))}
			</div>
		</SectionShell>
	);
}
