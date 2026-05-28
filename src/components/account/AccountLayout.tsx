import { ReactNode, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Icon } from '@iconify/react';
import { useAuth } from '@/contexts/AuthContext';
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
	{ section: 'orders', href: '/account/orders', icon: 'mdi:file-document-outline', labelKey: 'account.orders' },
	{ section: 'tickets', href: '/account/tickets', icon: 'mdi:ticket-outline', labelKey: 'account.tickets' },
	{ section: 'profile', href: '/account/profile', icon: 'mdi:account-outline', labelKey: 'account.profile' },
];

export default function AccountLayout({
	organizer,
	email,
	active,
	title,
	children,
}: AccountLayoutProps) {
	const { t } = useTranslation('common');
	const router = useRouter();
	const { signOut } = useAuth();
	const [signingOut, setSigningOut] = useState(false);

	const handleSignOut = async () => {
		setSigningOut(true);
		signOut();
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

			<div className="mx-auto max-w-[1200px] px-4 pb-12 pt-8 sm:px-5 md:px-8">
				{/* Mobile segmented tabs */}
				<nav className="mb-8 flex gap-1 overflow-x-auto rounded-full bg-[var(--bg-2)] p-1.5 md:hidden">
					{NAV_ITEMS.map((item) => {
						const isActive = active === item.section;
						return (
							<Link
								key={item.section}
								href={item.href}
								className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-[600] tracking-[-0.005em] transition-colors duration-150 ${
									isActive
										? 'bg-[var(--ink)] text-white'
										: 'text-[var(--ink-3)] hover:text-[var(--ink)]'
								}`}
							>
								<Icon icon={item.icon} width={14} />
								{t(item.labelKey)}
							</Link>
						);
					})}
				</nav>

				<div className="md:grid md:gap-8" style={{ gridTemplateColumns: '260px 1fr' }}>
					{/* Desktop sidebar */}
					<aside className="hidden md:block">
						<div className="sticky top-[88px] flex flex-col gap-4">
							<div className="flex items-center gap-3 rounded-[18px] bg-[var(--surface)] p-3.5" style={{ boxShadow: 'var(--shadow-2)' }}>
								<div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-[13px] font-[800] tracking-[-0.018em] text-white">
									{initials}
								</div>
								<div className="min-w-0">
									<p className="m-0 truncate text-[10px] font-[700] uppercase tracking-[0.12em] text-[var(--ink-3)]">
										{t('account.signed_in_as')}
									</p>
									<p className="m-0 mt-0.5 truncate text-[12.5px] font-[700] tracking-[-0.008em] text-[var(--ink)]">
										{email}
									</p>
								</div>
							</div>

							<nav className="flex flex-col gap-0.5 rounded-[18px] bg-[var(--surface)] p-1.5" style={{ boxShadow: 'var(--shadow-2)' }}>
								{NAV_ITEMS.map((item) => {
									const isActive = active === item.section;
									return (
										<Link
											key={item.section}
											href={item.href}
											className={`inline-flex items-center gap-3 rounded-[10px] px-3.5 py-[11px] text-[14px] font-[600] tracking-[-0.008em] transition-colors duration-150 ${
												isActive
													? 'bg-[var(--ink)] font-[700] text-white'
													: 'text-[var(--ink-2)] hover:bg-[var(--bg-2)]'
											}`}
										>
											<Icon icon={item.icon} width={16} className="shrink-0" />
											{t(item.labelKey)}
										</Link>
									);
								})}
							</nav>

							<button
								type="button"
								onClick={handleSignOut}
								disabled={signingOut}
								className="inline-flex items-center gap-2.5 rounded-[10px] px-3.5 py-2.5 text-[13px] font-[600] tracking-[-0.005em] text-[var(--ink-2)] transition-colors duration-150 hover:bg-[var(--bg-2)] disabled:opacity-60"
							>
								<Icon icon="mdi:logout" width={14} />
								{t('auth.sign_out')}
							</button>
						</div>
					</aside>

					{/* Content */}
					<section className="min-w-0">{children}</section>
				</div>

				{/* Mobile sign-out (bottom) */}
				<div className="mt-10 flex justify-center md:hidden">
					<button
						type="button"
						onClick={handleSignOut}
						disabled={signingOut}
						className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-2)] px-5 py-2.5 text-[13px] font-[600] tracking-[-0.005em] text-[var(--ink-2)] transition-colors duration-150 hover:bg-[var(--bg-3)] disabled:opacity-60"
					>
						<Icon icon="mdi:logout" width={13} />
						{t('auth.sign_out')}
					</button>
				</div>
			</div>
		</>
	);
}
