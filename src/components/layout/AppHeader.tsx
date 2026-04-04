import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@iconify/react';

interface AppHeaderProps {
	organizerName: string;
	logoUrl?: string | null;
	cartQuantity?: number;
	cartTotal?: number;
	currency?: string;
	onCartClick?: () => void;
}

export default function AppHeader({ organizerName, logoUrl, cartQuantity, cartTotal, currency, onCartClick }: AppHeaderProps) {
	const hasCart = (cartQuantity ?? 0) > 0;

	const scrollTo = (id: string) => {
		const el = document.getElementById(id);
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	};

	return (
		<header className="sticky top-0 z-50 border-b border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-bg)]">
			<div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-6">
				{/* Logo + name */}
				<Link href="/" className="flex shrink-0 items-center gap-2.5">
					{logoUrl ? (
						<Image src={logoUrl} alt={organizerName} width={32} height={32} className="rounded-lg" />
					) : null}
					<span className="font-[family-name:var(--font-display)] text-[0.9375rem] font-bold text-[var(--theme-text)]">
						{organizerName}
					</span>
				</Link>

				{/* Center nav links — desktop only */}
				<nav className="hidden flex-1 items-center justify-center gap-6 sm:flex">
					<button onClick={() => scrollTo('tickets')} className="text-[0.875rem] font-medium text-[var(--theme-text-muted)] transition-colors hover:text-[var(--theme-text)]">
						Bilete
					</button>
					<button onClick={() => scrollTo('about')} className="text-[0.875rem] font-medium text-[var(--theme-text-muted)] transition-colors hover:text-[var(--theme-text)]">
						Despre
					</button>
					<button onClick={() => scrollTo('info')} className="text-[0.875rem] font-medium text-[var(--theme-text-muted)] transition-colors hover:text-[var(--theme-text)]">
						Info
					</button>
				</nav>

				{/* Right — cart only */}
				<div className="ml-auto sm:ml-0">
					{hasCart ? (
						<button
							onClick={onCartClick}
							className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[0.8125rem] font-semibold text-white transition-opacity hover:opacity-90"
							style={{ backgroundColor: 'var(--brand-primary)' }}
						>
							<Icon icon="mdi:ticket-outline" width={16} />
							<span className="font-[family-name:var(--font-data)] tabular-nums">
								{cartQuantity} · {cartTotal} {currency}
							</span>
						</button>
					) : (
						<Link
							href="/my-tickets"
							className="inline-flex items-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--theme-text)_12%,transparent)] px-3.5 py-1.5 text-[0.8125rem] font-medium text-[var(--theme-text-muted)] transition-colors hover:border-[color-mix(in_srgb,var(--theme-text)_20%,transparent)] hover:text-[var(--theme-text)]"
						>
							<Icon icon="mdi:ticket-outline" width={16} />
							<span className="hidden sm:inline">My Tickets</span>
						</Link>
					)}
				</div>
			</div>
		</header>
	);
}
