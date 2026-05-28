import EventCard from '@/components/landing/EventCard';
import LoadMore from '@/components/common/LoadMore';
import { IEventListItem } from '@/types';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';

interface EventGridProps {
	events: IEventListItem[];
	total: number;
	onLoadMore: () => void | Promise<unknown>;
	hasNextPage?: boolean;
	loading?: boolean;
	isError?: boolean;
	organizerBio?: string;
	categoryLabel?: string;
}

export default function EventGrid({ events, total, onLoadMore, hasNextPage, loading, isError, organizerBio, categoryLabel }: EventGridProps) {
	const { t } = useTranslation('common');

	if (events.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center px-4 py-24 text-center">
				<div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[22px] bg-[var(--bg-2)]">
					<Icon icon="mdi:calendar-blank-outline" className="h-9 w-9 text-[var(--ink-3)]" />
				</div>
				<h3 className="text-[28px] font-[800] tracking-[-0.032em] text-[var(--ink)]">
					{t('events.no_upcoming')}
				</h3>
				{organizerBio && (
					<p className="mt-3 max-w-md text-[15px] leading-[1.55] text-[var(--ink-3)]">
						{organizerBio}
					</p>
				)}
			</div>
		);
	}

	const headingLabel =
		categoryLabel && categoryLabel !== 'All'
			? t('events.category_events', { category: categoryLabel })
			: t('events.all_events');

	const countLabel = total === 1
		? t('events.events_count_one', { count: total })
		: t('events.events_count_other', { count: total });

	return (
		<section className="mx-auto max-w-[1200px] px-4 pb-6 pt-9 sm:px-5 md:px-8">
			{/* Section heading + count */}
			<div className="mb-6 flex flex-wrap items-end justify-between gap-3">
				<h2
					className="m-0 font-[800] tracking-[-0.028em] text-[var(--ink)]"
					style={{ fontSize: 'clamp(22px, 3vw, 32px)' }}
				>
					{headingLabel}
				</h2>
				<span className="text-[11px] font-[700] uppercase tracking-[0.14em] text-[var(--ink-3)]">
					{countLabel}
				</span>
			</div>

			{/* Single-column list of horizontal cards */}
			<div className="grid grid-cols-1 gap-4">
				{events.map((event) => (
					<EventCard key={event.id} event={event} />
				))}
			</div>

			{/* Load more */}
			<LoadMore
				hasNextPage={hasNextPage ?? total > events.length}
				isFetching={loading ?? false}
				isError={isError}
				onLoadMore={onLoadMore}
				label={t('events.show_more')}
			/>
		</section>
	);
}
