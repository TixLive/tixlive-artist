import { ReactNode, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Icon } from '@iconify/react';
import Layout from '@/components/layout/Layout';
import type { IOrganizer } from '@/types';

export type AccountSection = 'orders' | 'tickets' | 'profile';

interface AccountLayoutProps {
	organizer?: IOrganizer | null;
	brandPrimary?: string;
	brandAccent?: string;
	email: string;
	active: AccountSection;
	title: string;
	children: ReactNode;
}

const NAV_ITEMS: Array<{ section: AccountSection; href: string; icon: string; labelKey: string }> = [
	{ section: 'orders', href: '/account/orders', icon: 'mdi:receipt-text-outline', labelKey: 'account.orders' },
	{ section: 'tickets', href: '/account/tickets', icon: 'mdi:ticket-outline', labelKey: 'account.tickets' },
	{ section: 'profile', href: '/account/profile', icon: 'mdi:account-circle-outline', labelKey: 'account.profile' },
];

export default function AccountLayout({
	organizer,
	brandPrimary,
	brandAccent,
	email,
	active,
	title,
	children,
}: AccountLayoutProps) {
	const { t } = useTranslation('common');
	const router = useRouter();
	const [signingOut, setSigningOut] = useState(false);

	const handleSignOut = async () => {
		setSigningOut(true);
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
		} catch {
			/* ignore */
		}
		router.push('/login');
	};

	const initials = (email.split('@')[0] || '?')
		.split(/[._-]/)
		.filter(Boolean)
		.slice(0, 2)
		.map((p) => p[0]?.toUpperCase() ?? '')
		.join('') || email[0]?.toUpperCase() || '?';

	return (
		<>
			<Head>
				<title>{`${title}${organizer ? ` — ${organizer.name}` : ''}`}</title>
			</Head>

			<Layout organizer={organizer ?? undefined}>
				<div className="mx-auto max-w-[1120px] px-4 py-10 sm:px-6 md:py-16">
					{/* Mobile segmented tabs */}
					<nav className="mb-8 flex gap-1 overflow-x-auto rounded-full border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-1.5 md:hidden">
						{NAV_ITEMS.map((item) => {
							const isActive = active === item.section;
							return (
								<Link
									key={item.section}
									href={item.href}
									className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 font-[family-name:var(--font-body)] text-[0.8125rem] font-[600] transition-colors duration-200 ${
										isActive
											? 'bg-[var(--brand-primary)] text-[var(--theme-bg)]'
											: 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'
									}`}
								>
									<Icon icon={item.icon} width={16} />
									{t(item.labelKey)}
								</Link>
							);
						})}
					</nav>

					<div className="md:flex md:gap-10">
						{/* Desktop sidebar */}
						<aside className="hidden md:block md:w-[260px] md:shrink-0">
							<div className="sticky top-24 space-y-5">
								<div className="flex items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-4">
									<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)] font-[family-name:var(--font-display)] text-[0.875rem] font-[700] text-[var(--theme-bg)]">
										{initials}
									</div>
									<div className="min-w-0">
										<p className="truncate font-[family-name:var(--font-mono)] text-[0.5625rem] uppercase tracking-[0.15em] text-[color-mix(in_srgb,var(--theme-text)_45%,transparent)]">
											{t('account.signed_in_as')}
										</p>
										<p className="mt-0.5 truncate font-[family-name:var(--font-data)] text-[0.8125rem] font-[600] text-[var(--theme-text)]">
											{email}
										</p>
									</div>
								</div>

								<nav className="flex flex-col gap-1 rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-2">
									{NAV_ITEMS.map((item) => {
										const isActive = active === item.section;
										return (
											<Link
												key={item.section}
												href={item.href}
												className={`inline-flex items-center gap-3 rounded-xl px-3 py-2.5 font-[family-name:var(--font-body)] text-[0.9375rem] font-[600] transition-colors duration-200 ${
													isActive
														? 'bg-[var(--brand-primary)] text-[var(--theme-bg)]'
														: 'text-[var(--theme-text-muted)] hover:bg-[color-mix(in_srgb,var(--theme-text)_4%,transparent)] hover:text-[var(--theme-text)]'
												}`}
											>
												<Icon icon={item.icon} width={18} />
												{t(item.labelKey)}
											</Link>
										);
									})}
								</nav>

								<button
									type="button"
									onClick={handleSignOut}
									disabled={signingOut}
									className="inline-flex items-center gap-2 rounded-full px-4 py-2 font-[family-name:var(--font-body)] text-[0.8125rem] font-[600] text-[var(--theme-text-muted)] transition-colors duration-200 hover:text-[var(--theme-text)] disabled:opacity-60"
								>
									<Icon icon="mdi:logout" width={16} />
									{t('auth.sign_out')}
								</button>
							</div>
						</aside>

						{/* Content */}
						<section className="min-w-0 flex-1">{children}</section>
					</div>

					{/* Mobile sign-out (bottom) */}
					<div className="mt-10 flex justify-center md:hidden">
						<button
							type="button"
							onClick={handleSignOut}
							disabled={signingOut}
							className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--theme-text)_10%,transparent)] px-5 py-2.5 font-[family-name:var(--font-body)] text-[0.8125rem] font-[600] text-[var(--theme-text-muted)] transition-colors duration-200 hover:border-[color-mix(in_srgb,var(--theme-text)_18%,transparent)] hover:text-[var(--theme-text)] disabled:opacity-60"
						>
							<Icon icon="mdi:logout" width={14} />
							{t('auth.sign_out')}
						</button>
					</div>
				</div>
			</Layout>
		</>
	);
}
