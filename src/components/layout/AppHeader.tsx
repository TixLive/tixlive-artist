import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { Icon } from '@iconify/react';
import { useOrganizer } from '@/contexts/OrganizerContext';
import { useLayout } from '@/contexts/LayoutContext';

const LOCALE_LABELS: Record<string, { flag: string; name: string }> = {
	en: { flag: '🇬🇧', name: 'English' },
	ro: { flag: '🇲🇩', name: 'Română' },
	ru: { flag: '🇷🇺', name: 'Русский' },
};

export default function AppHeader() {
	const { t } = useTranslation('common');
	const { organizer } = useOrganizer();
	const { cart } = useLayout();

	const organizerName = organizer?.name ?? '';
	const logoUrl = organizer?.logo_url;
	const hasCart = (cart?.cartQuantity ?? 0) > 0;

	return (
		<header
			className="sticky top-0 z-50 border-b border-[var(--line)]"
			style={{
				background: 'rgba(255,255,255,0.85)',
				backdropFilter: 'saturate(180%) blur(20px)',
				WebkitBackdropFilter: 'saturate(180%) blur(20px)',
			}}
		>
			<div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-4 sm:px-5 md:px-8">
				{/* Logo */}
				<Link href="/" className="flex h-10 shrink-0 items-center gap-2.5">
					{logoUrl ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img src={logoUrl} alt={organizerName} className="block h-10 w-auto max-w-[180px] object-contain" />
					) : (
						<>
							<span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--ink)] text-[1.0625rem] font-[800] leading-none text-white">
								{organizerName.charAt(0)}
							</span>
							<span className="text-[1rem] font-[800] tracking-[-0.014em] text-[var(--ink)]">
								{organizerName}
							</span>
						</>
					)}
				</Link>

				{/* Right — language + cart / account */}
				<div className="flex items-center gap-1.5">
					<LanguageSwitcher />

					{hasCart ? (
						<button
							onClick={cart?.onCartClick}
							className="inline-flex items-center gap-2 rounded-full bg-[var(--ink)] py-2.5 pl-3.5 pr-4 text-[13.5px] font-[600] tracking-[-0.005em] text-white transition-colors duration-150 hover:bg-[var(--ink-2)]"
						>
							<Icon icon="mdi:ticket-outline" width={14} />
							<span className="tabular-nums">
								{cart?.cartQuantity} · {cart?.cartTotal} {cart?.currency}
							</span>
						</button>
					) : (
						<Link
							href="/account"
							className="inline-flex items-center gap-[7px] rounded-full bg-[var(--ink)] py-2.5 pl-3.5 pr-[18px] text-[13.5px] font-[600] tracking-[-0.005em] text-white transition-colors duration-150 hover:bg-[var(--ink-2)]"
							aria-label={t('header.my_account')}
						>
							<Icon icon="mdi:account-outline" width={14} />
							<span className="hidden sm:inline">{t('header.my_account')}</span>
						</Link>
					)}
				</div>
			</div>
		</header>
	);
}

function LanguageSwitcher() {
	const { i18n, t } = useTranslation('common');
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	const locales = ['en', 'ro', 'ru'];
	const current = (i18n.language || 'ro').slice(0, 2);

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
		i18n.changeLanguage(locale);
	};

	return (
		<div ref={ref} className="relative">
			<button
				onClick={() => setOpen((o) => !o)}
				className="inline-flex items-center gap-[7px] rounded-full bg-[var(--bg-2)] py-2.5 pl-3.5 pr-4 text-[13.5px] font-[600] tracking-[-0.005em] text-[var(--ink)] transition-colors duration-150 hover:bg-[var(--bg-3)]"
				aria-label={t('header.change_language')}
				aria-haspopup="listbox"
				aria-expanded={open}
			>
				<Icon icon="mdi:web" width={13} />
				<span className="hidden uppercase sm:inline">{current}</span>
				<Icon icon="mdi:chevron-down" width={11} className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
			</button>
			{open && (
				<div
					role="listbox"
					className="absolute right-0 top-[calc(100%+8px)] z-[60] min-w-[180px] animate-v2-fade-in rounded-2xl border border-[var(--line)] bg-white p-1.5 shadow-[var(--shadow-float)]"
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
									active ? 'bg-[var(--bg-2)]' : 'hover:bg-[var(--bg-2)]'
								}`}
							>
								<span className="text-[1rem] leading-none">{meta.flag}</span>
								<span className="flex-1 text-[0.8125rem] font-[600] tracking-[-0.005em] text-[var(--ink)]">{meta.name}</span>
								<span className={`text-[0.625rem] uppercase tracking-[0.1em] ${active ? 'text-[var(--ink)]' : 'text-[var(--ink-4)]'}`}>{l}</span>
								{active && <Icon icon="mdi:check" width={14} className="text-[var(--ink)]" />}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
