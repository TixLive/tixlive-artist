import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import { IEventListItem } from '@/types';
import { usePrefetchEvent } from '@/hooks/usePrefetchEvent';
import { formatEventDate, formatTimeAgo } from '@/lib/datetime';

interface PastEventCardProps {
	event: IEventListItem;
	showAgo?: boolean;
}

export default function PastEventCard({
	event,
	showAgo = true,
}: PastEventCardProps) {
	const { t, i18n } = useTranslation('common');
	const prefetch = usePrefetchEvent();

	const date = formatEventDate(event.date_start, event.timezone, 'ro-RO', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	});
	const ago = formatTimeAgo(event.date_start, i18n.language);
	const isSoldOut = event.remaining_capacity === 0;

	return (
		<Link
			href={`/events/${event.slug}`}
			onMouseEnter={() => prefetch(event.slug)}
			onTouchStart={() => prefetch(event.slug)}
			className="past-card group"
		>
			<style>{`
				.past-card {
					display: grid;
					grid-template-columns: 96px 1fr auto;
					gap: 18px;
					align-items: center;
					padding: 13px 16px;
					opacity: 0.66;
					border: 1px solid transparent;
					border-bottom-color: var(--line);
					border-radius: 0;
					background: transparent;
					transition: opacity .28s cubic-bezier(.2,.7,.3,1), box-shadow .28s cubic-bezier(.2,.7,.3,1),
						background-color .28s, border-color .28s, border-radius .28s;
				}
				.past-card:first-child { border-top-left-radius: 22px; border-top-right-radius: 22px; }
				.past-card:hover, .past-card:focus-visible {
					opacity: 1;
					background: var(--surface);
					border-color: var(--line);
					border-radius: 22px;
					box-shadow: var(--shadow-2);
					outline: none;
				}
				.past-card-poster { width: 96px; aspect-ratio: 16 / 11; border-radius: 11px; overflow: hidden; background: var(--ink); flex: none; position: relative; }
				.past-card-poster img, .past-card-poster .ph { filter: grayscale(1) brightness(1.02); opacity: .9; transition: filter .28s, opacity .28s; }
				.past-card:hover .past-card-poster img, .past-card:hover .past-card-poster .ph { filter: none; opacity: 1; }
				.past-card-link { opacity: 0; transform: translateX(4px); transition: opacity .22s cubic-bezier(.2,.7,.3,1), transform .22s cubic-bezier(.2,.7,.3,1); }
				.past-card:hover .past-card-link { opacity: 1; transform: none; }
				@media (max-width: 760px) {
					.past-card { grid-template-columns: 1fr; gap: 14px; }
					.past-card-poster { width: 100%; aspect-ratio: 16 / 8; }
					.past-card-status { align-items: flex-start !important; }
					.past-card-link { opacity: 1; transform: none; }
				}
				@media (prefers-reduced-motion: reduce) { .past-card, .past-card * { transition: none !important; } }
			`}</style>

			{/* Poster */}
			<div className="past-card-poster">
				{event.poster_url ? (
					<Image
						src={event.poster_url}
						alt={`${event.title} poster`}
						fill
						className="object-cover"
						sizes="(max-width: 760px) 100vw, 96px"
					/>
				) : (
					<div className="ph absolute inset-0 flex items-center justify-center p-2 text-center text-[10px] font-[800] leading-[1.08] tracking-[-0.02em] text-white">
						{event.title}
					</div>
				)}
			</div>

			{/* Info */}
			<div className="flex min-w-0 flex-col gap-1.5">
				<div className="flex items-center gap-[11px]">
					<h3 className="m-0 min-w-0 truncate text-[18px] font-[650] leading-[1.18] tracking-[-0.022em] text-[var(--ink-2)]">
						{event.title}
					</h3>
					<span className="inline-flex h-6 flex-none items-center rounded-[7px] bg-[var(--bg-2)] px-2.5 text-[10.5px] font-[700] uppercase tracking-[0.09em] text-[var(--ink-3)]">
						{t('events.past.ended_chip')}
					</span>
				</div>
				<div className="flex flex-wrap items-center gap-2.5 text-[13px] font-[500] tracking-[-0.01em] text-[var(--ink-4)]">
					<span className="inline-flex items-center gap-1.5">
						<Icon icon="mdi:calendar" width={13} />
						{date}
					</span>
					{event.venue_name && (
						<>
							<span className="h-[3px] w-[3px] rounded-full bg-[var(--ink-4)]" />
							<span className="inline-flex items-center gap-1.5">
								<Icon icon="mdi:map-marker-outline" width={13} />
								{event.venue_name}
							</span>
						</>
					)}
					{showAgo && ago && (
						<>
							<span className="h-[3px] w-[3px] rounded-full bg-[var(--ink-4)]" />
							<span className="tracking-[0.05em]">{ago}</span>
						</>
					)}
				</div>
			</div>

			{/* Status */}
			<div className="past-card-status flex flex-col items-end gap-[7px]">
				<span className="inline-flex items-center gap-[7px] text-[13px] font-[600] tracking-[-0.01em] text-[var(--ink-3)]">
					{isSoldOut ? (
						<>
							<Icon
								icon="mdi:lock-outline"
								width={14}
								className="text-[var(--ink-4)]"
							/>
							{t('events.past.sold_out_state')}
						</>
					) : (
						t('events.past.ended_state')
					)}
				</span>
				<span className="past-card-link inline-flex items-center gap-1.5 text-[13px] font-[600] tracking-[-0.01em] text-[var(--ink-3)]">
					{t('events.past.details')}
					<Icon icon="mdi:arrow-right" width={13} />
				</span>
			</div>
		</Link>
	);
}
