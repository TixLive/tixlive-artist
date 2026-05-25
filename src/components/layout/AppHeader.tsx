import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Icon } from '@iconify/react';

interface AppHeaderProps {
	organizerName: string;
	logoUrl?: string | null;
	cartQuantity?: number;
	cartTotal?: number;
	currency?: string;
	onCartClick?: () => void;
}

const LOCALE_LABELS: Record<string, { flag: string; name: string }> = {
	en: { flag: '🇬🇧', name: 'English' },
	ro: { flag: '🇲🇩', name: 'Română' },
	ru: { flag: '🇷🇺', name: 'Русский' },
};

export default function AppHeader({ organizerName, logoUrl, cartQuantity, cartTotal, currency, onCartClick }: AppHeaderProps) {
	const hasCart = (cartQuantity ?? 0) > 0;

	return (
		<header className="sticky top-0 z-50 border-b border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-bg)]/95 backdrop-blur-md">
			<div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-4 sm:px-6">
				{/* Logo / mark */}
				<Link href="/" className="flex shrink-0 items-center gap-2.5">
					{logoUrl ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img src={logoUrl} alt={organizerName} className="h-9 w-auto max-w-[160px] rounded-md object-contain" />
					) : (
						<>
							<span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-primary)] font-[family-name:var(--font-display)] text-[1.0625rem] font-[800] leading-none text-[var(--theme-bg)]">
								{organizerName.charAt(0)}
							</span>
							<span className="font-[family-name:var(--font-display)] text-[1rem] font-[800] tracking-[-0.01em] text-[var(--theme-text)]">
								{organizerName}
							</span>
						</>
					)}
				</Link>

				{/* Right — language + cart / account */}
				<div className="flex items-center gap-2">
					<LanguageSwitcher />

					{hasCart ? (
						<button
							onClick={onCartClick}
							className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.8125rem] font-[600] text-[var(--theme-bg)] transition-opacity duration-200 hover:opacity-90"
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
							className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--theme-text)_12%,transparent)] px-3 py-2 text-[0.8125rem] font-[500] text-[var(--theme-text)] transition-colors duration-200 hover:bg-[var(--theme-surface)] sm:px-4"
							aria-label="Contul meu"
						>
							<Icon icon="mdi:account-circle-outline" width={16} />
							<span className="hidden sm:inline">Contul meu</span>
						</Link>
					)}
				</div>
			</div>
		</header>
	);
}

function LanguageSwitcher() {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	const locales = router.locales ?? ['en', 'ro', 'ru'];
	const current = router.locale ?? router.defaultLocale ?? 'ro';

	useEffect(() => {
		if (!open) return;
		const onDoc = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener('mousedown', onDoc);
		return () => document.removeEventListener('mousedown', onDoc);
	}, [open]);

	const change = (locale: string) => {
		setOpen(false);
		document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
		router.push({ pathname: router.pathname, query: router.query }, router.asPath, { locale });
	};

	return (
		<div ref={ref} className="relative">
			<button
				onClick={() => setOpen((o) => !o)}
				className="flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--theme-text)_12%,transparent)] bg-[var(--theme-surface)] px-3 py-2 text-[var(--theme-text)] transition-colors duration-200 hover:border-[color-mix(in_srgb,var(--theme-text)_22%,transparent)]"
				aria-label="Schimbă limba"
				aria-haspopup="listbox"
				aria-expanded={open}
			>
				<Icon icon="mdi:web" width={15} className="text-[var(--theme-text-muted)]" />
				<span className="font-[family-name:var(--font-mono)] text-[0.6875rem] uppercase tracking-[0.1em]">{current}</span>
				<Icon icon="mdi:chevron-down" width={14} className={`text-[var(--theme-text-muted)] transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
			</button>
			{open && (
				<div
					role="listbox"
					className="absolute right-0 top-[calc(100%+6px)] z-[60] min-w-[180px] animate-v2-fade-in rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-1.5 shadow-[0_12px_32px_rgba(20,19,18,0.18)]"
				>
					{locales.map((l) => {
						const active = l === current;
						const meta = LOCALE_LABELS[l] ?? { flag: '🌐', name: l };
						return (
							<button
								key={l}
								role="option"
								aria-selected={active}
								onClick={() => change(l)}
								className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors ${
									active ? 'bg-[var(--theme-bg)]' : 'hover:bg-[var(--theme-bg)]'
								}`}
							>
								<span className="text-[1rem] leading-none">{meta.flag}</span>
								<span className="flex-1 font-[family-name:var(--font-body)] text-[0.8125rem] font-[600] text-[var(--theme-text)]">{meta.name}</span>
								<span className={`font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.1em] ${active ? 'text-[var(--brand-accent)]' : 'text-[var(--theme-text-muted)]'}`}>{l}</span>
								{active && <Icon icon="mdi:check" width={14} className="text-[var(--brand-accent)]" />}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
