import { useMemo } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { Icon } from '@iconify/react';
import { IOrganizer, ITicket } from '@/types';
import { getSite, getMyTickets } from '@/lib/api';
import Layout from '@/components/layout/Layout';
import TicketCard from '@/components/tickets/TicketCard';

interface MyTicketsProps {
	organizer: IOrganizer;
	tickets: ITicket[];
	email: string;
	brandPrimary: string;
	brandAccent: string;
}

export default function MyTicketsPage({ organizer, tickets, email, brandPrimary, brandAccent }: MyTicketsProps) {
	const { t } = useTranslation('common');

	// Group tickets by event_title
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
		<>
			<Head>
				<title>My Tickets — {organizer.name}</title>
			</Head>

			<style jsx global>{`
				:root {
					--brand-primary: ${brandPrimary || '#2D2A26'};
					--brand-accent: ${brandAccent || '#8B6914'};
				}
			`}</style>

			<Layout organizerName={organizer.name} logoUrl={organizer.logo_url} socialLinks={organizer.social_links}>
				<div className="mx-auto max-w-2xl px-4 py-10">
					{/* Header */}
					<div className="mb-8">
						<h1 className="font-[family-name:var(--font-display)] text-[1.75rem] font-[800] tracking-tight text-[var(--theme-text)]">My Tickets</h1>
						<p className="mt-1 text-[0.8125rem] text-[var(--theme-text-muted)]">{email}</p>
					</div>

					{/* Ticket list */}
					{tickets.length > 0 ? (
						<div className="space-y-10">
							{eventNames.map((eventTitle) => (
								<section key={eventTitle}>
									<h2 className="mb-3 font-[family-name:var(--font-display)] text-[1.0625rem] font-[700] text-[var(--theme-text)]">
										{eventTitle}
									</h2>
									<div className="space-y-3">
										{groupedTickets[eventTitle].map((ticket) => (
											<TicketCard key={ticket.id} ticket={ticket} />
										))}
									</div>
								</section>
							))}
						</div>
					) : (
						/* Empty state */
						<div className="flex flex-col items-center gap-4 py-20 text-center">
							<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--theme-surface)]">
								<Icon icon="mdi:ticket-outline" width={28} className="text-[var(--theme-text-muted)]" />
							</div>
							<div>
								<p className="text-[1rem] font-medium text-[var(--theme-text-muted)]">No tickets yet.</p>
								<Link
									href="/"
									className="mt-2 inline-flex items-center gap-1 text-[0.875rem] font-medium text-[var(--brand-accent)] transition-colors duration-200 hover:text-[var(--theme-text)]"
								>
									Browse events
									<Icon icon="mdi:arrow-right" width={16} />
								</Link>
							</div>
						</div>
					)}
				</div>
			</Layout>
		</>
	);
}

export const getServerSideProps: GetServerSideProps<MyTicketsProps> = async ({ req, locale }) => {
	const sessionCookie = req.cookies.attendee_session;

	if (!sessionCookie) {
		return { redirect: { destination: '/', permanent: false } };
	}

	let email: string;
	let organizerId: number;
	try {
		const session = JSON.parse(sessionCookie);
		email = session.email;
		organizerId = session.organizer_id;
	} catch {
		return { redirect: { destination: '/', permanent: false } };
	}

	const [organizer, tickets] = await Promise.all([getSite(), getMyTickets(email, organizerId)]);

	return {
		props: {
			organizer,
			tickets,
			email,
			brandPrimary: organizer.brand_primary_color || '',
			brandAccent: organizer.brand_accent_color || '',
			...(await serverSideTranslations(locale ?? 'en', ['common'])),
		},
	};
};
