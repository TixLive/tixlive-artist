import Link from 'next/link';
import { Chip } from '@heroui/react';
import { Icon } from '@iconify/react';
import { ITicket } from '@/types';

interface TicketCardProps {
	ticket: ITicket;
	locale?: string;
}

export default function TicketCard({ ticket, locale = 'en' }: TicketCardProps) {
	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString(locale, {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
		});
	};

	return (
		<Link href={`/my-tickets/${ticket.id}`} className="group block">
			<article className="flex items-center gap-4 rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-4 transition-all duration-200 hover:border-[color-mix(in_srgb,var(--theme-text)_15%,transparent)] hover:shadow-[0_4px_12px_rgba(20,19,18,0.06)]">
				{/* Event poster thumbnail */}
				<div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--theme-text)_6%,transparent)]">
					<Icon icon="mdi:ticket-confirmation" width={24} className="text-[var(--theme-text-muted)]" />
				</div>

				{/* Details */}
				<div className="min-w-0 flex-1">
					<h3 className="truncate font-[family-name:var(--font-display)] text-[0.9375rem] font-[700] text-[var(--theme-text)]">{ticket.event_title}</h3>
					<p className="mt-0.5 font-[family-name:var(--font-data)] text-[0.8125rem] text-[var(--theme-text-muted)]">{formatDate(ticket.session_date)}</p>
					<div className="mt-1.5 flex items-center gap-2">
						<Chip
							size="sm"
							variant="flat"
							className="text-[0.6875rem]"
							style={{
								backgroundColor: 'color-mix(in srgb, var(--brand-accent) 12%, transparent)',
								color: 'var(--brand-accent)',
							}}
						>
							{ticket.ticket_type}
						</Chip>
						<span className="truncate text-[0.6875rem] text-[var(--theme-text-muted)]">{ticket.attendee_name}</span>
					</div>
				</div>

				{/* Arrow */}
				<Icon icon="mdi:chevron-right" width={20} className="flex-shrink-0 text-[var(--theme-text-muted)] transition-colors duration-200 group-hover:text-[var(--theme-text)]" />
			</article>
		</Link>
	);
}
