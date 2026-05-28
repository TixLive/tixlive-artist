import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import { IEventListItem } from '@/types';
import { usePrefetchEvent } from '@/hooks/usePrefetchEvent';

interface FeaturedHeroProps {
	events: IEventListItem[];
}

/**
 * Premium split hero — left text card on blurred poster color-spill, right
 * sharp poster. Cinematic shadow, 28px radius. Mobile collapses to single
 * column with poster below text card.
 */
export default function HeroCarousel({ events }: FeaturedHeroProps) {
	const { t } = useTranslation('common');
	const prefetch = usePrefetchEvent();
	const openEvents = events.filter((e) => e.status === 'open');
	if (openEvents.length === 0) return null;

	const featured = openEvents[0];
	const date = new Date(featured.date_start);
	const dowShort = date.toLocaleDateString('ro-RO', { weekday: 'short' });
	const day = date.getDate();
	const mon = date.toLocaleDateString('ro-RO', { month: 'long' });
	const year = date.getFullYear();
	const time = date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });

	const href = `/events/${featured.slug}`;
	const venueLine = featured.venue_name;

	return (
		<section className="mx-auto max-w-[1200px] px-4 pt-8 sm:px-5 md:px-8">
			<Link
				href={href}
				onMouseEnter={() => prefetch(featured.slug)}
				onTouchStart={() => prefetch(featured.slug)}
				className="hero-split group relative isolate grid overflow-hidden rounded-[22px] shadow-[var(--shadow-cinema)] sm:rounded-[28px]"
				style={{ gridTemplateColumns: '1.05fr 1fr' }}
			>
				<style>{`
					@media (max-width: 820px) {
						.hero-split { grid-template-columns: 1fr !important; }
						.hero-text-card { padding: 32px 26px !important; gap: 24px !important; min-height: 320px; }
						.hero-text-card h2 { font-size: clamp(28px, 7vw, 40px) !important; }
						.hero-poster-card { aspect-ratio: 4 / 5 !important; }
						.hero-cta-buy { width: 100%; justify-content: center; }
					}
				`}</style>

				{/* LEFT — editorial text card on color spill */}
				<div
					className="hero-text-card relative isolate flex flex-col justify-between text-white"
					style={{
						background: 'rgba(10,10,10,0.55)',
						padding: '44px 48px',
						gap: 36,
						backdropFilter: 'blur(20px) saturate(180%)',
						WebkitBackdropFilter: 'blur(20px) saturate(180%)',
					}}
				>
					{/* Color spill — blurred poster */}
					{featured.poster_url && (
						<Image
							src={featured.poster_url}
							alt=""
							aria-hidden="true"
							fill
							className="object-cover"
							style={{
								filter: 'blur(60px) saturate(1.4) brightness(0.65)',
								transform: 'scale(1.4) translate(-8%, 6%)',
								zIndex: -1,
								opacity: 0.55,
							}}
							priority
						/>
					)}

					{/* Soft glass overlay */}
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-0"
						style={{
							background:
								'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.25) 100%)',
							zIndex: 0,
						}}
					/>

					{/* TOP — tag + big date */}
					<div className="relative z-[2] flex flex-col gap-3.5">
						{featured.event_type && (
							<span
								className="self-start rounded-full border border-white/20 px-3 py-1.5 text-[10.5px] font-[700] uppercase tracking-[0.14em]"
								style={{
									background: 'rgba(255,255,255,0.16)',
									backdropFilter: 'blur(14px)',
									WebkitBackdropFilter: 'blur(14px)',
								}}
							>
								{featured.event_type}
							</span>
						)}

						<div className="flex items-baseline gap-3.5">
							<div className="flex flex-col leading-none">
								<span className="text-[11px] font-[700] uppercase tracking-[0.16em] text-white/55">
									{dowShort.replace('.', '')}
								</span>
								<span
									className="mt-0.5 text-white"
									style={{
										fontSize: 'clamp(40px, 4.8vw, 64px)',
										fontWeight: 800,
										letterSpacing: '-0.04em',
									}}
								>
									{day}
								</span>
							</div>
							<div className="flex flex-col gap-0.5 leading-tight">
								<span className="text-[14px] font-[700] capitalize tracking-[-0.005em] text-white">
									{mon} {year}
								</span>
								<span className="text-[12.5px] font-[500] text-white/70">
									{t('events.hero_doors', { time })}
								</span>
							</div>
						</div>
					</div>

					{/* MIDDLE — title */}
					<h2
						className="relative z-[2] m-0 text-white"
						style={{
							fontSize: 'clamp(28px, 3.4vw, 44px)',
							fontWeight: 800,
							letterSpacing: '-0.035em',
							lineHeight: 1.04,
							textWrap: 'balance',
						}}
					>
						{featured.title}
					</h2>

					{/* BOTTOM — venue + CTA */}
					<div className="relative z-[2] flex flex-col gap-4">
						{venueLine && (
							<div className="flex items-center gap-2 text-[13.5px] font-[500] text-white/85">
								<Icon icon="mdi:map-marker-outline" width={13} />
								<span>{venueLine}</span>
							</div>
						)}

						<span
							className="hero-cta-buy self-start inline-flex items-center gap-2.5 whitespace-nowrap rounded-full bg-white py-3.5 pl-6 pr-3.5 text-[14px] font-[600] tracking-[-0.012em] text-[var(--ink)] transition-transform duration-200 group-hover:-translate-y-0.5"
							style={{ boxShadow: '0 10px 28px -8px rgba(0,0,0,0.45)' }}
						>
							{t('events.get_tickets')}
							{featured.price_from != null && featured.price_from > 0 && (
								<span className="rounded-full bg-[var(--ink)] px-3 py-1.5 text-[10.5px] font-[700] uppercase tracking-[0.04em] text-white">
									{t('events.price_from', { price: featured.price_from, currency: featured.currency ?? '' })}
								</span>
							)}
						</span>
					</div>
				</div>

				{/* RIGHT — sharp poster */}
				<div
					className="hero-poster-card relative overflow-hidden bg-[var(--ink)]"
					style={{ aspectRatio: '3 / 4' }}
				>
					{featured.poster_url && (
						<Image
							src={featured.poster_url}
							alt={`${featured.title} poster`}
							fill
							className="object-cover"
							sizes="(max-width: 820px) 100vw, 600px"
							priority
						/>
					)}
				</div>
			</Link>
		</section>
	);
}
