import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';

interface AppHeaderProps {
	organizerName: string;
	logoUrl?: string | null;
	cartQuantity?: number;
	cartTotal?: number;
	currency?: string;
	onCartClick?: () => void;
}

const NAV_LINKS = [
	{ label: 'Bilete', id: 'tickets' },
	{ label: 'Despre', id: 'about' },
	{ label: 'Info', id: 'info' },
];

export default function AppHeader({ organizerName, logoUrl, cartQuantity, cartTotal, currency, onCartClick }: AppHeaderProps) {
	const hasCart = (cartQuantity ?? 0) > 0;
	const [mobileOpen, setMobileOpen] = useState(false);

	const scrollTo = (id: string) => {
		setMobileOpen(false);
		const el = document.getElementById(id);
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'start' });
		} else {
			window.location.href = '/';
		}
	};

	return (
		<>
			<header className="sticky top-0 z-50 border-b border-[color-mix(in_srgb,var(--theme-text)_6%,transparent)] bg-[var(--theme-bg)]/95 backdrop-blur-md">
				<div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
					{/* Logo or name */}
					<Link href="/" className="flex shrink-0 items-center">
						{logoUrl ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img src={logoUrl} alt={organizerName} className="h-9 w-auto max-w-[160px] rounded-sm object-contain" />
						) : (
							<span className="font-[family-name:var(--font-display)] text-[0.9375rem] font-[800] tracking-tight text-[var(--theme-text)]">
								{organizerName}
							</span>
						)}
					</Link>

					{/* Center nav links — desktop only */}
					<nav className="hidden flex-1 items-center justify-center gap-8 sm:flex">
						{NAV_LINKS.map(({ label, id }) => (
							<button
								key={id}
								onClick={() => scrollTo(id)}
								className="text-[0.8125rem] font-medium text-[var(--theme-text-muted)] transition-colors duration-200 hover:text-[var(--theme-text)]"
							>
								{label}
							</button>
						))}
					</nav>

					{/* Right — cart + hamburger */}
					<div className="ml-auto flex items-center gap-2 sm:ml-0">
						{hasCart ? (
							<button
								onClick={onCartClick}
								className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[0.8125rem] font-semibold text-[var(--theme-bg)] transition-opacity duration-200 hover:opacity-85"
								style={{ backgroundColor: 'var(--brand-primary)' }}
							>
								<Icon icon="mdi:ticket-outline" width={16} />
								<span className="font-[family-name:var(--font-data)] tabular-nums">
									{cartQuantity} · {cartTotal} {currency}
								</span>
							</button>
						) : (
							<Link
								href="/account"
								className="hidden items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--theme-text)_10%,transparent)] px-3.5 py-2 text-[0.8125rem] font-medium text-[var(--theme-text-muted)] transition-colors duration-200 hover:border-[color-mix(in_srgb,var(--theme-text)_18%,transparent)] hover:text-[var(--theme-text)] sm:inline-flex"
							>
								<Icon icon="mdi:account-circle-outline" width={16} />
								<span>Contul meu</span>
							</Link>
						)}

						{/* Hamburger — mobile only */}
						<button
							onClick={() => setMobileOpen((o) => !o)}
							className="flex h-9 w-9 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--theme-text)_10%,transparent)] text-[var(--theme-text-muted)] sm:hidden"
							aria-label={mobileOpen ? 'Închide meniu' : 'Deschide meniu'}
						>
							<Icon icon={mobileOpen ? 'mdi:close' : 'mdi:menu'} width={20} />
						</button>
					</div>
				</div>
			</header>

			{/* Mobile nav drawer */}
			{mobileOpen && (
				<div className="fixed inset-x-0 top-16 z-40 border-b border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-bg)]/98 px-4 py-3 backdrop-blur-md sm:hidden">
					<nav className="flex flex-col gap-1">
						{NAV_LINKS.map(({ label, id }) => (
							<button
								key={id}
								onClick={() => scrollTo(id)}
								className="w-full rounded-xl px-4 py-3 text-left text-[0.9375rem] font-medium text-[var(--theme-text)] transition-colors hover:bg-[var(--theme-surface)]"
							>
								{label}
							</button>
						))}
					</nav>
				</div>
			)}
		</>
	);
}
