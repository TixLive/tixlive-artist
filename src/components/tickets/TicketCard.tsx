import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import { ITicket } from '@/types';
import { parseSeatId } from '@/lib/seat';
import { formatEventDate, formatEventTimeWithZone } from '@/lib/datetime';

interface TicketCardProps {
	ticket: ITicket;
	locale?: string;
}

export default function TicketCard({ ticket, locale = 'en' }: TicketCardProps) {
	const { t } = useTranslation('common');
	const seat = parseSeatId(ticket.seat_id);

	// Date + time in the venue's timezone (not the viewer's), with a GMT-offset hint.
	const formatDate = (dateStr: string) => {
		const date = formatEventDate(dateStr, ticket.timezone, locale, {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: undefined,
		});
		if (!date) return '';
		return `${date}, ${formatEventTimeWithZone(dateStr, ticket.timezone, locale)}`;
	};

	return (
		<Link href={`/account/tickets/${ticket.id}`} className="group block">
			<article
				className="flex items-center gap-4 rounded-[16px] bg-[var(--surface)] p-4 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]"
				style={{ boxShadow: 'var(--shadow-2)' }}
			>
				<div className="flex h-[68px] w-[52px] shrink-0 items-center justify-center rounded-[10px] bg-[var(--bg-2)] text-[var(--ink-3)]">
					<Icon icon="mdi:ticket-confirmation-outline" width={22} />
				</div>

				<div className="min-w-0 flex-1 leading-[1.35]">
					<h3 className="m-0 truncate text-[15px] font-[700] tracking-[-0.012em] text-[var(--ink)]">
						{ticket.event_title}
					</h3>
					<p className="m-0 mt-0.5 text-[12.5px] tabular-nums text-[var(--ink-3)]">
						{formatDate(ticket.session_date)}
					</p>
					<div className="mt-1.5 flex items-center gap-2">
						<span className="rounded-full bg-[var(--bg-2)] px-2 py-0.5 text-[10.5px] font-[700] uppercase tracking-[0.06em] text-[var(--ink-2)]">
							{ticket.ticket_type}
						</span>
						<span className="truncate text-[11.5px] text-[var(--ink-3)]">{ticket.attendee_name}</span>
					</div>
					{seat && (
						<p className="m-0 mt-1 flex items-center gap-1 text-[11.5px] tabular-nums text-[var(--ink-3)]">
							<Icon icon="mdi:seat-outline" width={12} className="shrink-0" />
							{t('seating.seat_label', { row: seat.row, seat: seat.seat })}
						</p>
					)}
				</div>

				<Icon
					icon="mdi:chevron-right"
					width={14}
					className="shrink-0 text-[var(--ink-3)] transition-colors duration-150 group-hover:text-[var(--ink)]"
				/>
			</article>
		</Link>
	);
}
