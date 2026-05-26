import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Icon } from '@iconify/react';
import AccountLayout from '@/components/account/AccountLayout';
import TicketDetailView from '@/components/tickets/TicketDetailView';
import { useAttendee } from '@/hooks/useAttendee';
import { useOrganizer } from '@/contexts/OrganizerContext';
import type { ITicket } from '@/types';

export default function AccountTicketDetailPage() {
	const { t } = useTranslation('common');
	const router = useRouter();
	const { organizer } = useOrganizer();
	const { attendee, loading: authLoading } = useAttendee();
	const ticketId = router.query.ticketId as string | undefined;
	const [ticket, setTicket] = useState<ITicket | null>(null);

	useEffect(() => {
		if (!authLoading && !attendee) { router.replace(`/login?next=${encodeURIComponent(router.asPath)}`); }
	}, [authLoading, attendee, router]);

	useEffect(() => {
		if (!attendee || !ticketId) return;
		fetch(`/api/tickets/${ticketId}`).then(r => r.json()).then(setTicket).catch(() => {});
	}, [attendee, ticketId]);

	if (authLoading || !attendee || !ticket) return null;

	return (
		<AccountLayout organizer={organizer} email={attendee.email} active="tickets" title={ticket.event_title}>
			<Link
				href="/account/tickets"
				className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] py-2 pl-2.5 pr-4 font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[var(--theme-text-muted)] transition-colors duration-200 hover:text-[var(--theme-text)]"
			>
				<Icon icon="mdi:arrow-left" width={14} />
				{t('tickets.back_to_tickets')}
			</Link>
			<TicketDetailView ticket={ticket} locale={router.locale} />
		</AccountLayout>
	);
}
