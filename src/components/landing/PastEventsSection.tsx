import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import { IEventListItem } from '@/types';
import PastEventCard from '@/components/landing/PastEventCard';

interface PastEventsSectionProps {
	events: IEventListItem[];
	collapsedByDefault?: boolean;
	showAgo?: boolean;
}

export default function PastEventsSection({
	events,
	collapsedByDefault = false,
	showAgo = true,
}: PastEventsSectionProps) {
	const { t } = useTranslation('common');
	const [open, setOpen] = useState(!collapsedByDefault);

	if (events.length === 0) return null;

	return (
		<section className="mx-auto mt-[30px] max-w-[1200px] px-4 pb-6 sm:px-5 md:px-8">
			{/* Divider */}
			<div className="flex items-center gap-[18px] py-2 pb-1">
				<button
					type="button"
					onClick={() => setOpen((o) => !o)}
					aria-expanded={open}
					className="group inline-flex items-center gap-[11px] rounded-[10px] px-1 py-1.5 transition-opacity duration-200 hover:opacity-70"
				>
					<Icon
						icon="mdi:chevron-down"
						width={18}
						className={`text-[var(--ink-3)] transition-transform duration-300 ${open ? '' : '-rotate-90'}`}
						style={{ transitionTimingFunction: 'cubic-bezier(.2,.7,.3,1)' }}
					/>
					<span className="font-[family-name:var(--font-mono)] text-[11px] font-[700] uppercase tracking-[0.13em] text-[var(--ink-3)]">
						{t('events.past.section_title')}
					</span>
					<span className="font-[family-name:var(--font-mono)] text-[11px] font-[700] text-[var(--ink-4)]">
						/ {events.length}
					</span>
				</button>

				<div className="h-px flex-1 bg-[var(--line)]" />

				<Link
					href="/archive"
					className="inline-flex flex-none items-center gap-[7px] whitespace-nowrap font-[family-name:var(--font-mono)] text-[10.5px] font-[700] uppercase tracking-[0.12em] text-[var(--ink-3)] transition-colors duration-200 hover:text-[var(--ink)]"
				>
					{t('events.past.view_archive')}
					<Icon icon="mdi:arrow-right" width={13} />
				</Link>
			</div>

			{/* List */}
			{open && (
				<div className="mt-4 grid grid-cols-1 gap-[14px]">
					{events.map((event) => (
						<PastEventCard key={event.id} event={event} showAgo={showAgo} />
					))}
				</div>
			)}
		</section>
	);
}
