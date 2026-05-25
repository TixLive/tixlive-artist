import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { sanitizeHtml } from '@/lib/sanitize';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '@/i18n.config';
import { useTranslation } from 'next-i18next';
import { IOrganizer } from '@/types';
import { getSite, getPage } from '@/lib/api';
import Layout from '@/components/layout/Layout';

/** The four fixed legal/info page slugs (1:1 with page_type). */
const PAGE_SLUGS = ['terms', 'cookies', 'public-rules', 'payment-regulations'] as const;
type PageSlug = (typeof PAGE_SLUGS)[number];

/** Map hyphenated page_type to a camelCase i18n key segment. */
const I18N_KEY: Record<PageSlug, string> = {
	terms: 'terms',
	cookies: 'cookies',
	'public-rules': 'publicRules',
	'payment-regulations': 'paymentRegulations',
};

interface PageProps {
	organizer: IOrganizer;
	pageType: PageSlug;
	sanitizedHtml: string;
	/** Locale the rendered content is actually in (may differ from the route locale via fallback). */
	contentLocale: string;
}

export default function LegalPage({ organizer, pageType, sanitizedHtml, contentLocale }: PageProps) {
	const { t } = useTranslation('common');
	const title = t(`pages.${I18N_KEY[pageType]}.title`);

	return (
		<>
			<Head>
				<title>{`${title} — ${organizer.name}`}</title>
			</Head>

			<Layout
				organizerName={organizer.name}
				logoUrl={organizer.logo_url}
				socialLinks={organizer.social_links}
				pages={organizer.pages}
			>
				<div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
					<h1 className="mb-8 font-[family-name:var(--font-display)] text-[1.75rem] font-[800] tracking-tight text-[var(--theme-text)] md:text-[2.25rem]">
						{title}
					</h1>
					<div
						lang={contentLocale}
						className="prose-page break-words text-[0.9375rem] leading-relaxed text-[var(--theme-text-muted)]
							[&_a]:font-medium [&_a]:text-[var(--brand-accent)] [&_a]:underline [&_a]:underline-offset-2 [&_a]:transition-colors [&_a]:duration-200 hover:[&_a]:text-[var(--theme-text)]
							[&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:font-[family-name:var(--font-display)] [&_h2]:text-[1.25rem] [&_h2]:font-[700] [&_h2]:text-[var(--theme-text)]
							[&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-[family-name:var(--font-display)] [&_h3]:text-[1.0625rem] [&_h3]:font-[700] [&_h3]:text-[var(--theme-text)]
							[&_li]:mb-1.5
							[&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6
							[&_p]:mb-4
							[&_strong]:font-[600] [&_strong]:text-[var(--theme-text)]
							[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6"
						dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
					/>
				</div>
			</Layout>
		</>
	);
}

function isPageSlug(value: string): value is PageSlug {
	return (PAGE_SLUGS as readonly string[]).includes(value);
}

export const getServerSideProps: GetServerSideProps<PageProps> = async ({ params, locale }) => {
	const slug = params?.page;
	if (typeof slug !== 'string' || !isPageSlug(slug)) {
		return { notFound: true };
	}

	const fallbackLocale = nextI18NextConfig.i18n.defaultLocale;

	let organizer;
	try {
		organizer = await getSite();
	} catch {
		// Never 500 this route on a transient site fetch failure.
		return { notFound: true };
	}

	// Only published pages exist in organizer.pages; gate here so we never call
	// getPage for a page that will 404 (a thrown 404 in GSSP becomes a 500).
	const published = organizer.pages?.some((p) => p.page_type === slug);
	if (!published) {
		return { notFound: true };
	}

	let page;
	try {
		page = await getPage(slug);
	} catch {
		// besttix returns 404 for an unpublished/empty page — surface it as a 404, not a 500.
		return { notFound: true };
	}

	const content = page.content ?? {};
	const requestedLocale = locale ?? fallbackLocale;
	const hasContent = (l?: string): l is string => !!l && !!content[l] && content[l].trim().length > 0;
	// Prefer the route locale, then the default locale, then any non-empty locale.
	const usedLocale = hasContent(requestedLocale)
		? requestedLocale
		: hasContent(fallbackLocale)
			? fallbackLocale
			: Object.keys(content).find((l) => hasContent(l));
	if (!usedLocale) {
		return { notFound: true };
	}

	// Render-side sanitize is defense-in-depth — content is already sanitized on write
	// (besttix OrganizerPage.Service). If the sanitizer ever throws, fall back to the
	// stored HTML rather than 500-ing the page.
	let sanitizedHtml: string;
	try {
		sanitizedHtml = sanitizeHtml(content[usedLocale]);
	} catch {
		sanitizedHtml = content[usedLocale];
	}

	return {
		props: {
			organizer,
			pageType: slug,
			sanitizedHtml,
			contentLocale: usedLocale,
			...(await serverSideTranslations(requestedLocale, ['common'], nextI18NextConfig)),
		},
	};
};
