import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { Icon } from '@iconify/react';
import { IOrganizer, ITicket } from '@/types';
import { getSite, getTicket } from '@/lib/api';
import Layout from '@/components/layout/Layout';
import TicketDetailView from '@/components/tickets/TicketDetailView';
import { withAttendeeAuth } from '@/middleware/Attendee.Middleware';

interface TicketDetailPageProps {
	organizer: IOrganizer;
	ticket: ITicket;
	brandPrimary: string;
	brandAccent: string;
}

export default function TicketDetailPage({ organizer, ticket, brandPrimary, brandAccent }: TicketDetailPageProps) {
	const { t } = useTranslation('common');
	const router = useRouter();

	return (
		<>
			<Head>
				<title>{ticket.event_title} — {t('tickets.my_tickets')} — {organizer.name}</title>
			</Head>

			<style jsx global>{`
				:root {
					--brand-primary: ${/^#[0-9a-fA-F]{3,8}$/.test(brandPrimary || '') ? brandPrimary : '#2D2A26'};
					--brand-accent: ${/^#[0-9a-fA-F]{3,8}$/.test(brandAccent || '') ? brandAccent : '#8B6914'};
				}
			`}</style>

			<Layout organizerName={organizer.name} logoUrl={organizer.logo_url} socialLinks={organizer.social_links}>
				<div className="mx-auto max-w-md px-4 py-10">
					{/* Back link */}
					<Link
						href="/my-tickets"
						className="mb-8 inline-flex items-center gap-1.5 text-[0.875rem] font-medium text-[var(--theme-text-muted)] transition-colors duration-200 hover:text-[var(--theme-text)]"
					>
						<Icon icon="mdi:arrow-left" width={16} />
						{t('tickets.back_to_tickets')}
					</Link>

					<TicketDetailView ticket={ticket} locale={router.locale} />
				</div>
			</Layout>
		</>
	);
}

export const getServerSideProps = withAttendeeAuth<TicketDetailPageProps>(async ({ params, locale }, attendee) => {
	const ticketId = params?.ticketId as string | undefined;
	if (!ticketId) {
		return { notFound: true };
	}

	try {
		const [organizer, ticket] = await Promise.all([
			getSite(),
			getTicket(attendee.email, attendee.organizer_id, ticketId),
		]);

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
});
