import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import { useConsent } from '@/contexts/ConsentContext';
import type { IOrganizer } from '@/types';

interface AppFooterProps {
	organizerName?: string;
	organizerBio?: string | null;
	logoUrl?: string | null;
	socialLinks?: Record<string, string>;
	pages?: IOrganizer['pages'];
}

/** Fixed legal pages, in display order, mapped to their i18n label key. */
const LEGAL_PAGES: Array<{ pageType: string; labelKey: string }> = [
	{ pageType: 'terms', labelKey: 'footer.terms' },
	{ pageType: 'cookies', labelKey: 'footer.cookies' },
	{ pageType: 'public-rules', labelKey: 'footer.publicRules' },
	{ pageType: 'payment-regulations', labelKey: 'footer.paymentRegulations' },
];

/**
 * Payment-provider marks required in the footer per MAIB regulations.
 * Widths derive from each asset's native aspect ratio at a uniform 18px height,
 * so nothing is stretched.
 */
const PAYMENTS: Array<{ src: string; alt: string; width: number; height: number }> = [
	{ src: '/images/visa.png', alt: 'Visa', width: 55, height: 18 },
	{ src: '/images/mastercard.png', alt: 'Mastercard', width: 29, height: 18 },
	{ src: '/images/maib.png', alt: 'MAIB', width: 64, height: 18 },
	{ src: '/images/mia.svg', alt: 'MIA', width: 45, height: 18 },
];

export default function AppFooter({ organizerName, organizerBio, logoUrl, pages }: AppFooterProps) {
	const { t } = useTranslation('common');
	const { showPreferences } = useConsent();

	const publishedTypes = new Set((pages ?? []).map((p) => p.page_type));
	const legalLinks = LEGAL_PAGES.filter((p) => publishedTypes.has(p.pageType));

	const heading = 'mb-3.5 text-[11px] font-[700] uppercase tracking-[0.12em] text-[var(--ink-3)]';
	const link = 'text-[14px] tracking-[-0.005em] text-[var(--ink)] transition-colors duration-150 hover:text-[var(--ink-3)]';

	return (
		<footer className="mt-20 border-t border-[var(--line)] bg-[var(--bg)]">
			<div className="mx-auto max-w-[1200px] px-4 pb-7 pt-14 sm:px-5 md:px-8">
				<div className="grid grid-cols-1 gap-8 pb-12 md:grid-cols-[1.6fr_1fr_1fr] md:gap-14">
					{/* Organizer info */}
					<div className="flex flex-col items-start gap-4">
						{logoUrl ? (
							<Image src={logoUrl} alt={organizerName ?? ''} width={160} height={40} className="block h-10 w-auto object-contain object-left" />
						) : (
							<span className="text-[20px] font-[800] tracking-[-0.022em] text-[var(--ink)]">{organizerName}</span>
						)}
						{organizerBio && (
							<p className="m-0 max-w-[340px] text-[14px] leading-[1.55] text-[var(--ink-3)]">
								{organizerBio}
							</p>
						)}
					</div>

					{/* Legal — always rendered so the cookie-settings control stays reachable (GDPR). */}
					<div>
						<h3 className={heading}>{t('footer.legal')}</h3>
						<ul className="flex flex-col gap-2.5">
							{legalLinks.map((page) => (
								<li key={page.pageType}>
									<Link href={`/${page.pageType}`} className={link}>
										{t(page.labelKey)}
									</Link>
								</li>
							))}
							<li>
								<button type="button" onClick={showPreferences} className={`${link} cursor-pointer text-left`}>
									{t('footer.cookieSettings')}
								</button>
							</li>
						</ul>
					</div>

					{/* Contact */}
					<div>
						<h3 className={heading}>{t('footer.contact')}</h3>
						<ul className="flex flex-col gap-2.5">
							<li>
								<a href="mailto:support@tix.live" className={link}>support@tix.live</a>
							</li>
						</ul>
					</div>
				</div>

				{/* Bottom bar */}
				<div className="flex flex-col items-start gap-5 border-t border-[var(--line)] pt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
					<span className="text-[12px] text-[var(--ink-3)]">
						© {new Date().getFullYear()} {organizerName}
					</span>

					{/* Accepted payment methods (required in footer per MAIB rules) */}
					<ul className="flex flex-wrap items-center gap-x-5 gap-y-3 sm:justify-center">
						{PAYMENTS.map((p) => (
							<li key={p.src} className="flex items-center">
								<Image
									src={p.src}
									alt={p.alt}
									width={p.width}
									height={p.height}
									className="h-[18px] w-auto object-contain"
								/>
							</li>
						))}
					</ul>

					<span className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.12em] text-[var(--ink-3)]">
						Powered by{' '}
						<a
							href="https://tix.live"
							target="_blank"
							rel="noopener noreferrer"
							className="font-[700] tracking-[-0.005em] text-[var(--ink)] transition-colors duration-150 hover:text-[var(--ink-3)]"
						>
							TIX.LIVE
						</a>
					</span>
				</div>
			</div>
		</footer>
	);
}
