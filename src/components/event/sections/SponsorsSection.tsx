import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import type { ISponsor } from '@/types';
import SectionShell from '@/components/event/sections/SectionShell';

interface SponsorsSectionProps {
	sponsors: ISponsor[];
}

const TIER_ORDER = ['Platinum', 'Gold', 'Silver'];

/**
 * Infinite-scroll marquee of sponsor chips. Track is duplicated for a
 * seamless loop. Pause on hover. Soft fade-out edges via mask + ::before/after.
 */
export default function SponsorsSection({ sponsors }: SponsorsSectionProps) {
	const { t } = useTranslation('common');
	if (!sponsors.length) return null;

	const sorted = [...sponsors].sort((a, b) => {
		const ai = TIER_ORDER.indexOf(a.category ?? '');
		const bi = TIER_ORDER.indexOf(b.category ?? '');
		return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
	});
	const loop = [...sorted, ...sorted];

	return (
		<SectionShell label={t('sections.sponsors')} sub={t('sections.sponsors_sub')}>
			<div
				className="sponsor-marquee relative overflow-hidden rounded-[18px] bg-[var(--surface)] py-1.5"
				style={{ boxShadow: 'var(--shadow-2)' }}
			>
				<style>{`
					.sponsor-marquee::before,
					.sponsor-marquee::after {
						content: ''; position: absolute; top: 0; bottom: 0; width: 80px; z-index: 2; pointer-events: none;
					}
					.sponsor-marquee::before { left: 0; background: linear-gradient(90deg, var(--surface) 0%, transparent 100%); }
					.sponsor-marquee::after  { right: 0; background: linear-gradient(270deg, var(--surface) 0%, transparent 100%); }
					.sponsor-marquee:hover .sponsor-track { animation-play-state: paused; }
				`}</style>
				<div
					className="sponsor-track flex"
					style={{ width: 'max-content', animation: 'marquee 36s linear infinite' }}
				>
					{loop.map((sponsor, i) => (
						<SponsorChip key={`${sponsor.id}-${i}`} sponsor={sponsor} />
					))}
				</div>
			</div>
		</SectionShell>
	);
}

function SponsorChip({ sponsor }: { sponsor: ISponsor }) {
	const isPrincipal = sponsor.category === 'Platinum' || sponsor.category === 'Gold';
	const inner = (
		<div
			className="flex shrink-0 flex-col items-center justify-center gap-1.5 border-r border-[var(--line-2)]"
			style={{ minWidth: 200, padding: '18px 32px' }}
		>
			{sponsor.logo_url ? (
				<Image
					src={sponsor.logo_url}
					alt={sponsor.name}
					width={140}
					height={40}
					className="block max-h-10 w-auto object-contain"
				/>
			) : (
				<span
					className="text-center text-[var(--ink)]"
					style={{
						fontSize: isPrincipal ? 19 : 17,
						fontWeight: 800,
						letterSpacing: '-0.024em',
						whiteSpace: 'nowrap',
					}}
				>
					{sponsor.name}
				</span>
			)}
			{sponsor.category && (
				<span className="text-[9.5px] font-[700] uppercase tracking-[0.12em] text-[var(--ink-3)]">
					{sponsor.category}
				</span>
			)}
		</div>
	);

	if (sponsor.website_url && /^https?:\/\//i.test(sponsor.website_url)) {
		return (
			<a href={sponsor.website_url} target="_blank" rel="noopener noreferrer">
				{inner}
			</a>
		);
	}
	return inner;
}
