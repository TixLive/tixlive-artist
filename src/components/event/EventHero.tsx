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

	const hasPortrait = !!event.poster_portrait_url;
	// Background fill prefers the landscape cover; a portrait-only event uses its
	// poster as a blurred fill behind the sharp floating card.
	const heroBg = event.poster_url ?? event.poster_portrait_url ?? null;

	return (
		<section className="bg-[var(--theme-bg)]">
			<div className="mx-auto max-w-[1120px] px-4 pt-8 sm:px-6 md:pt-12">
				<div className="relative aspect-[16/9] w-full overflow-hidden rounded-[22px] bg-[var(--brand-primary)] shadow-[0_1px_2px_rgba(20,19,18,0.04),0_8px_24px_rgba(20,19,18,0.06)] sm:rounded-[28px] lg:aspect-[21/9]">
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

					{event.poster_url && (
						<Image
							src={event.poster_url}
							alt={event.title}
							fill
							className="object-cover"
							sizes="(max-width: 1120px) 100vw, 1120px"
							priority
						/>
					)}

					{/* Gradient for event_type badge legibility */}
					<div
						className="absolute inset-0"
						style={{ background: 'linear-gradient(180deg, rgba(0,0,0,.32) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 100%)' }}
					/>

					{event.event_type && (
						<div className="absolute left-4 top-4 z-10 sm:left-6 sm:top-6">
							<span className="inline-flex items-center rounded-full bg-[var(--theme-bg)]/95 px-3.5 py-1.5 font-[family-name:var(--font-mono)] text-[0.6875rem] uppercase tracking-[0.15em] text-[var(--theme-text)] backdrop-blur-sm">
								{event.event_type}
							</span>
						</div>
					)}

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

				{/* Title — below image */}
				<div className="pt-5">
					<h1 className="font-[family-name:var(--font-display)] text-[clamp(2rem,6vw,3.5rem)] font-[900] leading-[0.95] tracking-[-0.03em] text-[var(--theme-text)]">
						{event.title}
					</h1>
				</div>
			</div>
		</section>
	);
}

