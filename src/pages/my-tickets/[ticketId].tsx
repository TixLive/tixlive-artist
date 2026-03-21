import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { Icon } from '@iconify/react';
import { IOrganizer, ITicket } from '@/types';
import { getSite, getTicket } from '@/lib/api';
import Layout from '@/components/layout/Layout';
import TicketDetailView from '@/components/tickets/TicketDetailView';

interface TicketDetailPageProps {
	organizer: IOrganizer;
	ticket: ITicket;
	brandPrimary: string;
	brandAccent: string;
}

export default function TicketDetailPage({ organizer, ticket, brandPrimary, brandAccent }: TicketDetailPageProps) {
	const { t } = useTranslation('common');

	return (
		<>
			<Head>
				<title>{ticket.event_title} — Ticket — {organizer.name}</title>
			</Head>

			<style jsx global>{`
				:root {
					--brand-primary: ${brandPrimary || '#6366f1'};
					--brand-accent: ${brandAccent || '#f59e0b'};
				}
			`}</style>

			<Layout organizerName={organizer.name} logoUrl={organizer.logo_url} socialLinks={organizer.social_links}>
				<div className="mx-auto max-w-md px-4 py-8">
					{/* Back link */}
					<Link
						href="/my-tickets"
						className="mb-6 inline-flex items-center gap-1 text-[0.875rem] font-medium transition"
					style={{ color: 'var(--theme-text-muted)' }}
					>
						<Icon icon="mdi:arrow-left" className="h-4 w-4" />
						Back to My Tickets
					</Link>

					<TicketDetailView ticket={ticket} />
				</div>
			</Layout>
		</>
	);
}

export const getServerSideProps: GetServerSideProps<TicketDetailPageProps> = async ({ req, params, locale }) => {
	const sessionCookie = req.cookies.attendee_session;

	if (!sessionCookie) {
		return { redirect: { destination: '/', permanent: false } };
	}

	const ticketId = params?.ticketId as string;

	if (!ticketId) {
		return { notFound: true };
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

	try {
		const [organizer, ticket] = await Promise.all([getSite(), getTicket(email, organizerId, ticketId)]);

		return {
			props: {
				organizer,
				ticket,
				brandPrimary: organizer.brand_primary_color || '',
				brandAccent: organizer.brand_accent_color || '',
				...(await serverSideTranslations(locale ?? 'en', ['common'])),
			},
		};
	} catch {
		return { notFound: true };
	}
};
