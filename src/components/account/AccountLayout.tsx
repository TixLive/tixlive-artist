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
	organizer: IOrganizer;
	brandPrimary: string;
	brandAccent: string;
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
				<title>{title} — {organizer.name}</title>
			</Head>

			<style jsx global>{`
				:root {
					--brand-primary: ${/^#[0-9a-fA-F]{3,8}$/.test(brandPrimary || '') ? brandPrimary : '#2D2A26'};
					--brand-accent: ${/^#[0-9a-fA-F]{3,8}$/.test(brandAccent || '') ? brandAccent : '#8B6914'};
				}
			`}</style>

			<Layout
				organizerName={organizer.name}
				logoUrl={organizer.logo_url}
				socialLinks={organizer.social_links}
			>
				<div className="mx-auto max-w-5xl px-4 py-10">
					{/* Mobile segmented tabs */}
					<nav className="mb-8 flex gap-1 overflow-x-auto rounded-xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-1 md:hidden">
						{NAV_ITEMS.map((item) => {
							const isActive = active === item.section;
							return (
								<Link
									key={item.section}
									href={item.href}
									className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[0.8125rem] font-medium transition-colors duration-200 ${
										isActive
											? 'bg-[var(--theme-bg)] text-[var(--theme-text)] shadow-[0_1px_3px_rgba(20,19,18,0.04)]'
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
						<aside className="hidden md:block md:w-[240px] md:shrink-0">
							<div className="sticky top-24 space-y-6">
								<div className="flex items-center gap-3 border-b border-[color-mix(in_srgb,var(--theme-text)_6%,transparent)] pb-5">
									<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--brand-accent)_14%,transparent)] font-[family-name:var(--font-display)] text-[0.875rem] font-[700] text-[var(--brand-accent)]">
										{initials}
									</div>
									<div className="min-w-0">
										<p className="truncate text-[0.6875rem] uppercase tracking-wide text-[var(--theme-text-muted)]">
											{t('account.signed_in_as')}
										</p>
										<p className="truncate font-[family-name:var(--font-data)] text-[0.8125rem] font-medium text-[var(--theme-text)]">
											{email}
										</p>
									</div>
								</div>

								<nav className="flex flex-col gap-0.5">
									{NAV_ITEMS.map((item) => {
										const isActive = active === item.section;
										return (
											<Link
												key={item.section}
												href={item.href}
												className={`inline-flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.9375rem] font-[family-name:var(--font-display)] font-[600] transition-colors duration-200 ${
													isActive
														? 'bg-[color-mix(in_srgb,var(--theme-text)_5%,transparent)] text-[var(--theme-text)]'
														: 'text-[var(--theme-text-muted)] hover:bg-[color-mix(in_srgb,var(--theme-text)_4%,transparent)] hover:text-[var(--theme-text)]'
												}`}
											>
												<Icon icon={item.icon} width={18} />
												{t(item.labelKey)}
											</Link>
										);
									})}
								</nav>

								<div className="border-t border-[color-mix(in_srgb,var(--theme-text)_6%,transparent)] pt-4">
									<button
										type="button"
										onClick={handleSignOut}
										disabled={signingOut}
										className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[0.8125rem] font-medium text-[var(--theme-text-muted)] transition-colors duration-200 hover:text-[var(--theme-text)] disabled:opacity-60"
									>
										<Icon icon="mdi:logout" width={16} />
										{t('auth.sign_out')}
									</button>
								</div>
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
							className="inline-flex items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--theme-text)_10%,transparent)] px-4 py-2 text-[0.8125rem] font-medium text-[var(--theme-text-muted)] transition-colors duration-200 hover:border-[color-mix(in_srgb,var(--theme-text)_18%,transparent)] hover:text-[var(--theme-text)] disabled:opacity-60"
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
