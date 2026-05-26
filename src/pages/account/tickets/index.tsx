import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Icon } from '@iconify/react';
import AccountLayout from '@/components/account/AccountLayout';
import TicketCard from '@/components/tickets/TicketCard';
import { useAttendee } from '@/hooks/useAttendee';
import { useOrganizer } from '@/contexts/OrganizerContext';
import type { ITicket } from '@/types';

export default function AccountTicketsPage() {
	const { t } = useTranslation('common');
	const router = useRouter();
	const { organizer } = useOrganizer();
	const { attendee, loading: authLoading } = useAttendee();
	const [tickets, setTickets] = useState<ITicket[]>([]);

	useEffect(() => {
		if (!authLoading && !attendee) { router.replace(`/login?next=${encodeURIComponent(router.asPath)}`); }
	}, [authLoading, attendee, router]);

	useEffect(() => {
		if (!attendee) return;
		fetch('/api/tickets').then(r => r.json()).then((data) => {
			if (Array.isArray(data)) setTickets(data);
		}).catch(() => {});
	}, [attendee]);

	const groupedTickets = useMemo(() => {
		const groups: Record<string, ITicket[]> = {};
		for (const ticket of tickets) {
			if (!groups[ticket.event_title]) groups[ticket.event_title] = [];
			groups[ticket.event_title].push(ticket);
		}
		return groups;
	}, [tickets]);

	if (authLoading || !attendee) return null;

	const eventNames = Object.keys(groupedTickets);

	return (
		<AccountLayout organizer={organizer} email={attendee.email} active="tickets" title={t('account.tickets')}>
			<div className="mb-8">
				<h1 className="font-[family-name:var(--font-display)] text-[1.75rem] font-[700] tracking-[-0.02em] text-[var(--theme-text)] sm:text-[2rem]">
					{t('account.tickets')}
				</h1>
			</div>
			{tickets.length > 0 ? (
				<div className="space-y-10">
					{eventNames.map((eventTitle) => {
						const count = groupedTickets[eventTitle].length;
						return (
							<section key={eventTitle}>
								<div className="mb-3 flex items-baseline justify-between gap-3 border-b border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] pb-3">
									<h2 className="font-[family-name:var(--font-display)] text-[1.125rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)]">{eventTitle}</h2>
									<span className="shrink-0 font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] tabular-nums text-[var(--theme-text-muted)]">
										{t('tickets.tickets_count', { count })}
									</span>
								</div>
								<div className="space-y-3">
									{groupedTickets[eventTitle].map((ticket) => (
										<TicketCard key={ticket.id} ticket={ticket} locale={router.locale} />
									))}
								</div>
							</section>
						);
					})}
				</div>
			) : (
				<div className="flex flex-col items-center gap-4 rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] py-20 text-center">
					<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--theme-text)_6%,transparent)]">
						<Icon icon="mdi:ticket-outline" width={28} className="text-[var(--theme-text-muted)]" />
					</div>
					<div>
						<p className="text-[1rem] font-medium text-[var(--theme-text-muted)]">{t('tickets.no_tickets')}</p>
						<Link href="/" className="mt-2 inline-flex items-center gap-1 font-[family-name:var(--font-body)] text-[0.875rem] font-[600] text-[var(--brand-accent)] transition-colors duration-200 hover:text-[var(--theme-text)]">
							{t('tickets.browse_events')}
							<Icon icon="mdi:arrow-right" width={16} />
						</Link>
					</div>
				</div>
			)}
		</AccountLayout>
	);
}
