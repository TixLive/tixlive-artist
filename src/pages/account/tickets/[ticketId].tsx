import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Icon } from '@iconify/react';
import AccountLayout from '@/components/account/AccountLayout';
import TicketDetailView from '@/components/tickets/TicketDetailView';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useGetMyTicket } from '@/queries/tickets/useGetMyTicket';
import { useOrganizer } from '@/contexts/OrganizerContext';
import Layout from '@/components/layout/Layout';
import type { NextPageWithLayout } from '@/pages/_app';

function TicketDetailContent() {
	const { t } = useTranslation('common');
	const router = useRouter();
	const { organizer } = useOrganizer();
	const { user } = useAuth();
	// Static export: router.query.ticketId is '_' (shell placeholder); read real id from URL
	const [ticketId, setTicketId] = useState<string | null>(null);

	useEffect(() => {
		const q = router.query.ticketId as string | undefined;
		if (q && q !== '_') { setTicketId(q); return; }
		const parts = window.location.pathname.split('/').filter(Boolean);
		setTicketId(parts[2] || null); // /account/tickets/:ticketId
	}, [router.query.ticketId]);

	const { data: ticket } = useGetMyTicket({ ticketId });

	if (!ticket) return null;

	return (
		<AccountLayout organizer={organizer} email={user!.email} active="tickets" title={ticket.event_title}>
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

const AccountTicketDetailPage: NextPageWithLayout = function AccountTicketDetailPage() {
	return (
		<ProtectedRoute>
			<TicketDetailContent />
		</ProtectedRoute>
	);
};

AccountTicketDetailPage.getLayout = (page) => <Layout>{page}</Layout>;

export default AccountTicketDetailPage;

import { staticI18nProps } from '@/lib/staticI18n';

export async function getStaticPaths() {
	return { paths: [{ params: { ticketId: '_' } }], fallback: false };
}

export function getStaticProps() {
	return { props: staticI18nProps() };
}
