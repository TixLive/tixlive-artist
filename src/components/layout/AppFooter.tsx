import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import { useConsent } from '@/contexts/ConsentContext';
import { useOrganizer } from '@/contexts/OrganizerContext';

/** Fixed legal pages, in display order, mapped to their i18n label key. */
const LEGAL_PAGES: Array<{ pageType: string; labelKey: string }> = [
	{ pageType: 'terms', labelKey: 'footer.terms' },
	{ pageType: 'cookies', labelKey: 'footer.cookies' },
	{ pageType: 'public-rules', labelKey: 'footer.publicRules' },
	{ pageType: 'payment-regulations', labelKey: 'footer.paymentRegulations' },
];

type PaymentMark = { src: string; alt: string; width: number; height: number };

/** Brand marks of each payment provider, at a uniform 18px height (widths derive from native aspect ratio). */
const VISA: PaymentMark = { src: '/images/visa.png', alt: 'Visa', width: 55, height: 18 };
const MASTERCARD: PaymentMark = { src: '/images/mastercard.png', alt: 'Mastercard', width: 29, height: 18 };
const MAIB: PaymentMark = { src: '/images/maib.png', alt: 'MAIB', width: 64, height: 18 };
const MIA: PaymentMark = { src: '/images/mia.svg', alt: 'MIA', width: 45, height: 18 };
const NETOPIA: PaymentMark = { src: '/images/netopia.svg', alt: 'NETOPIA', width: 145, height: 26 };

/**
 * Which brand marks to show per connected payment method. Keyed by the method name
 * (uppercased) as returned by `/api/public/site`. Methods absent from this map render
 * no marks. The footer shows the de-duplicated union across all of the organizer's methods.
 */
const PAYMENT_MARKS: Record<string, PaymentMark[]> = {
	MAIB: [VISA, MASTERCARD, MAIB, MIA],
	NETOPIA: [NETOPIA],
};

/**
 * Consumer-protection marks required on Romanian e-commerce footers (ANPC).
 * SOL → EU online dispute-resolution platform; SAL → ANPC alternative dispute resolution.
 */
const ANPC_BANNERS: Array<{ src: string; alt: string; href: string }> = [
	{ src: '/images/anpc-sol-1.webp', alt: 'ANPC — Soluționarea Online a Litigiilor (SOL)', href: 'https://ec.europa.eu/consumers/odr' },
	{ src: '/images/anpc-sal-1.webp', alt: 'ANPC — Soluționarea Alternativă a Litigiilor (SAL)', href: 'https://anpc.ro/ce-este-sal/' },
];

/** De-duplicated union of brand marks across the organizer's connected payment methods, in display order. */
function resolvePaymentMarks(methods: string[] | undefined): PaymentMark[] {
	const seen = new Set<string>();
	const marks: PaymentMark[] = [];
	for (const name of methods ?? []) {
		for (const mark of PAYMENT_MARKS[name.toUpperCase()] ?? []) {
			if (seen.has(mark.src)) continue;
			seen.add(mark.src);
			marks.push(mark);
		}
	}
	return marks;
}

export default function AppFooter() {
	const { t } = useTranslation('common');
	const { showPreferences } = useConsent();
	const { organizer } = useOrganizer();

	const organizerName = organizer?.name ?? '';
	// Copyright credits the registered legal entity; fall back to the display name when unset.
	const copyrightName = organizer?.legal_name || organizerName;
	const organizerBio = organizer?.bio;
	const logoUrl = organizer?.logo_url;

	const publishedTypes = new Set((organizer?.pages ?? []).map((p) => p.page_type));
	const legalLinks = LEGAL_PAGES.filter((p) => publishedTypes.has(p.pageType));

	const paymentMarks = resolvePaymentMarks(organizer?.payment_methods);
	const showAnpc = (organizer?.country_code ?? '').toUpperCase() === 'RO';

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
							{/* Romanian consumer-protection authority — required link for RO e-commerce (ANPC). */}
							{showAnpc && (
								<li>
									<a href="https://anpc.ro" target="_blank" rel="noopener noreferrer" className={link}>
										ANPC
									</a>
								</li>
							)}
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

				{/* Bottom area */}
				<div className="flex flex-col gap-6 border-t border-[var(--line)] pt-6">
					{/* Accepted payment marks + country compliance marks (ANPC for RO) */}
					{(paymentMarks.length > 0 || showAnpc) && (
						<div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
							{paymentMarks.length > 0 && (
								<ul className="flex flex-wrap items-center gap-x-5 gap-y-3">
									{paymentMarks.map((p) => (
										<li key={p.src} className="flex items-center">
											<Image
												src={p.src}
												alt={p.alt}
												width={p.width}
												height={p.height}
												style={{ height: p.height, width: 'auto' }}
												className="object-contain"
											/>
										</li>
									))}
								</ul>
							)}

							{showAnpc && (
								<ul className="flex flex-wrap items-center gap-3">
									{ANPC_BANNERS.map((b) => (
										<li key={b.src} className="flex items-center">
											<a
												href={b.href}
												target="_blank"
												rel="noopener noreferrer"
												aria-label={b.alt}
												className="block transition-opacity duration-150 hover:opacity-70"
											>
												<Image src={b.src} alt={b.alt} width={159} height={40} className="h-10 w-auto object-contain" />
											</a>
										</li>
									))}
								</ul>
							)}
						</div>
					)}

					{/* Credit row */}
					<div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
						<span className="text-[12px] text-[var(--ink-3)]">
							© {new Date().getFullYear()} {copyrightName}
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
			</div>
		</footer>
	);
}
