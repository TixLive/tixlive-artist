import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import { IEventDetail } from '@/types';
import { formatEventDateParts, formatEventTimeWithZone } from '@/lib/datetime';

function useImageAspect(src: string | null | undefined): number | null {
	const [aspect, setAspect] = useState<number | null>(null);
	useEffect(() => {
		if (!src) {
			setAspect(null);
			return;
		}
		let cancelled = false;
		const img = new window.Image();
		img.onload = () => {
			if (!cancelled && img.naturalHeight > 0) {
				setAspect(img.naturalWidth / img.naturalHeight);
			}
		};
		img.src = src;
		return () => {
			cancelled = true;
		};
	}, [src]);
	return aspect;
}

interface EventHeroProps {
	event: IEventDetail;
	onBuy?: () => void;
	priceFrom?: number;
	currency?: string;
	ctaLabel?: string;
}

/**
 * Premium stacked hero — full-width 3:1 banner on ≥640px; on mobile the
 * container matches the portrait poster's natural aspect ratio (detected at
 * runtime) so object-cover fills cleanly without crop or letterbox bars. The
 * bottom zone uses a blurred color-spill of the same poster as its background.
 */
export default function EventHero({ event, onBuy, priceFrom, currency, ctaLabel }: EventHeroProps) {
	const { t } = useTranslation('common');
	// Render in the venue's timezone (not the viewer's), with a GMT-offset hint on the time.
	const { weekday, day, month: mon, year } = formatEventDateParts(event.date_start, event.timezone, 'ro-RO', {
		weekday: 'short',
		month: 'long',
	});
	const dowShort = weekday.replace('.', '');
	const time = formatEventTimeWithZone(event.date_start, event.timezone, 'ro-RO');

	// The desktop banner is ~3:1, so prefer the ultra-wide 32:9 poster when uploaded
	// (fills edge-to-edge); fall back to the 16:9 cover, then the portrait.
	const landscapeUrl = event.poster_variants?.['32:9'] ?? event.poster_url ?? event.poster_portrait_url ?? null;
	const portraitUrl = event.poster_portrait_url ?? event.poster_url ?? null;
	const venueLine = event.venue_name;
	const portraitAspect = useImageAspect(portraitUrl);

	return (
		<section className="mx-auto max-w-[1200px] px-4 pt-8 sm:px-5 md:px-8">
			<div
				className="hero-stack relative isolate grid overflow-hidden rounded-[22px] bg-[var(--ink)] sm:rounded-[28px]"
				style={{ gridTemplateRows: '1fr auto' }}
			>
				<style>{`
					.hero-stack-poster { aspect-ratio: var(--hero-portrait-ar, 1); }
					@media (min-width: 640px) {
						.hero-stack-poster { aspect-ratio: 3 / 1; }
					}
					@media (max-width: 760px) {
						.hero-stack-title { padding: 12px 16px 14px !important; gap: 6px !important; }
						.hero-stack-title h1 { font-size: clamp(18px, 5vw, 24px) !important; }
						.hero-stack-cta { display: none !important; }
						.hero-stack-meta-time { display: none !important; }
						.hero-stack-text { gap: 6px !important; flex-basis: auto !important; }
					}
				`}</style>

				{/* Top: poster — uses portrait image's natural aspect on mobile, 3:1 banner on ≥640px */}
				<div
					className="hero-stack-poster relative overflow-hidden bg-[var(--ink)]"
					style={{ ['--hero-portrait-ar' as string]: portraitAspect ?? 1 }}
				>
					{portraitUrl && (
						<Image
							src={portraitUrl}
							alt={event.title}
							fill
							className="object-cover sm:hidden"
							sizes="100vw"
							priority
						/>
					)}
					{landscapeUrl && (
						<Image
							src={landscapeUrl}
							alt={event.title}
							fill
							className="hidden object-cover sm:block"
							sizes="(max-width: 1200px) 100vw, 1200px"
							priority
						/>
					)}

					{event.event_type && (
						<span
							className="absolute left-[14px] top-[14px] z-[2] rounded-full border border-white/20 px-2.5 py-1 text-[10px] font-[700] uppercase tracking-[0.14em] text-white sm:left-[22px] sm:top-[22px] sm:px-3 sm:py-1.5 sm:text-[10.5px]"
							style={{
								background: 'rgba(0,0,0,0.55)',
								backdropFilter: 'blur(14px)',
								WebkitBackdropFilter: 'blur(14px)',
							}}
						>
							{event.event_type}
						</span>
					)}
				</div>

				{/* Bottom: blurred title zone — overflow-hidden clips the scaled+translated
				    spill so it doesn't bleed up over the poster and darken its edge. */}
				<div className="relative isolate overflow-hidden">
					{/* Blurred color spill — CSS background-image (not a second <Image>)
					    so it paints synchronously with the visible poster from cache.
					    Each viewport's spill div uses the same URL its visible poster
					    uses, gated by responsive display so the other isn't fetched. */}
					{portraitUrl && (
						<div
							aria-hidden="true"
							className="absolute inset-0 bg-cover bg-center sm:hidden"
							style={{
								backgroundImage: `url("${portraitUrl}")`,
								filter: 'blur(80px) saturate(1.5) brightness(0.6)',
								transform: 'scale(1.4) translateY(-30%)',
								zIndex: 0,
							}}
						/>
					)}
					{landscapeUrl && (
						<div
							aria-hidden="true"
							className="absolute inset-0 hidden bg-cover bg-center sm:block"
							style={{
								backgroundImage: `url("${landscapeUrl}")`,
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
						className="hero-stack-title relative z-[2] flex flex-col gap-3 text-white"
						style={{ padding: '18px 28px 22px' }}
					>
						<div className="flex flex-wrap items-end justify-between gap-4">
							<div className="hero-stack-text flex min-w-0 flex-1 flex-col gap-2" style={{ flexBasis: 320 }}>
								<div className="flex items-baseline gap-2.5">
									<span className="text-[10px] font-[700] uppercase tracking-[0.16em] text-white/55">
										{dowShort}
									</span>
									<span className="text-[26px] font-[800] leading-none tracking-[-0.025em] text-white">
										{day}
									</span>
									<span className="text-[13px] font-[600] capitalize text-white/85">
										{mon} {year}
									</span>
									<span className="hero-stack-meta-time text-[12px] text-white/55">· {time}</span>
								</div>
								<h1
									className="m-0 text-white"
									style={{
										fontSize: 'clamp(22px, 2.6vw, 32px)',
										fontWeight: 800,
										letterSpacing: '-0.028em',
										lineHeight: 1.08,
										textWrap: 'balance',
									}}
								>
									{event.title}
								</h1>
								{venueLine && (
									<div className="flex items-center gap-1.5 text-[12.5px] font-[500] text-white/80">
										<Icon icon="mdi:map-marker-outline" width={11} />
										<span>{venueLine}</span>
									</div>
								)}
							</div>
							{onBuy && (
								<button
									onClick={onBuy}
									className="hero-stack-cta inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full bg-white py-2.5 pl-5 pr-3 text-[13.5px] font-[600] tracking-[-0.012em] text-[var(--ink)] transition-transform duration-150 hover:scale-[1.02]"
									style={{ boxShadow: '0 8px 22px -6px rgba(0,0,0,0.45)' }}
								>
									{ctaLabel ?? t('seating.select_seats')}
									{priceFrom != null && priceFrom > 0 && currency && (
										<span className="rounded-full bg-[var(--ink)] px-2.5 py-1 text-[10px] font-[700] uppercase tracking-[0.04em] text-white">
											{t('events.price_from', { price: priceFrom, currency })}
										</span>
									)}
								</button>
							)}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
