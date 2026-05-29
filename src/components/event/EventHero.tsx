import Image from 'next/image';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import { IEventDetail } from '@/types';

interface EventHeroProps {
	event: IEventDetail;
	onBuy?: () => void;
	priceFrom?: number;
	currency?: string;
	ctaLabel?: string;
}

/**
 * Premium stacked hero — full-width 16:9 poster on top, blurred title zone
 * below with date display, title, venue, and an inline "buy" CTA pill. The
 * bottom zone uses a blurred color-spill of the same poster as its background.
 */
export default function EventHero({ event, onBuy, priceFrom, currency, ctaLabel }: EventHeroProps) {
	const { t } = useTranslation('common');
	const date = new Date(event.date_start);
	const dowShort = date.toLocaleDateString('ro-RO', { weekday: 'short' }).replace('.', '');
	const day = date.getDate();
	const mon = date.toLocaleDateString('ro-RO', { month: 'long' });
	const year = date.getFullYear();
	const time = date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', hour12: false });

	const heroImage = event.poster_url ?? event.poster_portrait_url ?? null;
	const venueLine = event.venue_name;

	return (
		<section className="mx-auto max-w-[1200px] px-4 pt-8 sm:px-5 md:px-8">
			<div
				className="hero-stack relative isolate grid overflow-hidden rounded-[22px] bg-[var(--ink)] shadow-[var(--shadow-cinema)] sm:rounded-[28px]"
				style={{ gridTemplateRows: '1fr auto' }}
			>
				<style>{`
					@media (max-width: 760px) {
						.hero-stack-title { padding: 12px 16px 14px !important; gap: 6px !important; }
						.hero-stack-title h1 { font-size: clamp(18px, 5vw, 24px) !important; }
						.hero-stack-cta { display: none !important; }
						.hero-stack-meta-time { display: none !important; }
						.hero-stack-text { gap: 6px !important; flex-basis: auto !important; }
					}
				`}</style>

				{/* Top: 16:9 poster */}
				<div className="hero-stack-poster relative overflow-hidden bg-[var(--ink)]" style={{ aspectRatio: '16 / 9' }}>
					{heroImage && (
						<Image
							src={heroImage}
							alt={event.title}
							fill
							className="object-cover"
							sizes="(max-width: 1200px) 100vw, 1200px"
							priority
						/>
					)}

					{event.event_type && (
						<span
							className="absolute left-[22px] top-[22px] z-[2] rounded-full border border-white/20 px-3 py-1.5 text-[10.5px] font-[700] uppercase tracking-[0.14em] text-white"
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

				{/* Bottom: blurred title zone */}
				<div className="relative isolate">
					{/* Blurred color spill */}
					{heroImage && (
						<Image
							src={heroImage}
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
