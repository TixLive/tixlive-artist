import Image from 'next/image';
import { Icon } from '@iconify/react';
import { IEventDetail } from '@/types';

interface EventHeroProps {
	event: IEventDetail;
}

export default function EventHero({ event }: EventHeroProps) {
	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	};

	const formatTime = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false,
		});
	};

	const priceFrom = event.price_from ?? (event.ticket_types?.[0]?.price ?? 0);
	const currency = event.currency ?? event.ticket_types?.[0]?.currency ?? 'MDL';

	return (
		<section className="mx-auto mt-4 max-w-6xl px-4 sm:px-6">
			<div className="relative w-full overflow-hidden rounded-[20px]">
				<div className="relative h-[220px] w-full sm:h-[300px] md:h-[360px]">
					{/* Blurred background fill */}
					{event.poster_url ? (
						<Image
							src={event.poster_url}
							alt=""
							fill
							className="scale-110 object-cover blur-2xl opacity-40"
							priority
							aria-hidden="true"
						/>
					) : (
						<div className="absolute inset-0 bg-[var(--theme-text)]" />
					)}

					{/* Sharp poster centered */}
					{event.poster_url && (
						<Image
							src={event.poster_url}
							alt={event.title}
							fill
							className="object-cover"
							priority
						/>
					)}

					{/* Gradient overlay */}
					<div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

					{/* Event type badge — top left */}
					{event.event_type && (
						<div className="absolute left-4 top-4 z-10">
							<span className="inline-flex items-center rounded-lg bg-[var(--theme-bg)]/90 px-2.5 py-1 font-[family-name:var(--font-data)] text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--theme-text)] backdrop-blur-sm">
								{event.event_type}
							</span>
						</div>
					)}

					{/* Content — bottom */}
					<div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-6 sm:px-7 sm:pb-7">
						<div className="flex items-end justify-between gap-4">
							{/* Title + date/time */}
							<div className="min-w-0 flex-1">
								<h1 className="font-[family-name:var(--font-display)] text-[1.75rem] font-[900] leading-[1.1] tracking-[-0.03em] text-white sm:text-[2.25rem] md:text-[2.5rem]">
									{event.title}
								</h1>
								<p className="mt-2 flex items-center gap-1.5 text-[0.8125rem] text-white/75">
									<Icon icon="mdi:calendar" width={14} className="opacity-70" />
									<span className="font-[family-name:var(--font-data)]">
										{formatDate(event.date_start)}, {formatTime(event.date_start)}
									</span>
									{event.venue_name && (
										<>
											<span className="mx-1 text-white/35">·</span>
											<Icon icon="mdi:map-marker" width={14} className="opacity-70" />
											<span>{event.venue_name}</span>
										</>
									)}
								</p>
							</div>

							{/* Price pill — desktop */}
							{priceFrom > 0 && (
								<div className="hidden shrink-0 sm:block">
									<div className="inline-flex items-center gap-2 rounded-xl bg-[var(--theme-bg)]/95 px-4 py-2.5 shadow-[0_1px_3px_rgba(20,19,18,0.08)] backdrop-blur-sm">
										<Icon icon="mdi:ticket-outline" width={18} className="text-[var(--brand-accent)]" />
										<span className="font-[family-name:var(--font-data)] text-[0.875rem] font-bold text-[var(--theme-text)]">
											De la {priceFrom} {currency}
										</span>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
