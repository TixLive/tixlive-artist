import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { QRCodeSVG } from 'qrcode.react';
import { ITicket } from '@/types';

interface TicketDetailViewProps {
	ticket: ITicket;
}

export default function TicketDetailView({ ticket }: TicketDetailViewProps) {
	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
		});
	};

	const formatTime = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
		});
	};

	return (
		<div className="flex flex-col items-center gap-6">
			{/* QR Code */}
			<div className="flex flex-col items-center gap-2">
				<div
					className="flex min-h-[240px] min-w-[240px] items-center justify-center rounded-2xl p-4 shadow-sm"
					style={{ backgroundColor: 'var(--theme-surface)' }}
					role="img"
					aria-label={`QR code for ${ticket.event_title} ticket. Show at the door.`}
				>
					<QRCodeSVG value={ticket.qr_code_data} size={200} level="M" />
				</div>
				<p className="text-[0.8125rem]" style={{ color: 'var(--theme-text-muted)' }}>Scan at the door</p>
			</div>

			{/* Event details */}
			<div className="w-full space-y-4 text-center">
				<h2 className="text-[1.5rem] font-semibold" style={{ color: 'var(--theme-text)' }}>{ticket.event_title}</h2>

				<div className="flex flex-col items-center gap-1" style={{ color: 'var(--theme-text-muted)' }}>
					<div className="flex items-center gap-2">
						<Icon icon="mdi:calendar" className="h-5 w-5" />
						<span className="text-[0.875rem]">{formatDate(ticket.session_date)}</span>
					</div>
					<div className="flex items-center gap-2">
						<Icon icon="mdi:clock-outline" className="h-5 w-5" />
						<span className="text-[0.875rem]">{formatTime(ticket.session_date)}</span>
					</div>
				</div>

				<div className="flex flex-col items-center gap-1" style={{ color: 'var(--theme-text-muted)' }}>
					<div className="flex items-center gap-2">
						<Icon icon="mdi:account" className="h-5 w-5" />
						<span className="text-[0.875rem]">{ticket.attendee_name}</span>
					</div>
					<div className="flex items-center gap-2">
						<Icon icon="mdi:ticket-confirmation" className="h-5 w-5" />
						<span className="text-[0.875rem]">{ticket.ticket_type}</span>
					</div>
				</div>
			</div>

			{/* Download PDF */}
			{ticket.pdf_url && (
				<a href={ticket.pdf_url} target="_blank" rel="noopener noreferrer" className="w-full">
					<Button
						variant="ghost"
						className="w-full rounded-lg"
						startContent={<Icon icon="mdi:download" className="h-5 w-5" />}
					>
						Download PDF
					</Button>
				</a>
			)}
		</div>
	);
}
