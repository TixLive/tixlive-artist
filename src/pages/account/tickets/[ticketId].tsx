import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Icon } from '@iconify/react';
import AccountLayout from '@/components/account/AccountLayout';
import TicketDetailView from '@/components/tickets/TicketDetailView';
import { useAttendee } from '@/hooks/useAttendee';
import { useOrganizer } from '@/contexts/OrganizerContext';
import Layout from '@/components/layout/Layout';
import type { NextPageWithLayout } from '@/pages/_app';
import type { ITicket } from '@/types';

const AccountTicketDetailPage: NextPageWithLayout = function AccountTicketDetailPage() {
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
		let cancelled = false;
		fetch(`/api/tickets/${ticketId}`)
			.then((r) => (r.ok ? r.json() : null))
			.then((data) => { if (!cancelled && data) setTicket(data as ITicket); })
			.catch(() => {});
		return () => { cancelled = true; };
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
};

AccountTicketDetailPage.getLayout = (page) => <Layout>{page}</Layout>;

export default AccountTicketDetailPage;

import { staticI18nProps } from '@/lib/staticI18n';

export const runtime = 'experimental-edge';
export const getServerSideProps = ({ locale }: { locale?: string }) => ({ props: staticI18nProps(locale) });
