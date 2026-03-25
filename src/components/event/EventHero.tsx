import Image from 'next/image';
import { IEventDetail } from '@/types';
import ShareButton from '@/components/event/ShareButton';

interface EventHeroProps {
	event: IEventDetail;
}

export default function EventHero({ event }: EventHeroProps) {
	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
		});
	};

	return (
		<section className="relative w-full overflow-hidden">
			<div className="relative h-[280px] sm:h-[360px] md:h-[400px] w-full">
				{/* Blurred background */}
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
					<div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-400" />
				)}

				{/* Sharp poster */}
				{event.poster_url ? (
					<Image
						src={event.poster_url}
						alt={event.title}
						fill
						className="object-cover"
						priority
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-200 to-gray-400" />
				)}

				{/* Gradient overlay */}
				<div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent" />

				{/* Share button — floating on mobile */}
				<div className="absolute right-4 top-4 z-10 md:hidden">
					<ShareButton title={event.title} />
				</div>

				{/* Content */}
				<div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-6 sm:px-6">
					<div className="mx-auto max-w-6xl">
						<div className="flex items-end justify-between gap-4">
							<div>
								<h1 className="font-[family-name:var(--font-display)] text-[1.875rem] font-bold text-white drop-shadow-lg md:text-[2.25rem]">
									{event.title}
								</h1>
								<div className="mt-2 flex flex-wrap items-center gap-2">
									<span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 font-[family-name:var(--font-mono)] text-[0.8125rem] uppercase tracking-wider text-white backdrop-blur-sm">
										{formatDate(event.date_start)}
									</span>
									{event.venue_name && (
										<span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-[0.8125rem] text-white backdrop-blur-sm">
											{event.venue_name}
										</span>
									)}
								</div>
							</div>
							{/* Share button — inline on desktop */}
							<div className="hidden md:block">
								<ShareButton title={event.title} />
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
