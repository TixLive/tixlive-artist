import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'next-i18next';
import { ITicket } from '@/types';

interface TicketDetailViewProps {
	ticket: ITicket;
	locale?: string;
}

export default function TicketDetailView({ ticket, locale = 'en' }: TicketDetailViewProps) {
	const { t } = useTranslation('common');

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString(locale, {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
		});
	};

	const formatTime = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleTimeString(locale, {
			hour: 'numeric',
			minute: '2-digit',
		});
	};

	return (
		<div className="flex flex-col items-center gap-8">
			{/* QR Code */}
			<div className="flex flex-col items-center gap-3">
				<div
					className="flex min-h-[272px] min-w-[272px] items-center justify-center rounded-[20px] border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-6"
					role="img"
					aria-label={`QR ${ticket.event_title}`}
				>
					<QRCodeSVG value={ticket.qr_code_data} size={224} level="M" />
				</div>
				<p className="text-[0.8125rem] text-[var(--theme-text-muted)]">{t('tickets.scan_at_door_short')}</p>
				<p className="font-[family-name:var(--font-mono)] text-[0.6875rem] uppercase tracking-wide text-[var(--theme-text-muted)]">
					{ticket.id}
				</p>
			</div>

			{/* Event details */}
			<div className="w-full space-y-5 text-center">
				<h2 className="font-[family-name:var(--font-display)] text-[1.5rem] font-[800] tracking-tight text-[var(--theme-text)]">{ticket.event_title}</h2>

				<div className="flex flex-col items-center gap-2 text-[var(--theme-text-muted)]">
					<div className="flex items-center gap-2">
						<Icon icon="mdi:calendar" width={18} />
						<span className="font-[family-name:var(--font-data)] text-[0.875rem]">{formatDate(ticket.session_date)}</span>
					</div>
					<div className="flex items-center gap-2">
						<Icon icon="mdi:clock-outline" width={18} />
						<span className="font-[family-name:var(--font-data)] text-[0.875rem]">{formatTime(ticket.session_date)}</span>
					</div>
				</div>

				<div className="flex flex-col items-center gap-2 text-[var(--theme-text-muted)]">
					<div className="flex items-center gap-2">
						<Icon icon="mdi:account" width={18} />
						<span className="text-[0.875rem]">{ticket.attendee_name}</span>
					</div>
					<div className="flex items-center gap-2">
						<Icon icon="mdi:ticket-confirmation" width={18} />
						<span className="text-[0.875rem]">{ticket.ticket_type}</span>
					</div>
				</div>
			</div>

			{/* Download PDF */}
			{ticket.pdf_url && (
				<a href={ticket.pdf_url} target="_blank" rel="noopener noreferrer" className="w-full">
					<Button
						variant="bordered"
						className="w-full rounded-xl border-[color-mix(in_srgb,var(--theme-text)_12%,transparent)] font-[family-name:var(--font-display)] font-[700] text-[var(--theme-text)]"
						startContent={<Icon icon="mdi:download" width={20} />}
					>
						{t('tickets.download_pdf')}
					</Button>
				</a>
			)}
		</div>
	);
}
