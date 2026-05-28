import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import { IEventListItem } from '@/types';
import { usePrefetchEvent } from '@/hooks/usePrefetchEvent';

interface EventCardProps {
	event: IEventListItem;
}

/**
 * Horizontal event card — image (16/10) left · title+meta middle · price+CTA
 * right. Soft shadow lifts on hover via translateY(-3px). Collapses to a
 * stacked layout (16/8 banner, full-width CTA) below 760px.
 */
export default function EventCard({ event }: EventCardProps) {
	const { t } = useTranslation('common');
	const prefetch = usePrefetchEvent();

	const formatDate = (dateStr: string) =>
		new Date(dateStr).toLocaleDateString('ro-RO', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			year: 'numeric',
		});

	const isSoldOut = event.remaining_capacity === 0;
	const isLowStock = !isSoldOut && event.remaining_capacity != null && event.remaining_capacity <= 20;
	const isCritical = !isSoldOut && event.remaining_capacity != null && event.remaining_capacity <= 5;

	return (
		<Link
			href={`/events/${event.slug}`}
			onMouseEnter={() => prefetch(event.slug)}
			onTouchStart={() => prefetch(event.slug)}
			className="event-card group block rounded-[22px] bg-[var(--surface)] p-4 shadow-[var(--shadow-2)] transition-[transform,box-shadow] duration-250 hover:-translate-y-[3px] hover:shadow-[var(--shadow-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)] focus-visible:ring-offset-2"
		>
			<style>{`
				.event-card { display: grid; grid-template-columns: 240px 1fr auto; gap: 24px; align-items: center; }
				@media (max-width: 760px) {
					.event-card { grid-template-columns: 1fr; gap: 16px; }
					.event-card-img { aspect-ratio: 16 / 8 !important; }
					.event-card-cta { align-items: stretch !important; }
					.event-card-cta .event-card-buy { width: 100%; justify-content: center; }
				}
			`}</style>

			{/* Image */}
			<div
				className="event-card-img relative overflow-hidden rounded-[14px] bg-[var(--ink)]"
				style={{ aspectRatio: '16 / 10' }}
			>
				{event.poster_url ? (
					<Image
						src={event.poster_url}
						alt={`${event.title} poster`}
						fill
						className="object-cover"
						sizes="(max-width: 760px) 100vw, 240px"
					/>
				) : (
					<div className="absolute inset-0 flex items-center justify-center p-4 text-center text-[14px] font-[800] tracking-[-0.012em] text-white">
						{event.title}
					</div>
				)}

				{/* Urgency badge */}
				{isCritical && (
					<span className="animate-urgency-pulse absolute left-3 top-3 inline-flex items-center rounded-full bg-[#DC2626] px-2.5 py-1 text-[10.5px] font-[700] uppercase tracking-[0.06em] text-white shadow-[0_4px_12px_rgba(0,0,0,0.18)]">
						{t('events.only_left', { count: event.remaining_capacity ?? 0 })}
					</span>
				)}
				{isLowStock && !isCritical && (
					<span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-[#D97706] px-2.5 py-1 text-[10.5px] font-[700] uppercase tracking-[0.06em] text-white shadow-[0_4px_12px_rgba(0,0,0,0.18)]">
						{t('events.low_stock', { count: event.remaining_capacity ?? 0 })}
					</span>
				)}

				{/* Sold out */}
				{isSoldOut && (
					<div
						className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px]"
						style={{ backgroundColor: 'rgba(10,10,10,0.7)' }}
					>
						<span className="text-[18px] font-[800] uppercase tracking-[0.08em] text-white">
							{t('events.sold_out')}
						</span>
					</div>
				)}
			</div>

			{/* Info */}
			<div className="flex min-w-0 flex-col gap-2.5">
				{event.event_type && (
					<span className="self-start rounded-full bg-[var(--bg-2)] px-2.5 py-1 text-[10.5px] font-[700] uppercase tracking-[0.08em] text-[var(--ink-2)]">
						{event.event_type}
					</span>
				)}
				<h3 className="m-0 text-[22px] font-[700] leading-[1.2] tracking-[-0.022em] text-[var(--ink)]">
					{event.title}
				</h3>
				<div className="flex flex-wrap items-center gap-3 text-[13.5px] font-[500] text-[var(--ink-3)]">
					<span className="inline-flex items-center gap-1.5">
						<Icon icon="mdi:calendar" width={13} />
						{formatDate(event.date_start)}
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
				</div>
			</div>

			{/* CTA */}
			<div className="event-card-cta flex flex-col items-end gap-3">
				{event.price_from != null && event.price_from > 0 && !isSoldOut && (
					<span className="rounded-full bg-[var(--bg-2)] px-3 py-[5px] text-[11px] font-[700] uppercase tracking-[0.06em] text-[var(--ink)]">
						{t('events.price_from', { price: event.price_from, currency: event.currency ?? '' })}
					</span>
				)}
				{event.price_from === 0 && !isSoldOut && (
					<span className="rounded-full bg-[#16A34A] px-3 py-[5px] text-[11px] font-[700] uppercase tracking-[0.06em] text-white">
						FREE
					</span>
				)}
				<span className="event-card-buy inline-flex items-center gap-3 rounded-full bg-[var(--ink)] py-3 pl-[22px] pr-3.5 text-[13.5px] font-[600] tracking-[-0.005em] text-white transition-colors duration-150 group-hover:bg-[var(--ink-2)]">
					{t('events.buy_tickets')}
					<span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-full bg-white text-[var(--ink)]">
						<Icon icon="mdi:arrow-right" width={12} />
					</span>
				</span>
			</div>
		</Link>
	);
}
