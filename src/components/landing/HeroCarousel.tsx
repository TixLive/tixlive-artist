import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useTranslation, type TFunction } from 'next-i18next';
import { IEventListItem } from '@/types';
import { usePrefetchEvent } from '@/hooks/usePrefetchEvent';

interface FeaturedHeroProps {
	events: IEventListItem[];
}

interface HeroParts {
	href: string;
	prefetch: (slug: string) => void;
	t: TFunction;
	featured: IEventListItem;
	dowShort: string;
	day: number;
	mon: string;
	year: number;
	time: string;
	venueLine: string;
}

/**
 * Featured hero. Renders one of two variants based on what artwork the
 * organizer has uploaded:
 *
 * - **Split** (poster_portrait_url present): editorial text card on a
 *   blurred portrait-poster spill, with the sharp portrait on the right.
 * - **Banner** (cover-only fallback): full-width 16:9 cover with a glass
 *   title zone overlaid at the bottom. Used when no portrait poster has
 *   been uploaded — visually closer to the event-detail hero so we don't
 *   force a portrait crop on a landscape image.
 */
export default function HeroCarousel({ events }: FeaturedHeroProps) {
	const { t } = useTranslation('common');
	const prefetch = usePrefetchEvent();
	const openEvents = events.filter((e) => e.status === 'open');
	if (openEvents.length === 0) return null;

	const featured = openEvents[0];
	const date = new Date(featured.date_start);
	const dowShort = date.toLocaleDateString('ro-RO', { weekday: 'short' }).replace('.', '');
	const day = date.getDate();
	const mon = date.toLocaleDateString('ro-RO', { month: 'long' });
	const year = date.getFullYear();
	const time = date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });

	const parts: HeroParts = {
		href: `/events/${featured.slug}`,
		prefetch,
		t,
		featured,
		dowShort,
		day,
		mon,
		year,
		time,
		venueLine: featured.venue_name,
	};

	return (
		<section className="mx-auto max-w-[1200px] px-4 pt-8 sm:px-5 md:px-8">
			{featured.poster_portrait_url ? <SplitHero {...parts} /> : <BannerHero {...parts} />}
		</section>
	);
}

function SplitHero({ href, prefetch, t, featured, dowShort, day, mon, year, time, venueLine }: HeroParts) {
	// poster_portrait_url is guaranteed by the caller's branch check.
	const portraitUrl = featured.poster_portrait_url!;

	return (
		<Link
			href={href}
			onMouseEnter={() => prefetch(featured.slug)}
			onTouchStart={() => prefetch(featured.slug)}
			className="hero-split group relative isolate grid overflow-hidden rounded-[22px] shadow-[var(--shadow-cinema)] sm:rounded-[28px]"
			style={{
				gridTemplateColumns: '1.05fr 1fr',
				// Keep the hero within one viewport (svh handles mobile chrome).
				// 8rem leaves room for the sticky 72px header + breathing space.
				maxHeight: 'calc(100svh - 8rem)',
			}}
		>
			<style>{`
				.hero-split { min-height: 480px; }
				.hero-text-card, .hero-poster-card { min-height: 0; }
				@media (max-width: 820px) {
					.hero-split {
						display: flex !important;
						flex-direction: column !important;
						min-height: 0 !important;
						height: calc(100svh - 6rem);
					}
					.hero-text-card { padding: 28px 22px !important; gap: 18px !important; flex-shrink: 0; }
					.hero-text-card h2 { font-size: clamp(24px, 6.5vw, 36px) !important; }
					.hero-poster-card { flex: 1 1 0 !important; min-height: 0 !important; }
					.hero-cta-buy { width: 100%; justify-content: center; }
				}
			`}</style>

			{/* LEFT — editorial text card on color spill */}
			<div
				className="hero-text-card relative isolate flex flex-col justify-between overflow-hidden text-white"
				style={{
					background: 'rgba(10,10,10,0.55)',
					padding: '44px 48px',
					gap: 28,
					backdropFilter: 'blur(20px) saturate(180%)',
					WebkitBackdropFilter: 'blur(20px) saturate(180%)',
				}}
			>
				{/* Color spill — blurred portrait poster */}
				<Image
					src={portraitUrl}
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

				{/* Soft glass overlay */}
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0"
					style={{
						background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.25) 100%)',
						zIndex: 0,
					}}
				/>

				<HeroText {...{ t, featured, dowShort, day, mon, year, time, venueLine }} variant="split" />
			</div>

			{/* RIGHT — full portrait poster, never cropped. Ink-filled letterbox
			    appears only if the slot's aspect drifts from the image's own. */}
			<div className="hero-poster-card relative overflow-hidden bg-[var(--ink)]">
				<Image
					src={portraitUrl}
					alt={`${featured.title} poster`}
					fill
					className="object-contain"
					sizes="(max-width: 820px) 100vw, 600px"
					priority
				/>
			</div>
		</Link>
	);
}

function BannerHero({ href, prefetch, t, featured, dowShort, day, mon, year, time, venueLine }: HeroParts) {
	const coverUrl = featured.poster_url;

	return (
		<Link
			href={href}
			onMouseEnter={() => prefetch(featured.slug)}
			onTouchStart={() => prefetch(featured.slug)}
			className="hero-banner group relative isolate grid overflow-hidden rounded-[22px] bg-[var(--ink)] shadow-[var(--shadow-cinema)] sm:rounded-[28px]"
			style={{ gridTemplateRows: '1fr auto', maxHeight: 'calc(100svh - 8rem)' }}
		>
			<style>{`
				.hero-banner-cover { min-height: 0; }
				@media (max-width: 760px) {
					.hero-banner-cover { aspect-ratio: 16 / 9 !important; }
					.hero-banner-title { padding: 18px 22px 22px !important; }
					.hero-banner-title h2 { font-size: clamp(24px, 6vw, 34px) !important; }
					.hero-banner-cta { width: 100%; justify-content: center; }
				}
			`}</style>

			{/* Top — 21:9 landscape cover */}
			<div className="hero-banner-cover relative overflow-hidden bg-[var(--ink)]" style={{ aspectRatio: '21 / 9' }}>
				{coverUrl && (
					<Image
						src={coverUrl}
						alt={featured.title}
						fill
						className="object-cover"
						sizes="(max-width: 1200px) 100vw, 1200px"
						priority
					/>
				)}
			</div>

			{/* Bottom — glass title zone */}
			<div className="relative isolate">
				{coverUrl && (
					<Image
						src={coverUrl}
						alt=""
						aria-hidden="true"
						fill
						className="object-cover"
						style={{
							filter: 'blur(80px) saturate(1.5) brightness(0.6)',
							transform: 'scale(1.4) translateY(-30%)',
							zIndex: 0,
						}}
					/>
				)}
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0"
					style={{
						background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 100%)',
						zIndex: 1,
					}}
				/>

				<div
					className="hero-banner-title relative z-[2] flex flex-col gap-4 text-white"
					style={{ padding: '24px 36px 28px' }}
				>
					<HeroText {...{ t, featured, dowShort, day, mon, year, time, venueLine }} variant="banner" />
				</div>
			</div>
		</Link>
	);
}

/**
 * Shared text content (tag, big date display, title, venue, CTA pill).
 * Layout adapts based on `variant`: split version stacks (top/middle/bottom in
 * the editorial card), banner version flows horizontally with the CTA on the
 * right.
 */
function HeroText({
	t,
	featured,
	dowShort,
	day,
	mon,
	year,
	time,
	venueLine,
	variant,
}: Omit<HeroParts, 'href' | 'prefetch'> & { variant: 'split' | 'banner' }) {
	const isSplit = variant === 'split';

	const tagAndDate = (
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
					<span className="text-[11px] font-[700] uppercase tracking-[0.16em] text-white/55">{dowShort}</span>
					<span
						className="mt-0.5 text-white"
						style={{
							fontSize: isSplit ? 'clamp(40px, 4.8vw, 64px)' : 'clamp(28px, 3.4vw, 44px)',
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
					<span className="text-[12.5px] font-[500] text-white/70">{t('events.hero_doors', { time })}</span>
				</div>
			</div>
		</div>
	);

	const title = (
		<h2
			className="relative z-[2] m-0 text-white"
			style={{
				fontSize: isSplit ? 'clamp(28px, 3.4vw, 44px)' : 'clamp(24px, 2.8vw, 36px)',
				fontWeight: 800,
				letterSpacing: '-0.035em',
				lineHeight: 1.06,
				textWrap: 'balance',
			}}
		>
			{featured.title}
		</h2>
	);

	const venueAndCta = (
		<div className={`relative z-[2] flex ${isSplit ? 'flex-col gap-4' : 'flex-wrap items-end justify-between gap-4'}`}>
			{venueLine && (
				<div className="flex items-center gap-2 text-[13.5px] font-[500] text-white/85">
					<Icon icon="mdi:map-marker-outline" width={13} />
					<span>{venueLine}</span>
				</div>
			)}

			<span
				className="hero-cta-buy hero-banner-cta self-start inline-flex items-center gap-2.5 whitespace-nowrap rounded-full bg-white py-3.5 pl-6 pr-3.5 text-[14px] font-[600] tracking-[-0.012em] text-[var(--ink)] transition-transform duration-200 group-hover:-translate-y-0.5"
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
	);

	return (
		<>
			{tagAndDate}
			{title}
			{venueAndCta}
		</>
	);
}
