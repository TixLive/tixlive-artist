import Link from 'next/link';
import Image from 'next/image';
import { Chip } from '@heroui/react';
import { Icon } from '@iconify/react';
import { ITicket } from '@/types';

interface TicketCardProps {
	ticket: ITicket;
}

export default function TicketCard({ ticket }: TicketCardProps) {
	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
		});
	};

	return (
		<Link href={`/my-tickets/${ticket.id}`} className="group block">
			<article className="flex items-center gap-4 rounded-xl p-4 shadow-sm transition hover:shadow-md" style={{ backgroundColor: 'var(--theme-surface)' }}>
				{/* Event poster thumbnail */}
				<div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
						<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
						<Icon icon="mdi:ticket-confirmation" className="h-6 w-6 text-gray-500" />
					</div>
				</div>

				{/* Details */}
				<div className="min-w-0 flex-1">
					<h3 className="truncate text-[0.9375rem] font-semibold" style={{ color: 'var(--theme-text)' }}>{ticket.event_title}</h3>
					<p className="mt-0.5 text-[0.8125rem]" style={{ color: 'var(--theme-text-muted)' }}>{formatDate(ticket.session_date)}</p>
					<div className="mt-1 flex items-center gap-2">
						<Chip
							size="sm"
							variant="flat"
							className="text-[0.75rem]"
							style={{
								backgroundColor: 'color-mix(in srgb, var(--brand-primary) 15%, transparent)',
								color: 'var(--brand-primary)',
							}}
						>
							{ticket.ticket_type}
						</Chip>
						<span className="truncate text-[0.75rem] text-gray-400">{ticket.attendee_name}</span>
					</div>
				</div>

				{/* Arrow */}
				<Icon icon="mdi:chevron-right" className="h-5 w-5 flex-shrink-0 text-gray-400 transition group-hover:text-gray-600" />
			</article>
		</Link>
	);
}
