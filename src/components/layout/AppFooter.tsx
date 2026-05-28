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

/** The four fixed legal pages, in display order, mapped to their i18n label key. */
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

	const heading = 'mb-4 font-[family-name:var(--font-mono)] text-[0.625rem] font-[500] uppercase tracking-[0.15em] text-[color-mix(in_srgb,var(--theme-bg)_55%,transparent)]';
	const link = 'text-[color-mix(in_srgb,var(--theme-bg)_72%,transparent)] transition-colors duration-200 hover:text-[var(--theme-bg)]';

	return (
		<footer className="mt-auto bg-[var(--brand-primary)] text-[var(--theme-bg)]">
			<div className="mx-auto max-w-[1120px] px-4 py-14 sm:px-6 md:py-20">
				<div className="grid grid-cols-2 gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
					{/* Organizer info */}
					<div className="col-span-2 md:col-span-1 md:pr-6">
						<div className="flex items-center gap-3">
							{logoUrl && (
								<span className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--theme-bg)] px-1.5">
									<Image src={logoUrl} alt={organizerName ?? ''} width={120} height={84} className="h-7 w-auto object-contain" />
								</span>
							)}
							<span className="truncate font-[family-name:var(--font-display)] text-[1.0625rem] font-[700] tracking-[-0.01em] text-[var(--theme-bg)]">
								{organizerName}
							</span>
						</div>
						{organizerBio && (
							<p className="mt-3 max-w-xs text-[0.8125rem] leading-relaxed text-[color-mix(in_srgb,var(--theme-bg)_65%,transparent)]">
								{organizerBio}
							</p>
						)}
					</div>

					{/* Legal — only pages the organizer has actually published */}
					{legalLinks.length > 0 && (
						<div>
							<h3 className={heading}>{t('footer.legal')}</h3>
							<ul className="space-y-3 text-[0.8125rem]">
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
						<ul className="space-y-3 text-[0.8125rem]">
							<li>
								<a href="mailto:support@tix.live" className={link}>support@tix.live</a>
							</li>
						</ul>
					</div>
				</div>
			</div>

			{/* Bottom bar */}
			<div className="border-t border-[color-mix(in_srgb,var(--theme-bg)_14%,transparent)]">
				<div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-2 px-4 py-5 sm:px-6">
					<p className="text-[0.75rem] text-[color-mix(in_srgb,var(--theme-bg)_55%,transparent)]">
						© {new Date().getFullYear()} {organizerName}
					</p>
					<p className="font-[family-name:var(--font-mono)] text-[0.6875rem] uppercase tracking-[0.1em] text-[color-mix(in_srgb,var(--theme-bg)_55%,transparent)]">
						Powered by{' '}
						<a
							href="https://tix.live"
							target="_blank"
							rel="noopener noreferrer"
							className="font-[family-name:var(--font-display)] font-[700] normal-case tracking-normal text-[var(--theme-bg)] transition-colors duration-200 hover:text-[var(--brand-accent)]"
						>
							TIX LIVE
						</a>
					</p>
				</div>
			</div>
		</footer>
	);
}
