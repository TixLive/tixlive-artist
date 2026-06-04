import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Icon } from '@iconify/react';
import AccountLayout from '@/components/account/AccountLayout';
import TicketCard from '@/components/tickets/TicketCard';
import LoadMore from '@/components/common/LoadMore';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useGetMyTickets } from '@/queries/tickets/useGetMyTickets';
import { useOrganizer } from '@/contexts/OrganizerContext';
import { useClarityEventOnce } from '@/hooks/useClarityEventOnce';
import { CLARITY_EVENTS } from '@/lib/clarity.constants';
import Layout from '@/components/layout/Layout';
import type { NextPageWithLayout } from '@/pages/_app';
import type { ITicket } from '@/types';

function AccountTicketsContent() {
	const { t } = useTranslation('common');
	const router = useRouter();
	const { organizer } = useOrganizer();
	const { user } = useAuth();
	const {
		data,
		isLoading,
		fetchNextPage,
		isFetchingNextPage,
		hasNextPage,
		isError,
	} = useGetMyTickets();

	const tickets = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);

	// Clarity: mark that an attendee reviewed their tickets (fires once per mount).
	useClarityEventOnce({ name: CLARITY_EVENTS.TICKETS_VIEWED, when: tickets.length > 0 });

	// Group the currently-loaded set by event_title. Counts evolve as more pages
	// load — this is the agreed pagination behavior (paginate by ticket row,
	// regroup the loaded set).
	const groupedTickets = useMemo(() => {
		const groups: Record<string, ITicket[]> = {};
		for (const ticket of tickets) {
			if (!groups[ticket.event_title]) groups[ticket.event_title] = [];
			groups[ticket.event_title].push(ticket);
		}
		return groups;
	}, [tickets]);

	const eventNames = Object.keys(groupedTickets);

	return (
		<AccountLayout organizer={organizer} email={user!.email} active="tickets" title={t('account.tickets')}>
			<div className="mb-8">
				<h1 className="font-[family-name:var(--font-display)] text-[1.75rem] font-[700] tracking-[-0.02em] text-[var(--theme-text)] sm:text-[2rem]">
					{t('account.tickets')}
				</h1>
			</div>
			{isLoading ? (
				<div className="space-y-10" role="status" aria-label={t('common.loading')}>
					<section>
						<div className="mb-3 flex items-baseline justify-between gap-3 border-b border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] pb-3">
							<div className="skeleton h-4 w-40 rounded-md" />
							<div className="skeleton h-3 w-16 rounded-md" />
						</div>
						<div className="space-y-3">
							{Array.from({ length: 3 }).map((_, i) => (
								<div
									key={i}
									className="flex items-center gap-4 rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-4"
								>
									<div className="skeleton h-14 w-14 flex-shrink-0 rounded-xl" />
									<div className="min-w-0 flex-1 space-y-2">
										<div className="skeleton h-4 w-2/3 rounded-md" />
										<div className="skeleton h-3 w-44 rounded-md" />
										<div className="skeleton h-3 w-28 rounded-md" />
									</div>
									<div className="skeleton h-5 w-5 flex-shrink-0 rounded-md" />
								</div>
							))}
						</div>
					</section>
				</div>
			) : tickets.length > 0 ? (
				<>
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
					<LoadMore
						hasNextPage={hasNextPage}
						isFetching={isFetchingNextPage}
						isError={isError}
						onLoadMore={fetchNextPage}
					/>
				</>
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

const AccountTicketsPage: NextPageWithLayout = function AccountTicketsPage() {
	return (
		<ProtectedRoute>
			<AccountTicketsContent />
		</ProtectedRoute>
	);
};

AccountTicketsPage.getLayout = (page) => <Layout>{page}</Layout>;

export default AccountTicketsPage;

import { staticI18nProps } from '@/lib/staticI18n';

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: staticI18nProps(locale),
});
