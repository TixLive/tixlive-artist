import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { Icon } from '@iconify/react';
import AccountLayout from '@/components/account/AccountLayout';
import TicketCard from '@/components/tickets/TicketCard';
import { getSite, getMyTickets } from '@/lib/api';
import { withAttendeeAuth } from '@/middleware/Attendee.Middleware';
import { ACCESS_COOKIE } from '@/lib/cookies';
import type { IOrganizer, ITicket } from '@/types';

interface AccountTicketsProps {
	organizer: IOrganizer;
	tickets: ITicket[];
	email: string;
	brandPrimary: string;
	brandAccent: string;
}

export default function AccountTicketsPage({
	organizer,
	tickets,
	email,
	brandPrimary,
	brandAccent,
}: AccountTicketsProps) {
	const { t } = useTranslation('common');
	const router = useRouter();

	const groupedTickets = useMemo(() => {
		const groups: Record<string, ITicket[]> = {};
		for (const ticket of tickets) {
			if (!groups[ticket.event_title]) {
				groups[ticket.event_title] = [];
			}
			groups[ticket.event_title].push(ticket);
		}
		return groups;
	}, [tickets]);

	const eventNames = Object.keys(groupedTickets);

	return (
		<AccountLayout
			organizer={organizer}
			brandPrimary={brandPrimary}
			brandAccent={brandAccent}
			email={email}
			active="tickets"
			title={t('account.tickets')}
		>
			<div className="mb-6">
				<h1 className="font-[family-name:var(--font-display)] text-[1.5rem] font-[800] tracking-tight text-[var(--theme-text)]">
					{t('account.tickets')}
				</h1>
			</div>

			{tickets.length > 0 ? (
				<div className="space-y-10">
					{eventNames.map((eventTitle) => {
						const count = groupedTickets[eventTitle].length;
						return (
							<section key={eventTitle}>
								<div className="mb-3 flex items-baseline justify-between gap-3">
									<h2 className="font-[family-name:var(--font-display)] text-[1.125rem] font-[800] tracking-tight text-[var(--theme-text)]">
										{eventTitle}
									</h2>
									<span className="font-[family-name:var(--font-data)] text-[0.75rem] tabular-nums text-[var(--theme-text-muted)]">
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
				<div className="flex flex-col items-center gap-4 py-20 text-center">
					<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--theme-surface)]">
						<Icon icon="mdi:ticket-outline" width={28} className="text-[var(--theme-text-muted)]" />
					</div>
					<div>
						<p className="text-[1rem] font-medium text-[var(--theme-text-muted)]">
							{t('tickets.no_tickets')}
						</p>
						<Link
							href="/"
							className="mt-2 inline-flex items-center gap-1 text-[0.875rem] font-medium text-[var(--brand-accent)] transition-colors duration-200 hover:text-[var(--theme-text)]"
						>
							{t('tickets.browse_events')}
							<Icon icon="mdi:arrow-right" width={16} />
						</Link>
					</div>
				</div>
			)}
		</AccountLayout>
	);
}

export const getServerSideProps = withAttendeeAuth<AccountTicketsProps>(async (ctx, attendee) => {
	const token = ctx.req.cookies?.[ACCESS_COOKIE] || '';
	const [organizer, tickets] = await Promise.all([getSite(), getMyTickets(token)]);

	return {
		props: {
			organizer,
			tickets,
			email: attendee.email,
			brandPrimary: organizer.brand_primary_color || '',
			brandAccent: organizer.brand_accent_color || '',
			...(await serverSideTranslations(ctx.locale ?? 'en', ['common'])),
		},
	};
});
