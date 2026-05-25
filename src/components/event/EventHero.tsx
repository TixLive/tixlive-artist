import Image from 'next/image';
import { IEventDetail } from '@/types';

interface EventHeroProps {
	event: IEventDetail;
}

/**
 * V2 cinematic hero. Contained to max 1600 with a rounded media frame on desktop,
 * full-bleed on mobile. "Combined" media: the landscape cover (`poster_url`) fills
 * the frame while the portrait poster (`poster_portrait_url`) floats as a card.
 * Falls back gracefully when only one (or neither) image is present.
 */
export default function EventHero({ event }: EventHeroProps) {
	const formatDate = (dateStr: string) =>
		new Date(dateStr).toLocaleDateString('ro-RO', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
		});

	const formatTime = (dateStr: string) =>
		new Date(dateStr).toLocaleTimeString('ro-RO', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false,
		});

	const priceFrom = event.price_from ?? event.ticket_types?.[0]?.price ?? 0;
	const currency = event.currency ?? event.ticket_types?.[0]?.currency ?? 'MDL';
	const maxPrice = event.ticket_types?.length ? Math.max(...event.ticket_types.map((tt) => tt.price)) : priceFrom;

	const hasPortrait = !!event.poster_portrait_url;
	// Background fill prefers the landscape cover; a portrait-only event uses its
	// poster as a blurred fill behind the sharp floating card.
	const heroBg = event.poster_url ?? event.poster_portrait_url ?? null;

	return (
		<section className="bg-[var(--theme-bg)] sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
			<div className="relative mx-auto aspect-[16/9] w-full max-w-[1600px] overflow-hidden bg-[var(--brand-primary)] sm:rounded-[28px] lg:aspect-[21/9]">
				{/* Blurred background fill */}
				{heroBg ? (
					<Image
						src={heroBg}
						alt=""
						fill
						className="scale-110 object-cover opacity-40 blur-2xl"
						priority
						aria-hidden="true"
					/>
				) : null}

				{/* Sharp landscape cover */}
				{event.poster_url && (
					<Image
						src={event.poster_url}
						alt={event.title}
						fill
						className="object-cover"
						sizes="(max-width: 1600px) 100vw, 1600px"
						priority
					/>
				)}

				{/* Gradient for top badge legibility */}
				<div
					className="absolute inset-0"
					style={{
						background:
							'linear-gradient(180deg, rgba(0,0,0,.32) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 100%)',
					}}
				/>

				{/* Type badge — top left */}
				{event.event_type && (
					<div className="absolute left-4 top-4 z-10 sm:left-7 sm:top-7">
						<span className="inline-flex items-center rounded-full bg-[var(--theme-bg)]/95 px-3.5 py-1.5 font-[family-name:var(--font-mono)] text-[0.6875rem] uppercase tracking-[0.15em] text-[var(--theme-text)] backdrop-blur-sm">
							{event.event_type}
						</span>
					</div>
				)}

				{/* Floating portrait poster card. Anchored right; height tracks the frame
				    (top/bottom insets) and the 2:3 aspect drives the width. */}
				{hasPortrait && (
					<div className="absolute right-4 top-4 bottom-4 z-10 aspect-[2/3] overflow-hidden rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.5)] ring-1 ring-white/10 sm:right-[5%] sm:top-[8%] sm:bottom-[8%]">
						<Image
							src={event.poster_portrait_url!}
							alt={event.title}
							fill
							className="object-cover"
							sizes="(max-width: 640px) 40vw, 360px"
							priority
						/>
					</div>
				)}

			</div>

			{/* Title + meta — below image, all screen sizes */}
			<div className="mx-auto max-w-[1600px] px-4 pt-5 sm:px-0 sm:pt-6">
				<h1 className="font-[family-name:var(--font-display)] text-[clamp(2rem,6vw,3.5rem)] font-[900] leading-[0.95] tracking-[-0.03em] text-[var(--theme-text)]">
					{event.title}
				</h1>
				<div className="mt-4 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap">
					<MetaPill label="Când" value={formatDate(event.date_start)} sub={`Porți ${formatTime(event.date_start)}`} />
					{event.venue_name && (
						<MetaPill label="Unde" value={event.venue_name} sub={event.venue_address || undefined} />
					)}
					{priceFrom > 0 && (
						<MetaPill label="De la" value={`${priceFrom} ${currency}`} sub={maxPrice > priceFrom ? `până la ${maxPrice} ${currency}` : undefined} />
					)}
				</div>
			</div>
		</section>
	);
}

function MetaPill({ label, value, sub }: { label: string; value: string; sub?: string }) {
	return (
		<div className="rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] px-3.5 py-3">
			<div className="font-[family-name:var(--font-mono)] text-[0.5625rem] uppercase tracking-[0.15em] text-[var(--theme-text-muted)]">
				{label}
			</div>
			<div className="mt-1 truncate font-[family-name:var(--font-display)] text-[0.875rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)]">
				{value}
			</div>
			{sub && <div className="truncate text-[0.6875rem] text-[var(--theme-text-muted)]">{sub}</div>}
		</div>
	);
}
