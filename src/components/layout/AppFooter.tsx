import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';
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

export default function AppFooter({ organizerName, organizerBio, logoUrl, pages }: AppFooterProps) {
	const { t } = useTranslation('common');

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

					{/* Legal */}
					{legalLinks.length > 0 && (
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
							</ul>
						</div>
					)}

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
				<div className="flex flex-col items-start justify-between gap-3 border-t border-[var(--line)] pt-6 sm:flex-row sm:items-center">
					<span className="text-[12px] text-[var(--ink-3)]">
						© {new Date().getFullYear()} {organizerName}
					</span>
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
