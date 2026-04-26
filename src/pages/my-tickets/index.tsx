import { useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { Icon } from '@iconify/react';
import { IOrganizer, ITicket } from '@/types';
import { getSite, getMyTickets } from '@/lib/api';
import Layout from '@/components/layout/Layout';
import TicketCard from '@/components/tickets/TicketCard';
import { withAttendeeAuth } from '@/middleware/Attendee.Middleware';

interface MyTicketsProps {
	organizer: IOrganizer;
	tickets: ITicket[];
	email: string;
	brandPrimary: string;
	brandAccent: string;
}

export default function MyTicketsPage({ organizer, tickets, email, brandPrimary, brandAccent }: MyTicketsProps) {
	const { t } = useTranslation('common');
	const router = useRouter();
	const [signingOut, setSigningOut] = useState(false);

	const handleSignOut = async () => {
		setSigningOut(true);
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
		} catch {
			/* ignore; still redirect */
		}
		router.push('/login');
	};

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
					--brand-primary: ${/^#[0-9a-fA-F]{3,8}$/.test(brandPrimary || '') ? brandPrimary : '#2D2A26'};
					--brand-accent: ${/^#[0-9a-fA-F]{3,8}$/.test(brandAccent || '') ? brandAccent : '#8B6914'};
				}
			`}</style>

			<Layout organizerName={organizer.name} logoUrl={organizer.logo_url} socialLinks={organizer.social_links}>
				<div className="mx-auto max-w-2xl px-4 py-10">
					{/* Header */}
					<div className="mb-8 flex items-start justify-between gap-4 border-b border-[color-mix(in_srgb,var(--theme-text)_6%,transparent)] pb-6">
						<div className="min-w-0">
							<h1 className="font-[family-name:var(--font-display)] text-[1.75rem] font-[800] tracking-tight text-[var(--theme-text)]">{t('tickets.my_tickets')}</h1>
							<p className="mt-1 truncate font-[family-name:var(--font-data)] text-[0.8125rem] text-[var(--theme-text-muted)]">
								{t('tickets.signed_in_as')} <span className="text-[var(--theme-text)]">{email}</span>
							</p>
						</div>
						<button
							type="button"
							onClick={handleSignOut}
							disabled={signingOut}
							className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--theme-text)_10%,transparent)] px-3 py-1.5 text-[0.75rem] font-medium text-[var(--theme-text-muted)] transition-colors duration-200 hover:border-[color-mix(in_srgb,var(--theme-text)_18%,transparent)] hover:text-[var(--theme-text)] disabled:opacity-60"
						>
							<Icon icon="mdi:logout" width={14} />
							{t('auth.sign_out')}
						</button>
					</div>

					{/* Ticket list */}
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
						/* Empty state */
						<div className="flex flex-col items-center gap-4 py-20 text-center">
							<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--theme-surface)]">
								<Icon icon="mdi:ticket-outline" width={28} className="text-[var(--theme-text-muted)]" />
							</div>
							<div>
								<p className="text-[1rem] font-medium text-[var(--theme-text-muted)]">{t('tickets.no_tickets')}</p>
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
				</div>
			</Layout>
		</>
	);
}

export const getServerSideProps = withAttendeeAuth<MyTicketsProps>(async ({ locale }, attendee) => {
	const [organizer, tickets] = await Promise.all([
		getSite(),
		getMyTickets(attendee.email, attendee.organizer_id),
	]);

	return {
		props: {
			organizer,
			tickets,
			email: attendee.email,
			brandPrimary: organizer.brand_primary_color || '',
			brandAccent: organizer.brand_accent_color || '',
			...(await serverSideTranslations(locale ?? 'en', ['common'])),
		},
	};
});
