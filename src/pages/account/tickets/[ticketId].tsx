import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { Icon } from '@iconify/react';
import AccountLayout from '@/components/account/AccountLayout';
import TicketDetailView from '@/components/tickets/TicketDetailView';
import { getSite, getTicket } from '@/lib/api';
import { withAttendeeAuth } from '@/middleware/Attendee.Middleware';
import { ACCESS_COOKIE } from '@/lib/cookies';
import type { IOrganizer, ITicket } from '@/types';

interface TicketDetailPageProps {
	organizer: IOrganizer;
	ticket: ITicket;
	email: string;
	brandPrimary: string;
	brandAccent: string;
}

export default function AccountTicketDetailPage({
	organizer,
	ticket,
	email,
	brandPrimary,
	brandAccent,
}: TicketDetailPageProps) {
	const { t } = useTranslation('common');
	const router = useRouter();

	return (
		<AccountLayout
			organizer={organizer}
			brandPrimary={brandPrimary}
			brandAccent={brandAccent}
			email={email}
			active="tickets"
			title={ticket.event_title}
		>
			<Link
				href="/account/tickets"
				className="mb-6 inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-[var(--theme-text-muted)] transition-colors duration-200 hover:text-[var(--theme-text)]"
			>
				<Icon icon="mdi:arrow-left" width={16} />
				{t('tickets.back_to_tickets')}
			</Link>

			<TicketDetailView ticket={ticket} locale={router.locale} />
		</AccountLayout>
	);
}

export const getServerSideProps = withAttendeeAuth<TicketDetailPageProps>(async (ctx, attendee) => {
	const ticketId = ctx.params?.ticketId as string | undefined;
	if (!ticketId) {
		return { notFound: true };
	}

	const token = ctx.req.cookies?.[ACCESS_COOKIE] || '';

	try {
		const [organizer, ticket] = await Promise.all([getSite(), getTicket(token, ticketId)]);

		return {
			props: {
				organizer,
				ticket,
				email: attendee.email,
				brandPrimary: organizer.brand_primary_color || '',
				brandAccent: organizer.brand_accent_color || '',
				...(await serverSideTranslations(ctx.locale ?? 'en', ['common'])),
			},
		};
	} catch {
		return { notFound: true };
	}
});
