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
					--brand-primary: ${brandPrimary || '#6366f1'};
					--brand-accent: ${brandAccent || '#f59e0b'};
				}
			`}</style>

			<Layout organizerName={organizer.name} logoUrl={organizer.logo_url} socialLinks={organizer.social_links}>
				<div className="mx-auto max-w-2xl px-4 py-8">
					{/* Header */}
					<div className="mb-6">
						<h1 className="text-[1.5rem] font-semibold" style={{ color: 'var(--theme-text)' }}>My Tickets</h1>
						<p className="mt-1 text-[0.8125rem]" style={{ color: 'var(--theme-text-muted)' }}>{email}</p>
					</div>

					{/* Ticket list */}
					{tickets.length > 0 ? (
						<div className="space-y-8">
							{eventNames.map((eventTitle) => (
								<section key={eventTitle}>
									<h2 className="mb-3 text-[1.0625rem] font-semibold" style={{ color: 'var(--theme-text)' }}>
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
						<div className="flex flex-col items-center gap-4 py-16 text-center">
							<Icon icon="mdi:ticket-outline" className="h-12 w-12 text-gray-300" />
							<div>
								<p className="text-[1rem] font-medium" style={{ color: 'var(--theme-text-muted)' }}>No tickets yet.</p>
								<Link
									href="/"
									className="mt-2 inline-flex items-center gap-1 text-[0.875rem] font-medium transition hover:opacity-80"
									style={{ color: 'var(--brand-primary)' }}
								>
									Browse events
									<Icon icon="mdi:arrow-right" className="h-4 w-4" />
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
