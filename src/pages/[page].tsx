import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { sanitizeHtml } from '@/lib/sanitize';
import { useTranslation } from 'next-i18next';
import { IOrganizerPage } from '@/types';
import { directGetPage } from '@/lib/directApi';
import { useOrganizer } from '@/contexts/OrganizerContext';
import Layout from '@/components/layout/Layout';
import type { NextPageWithLayout } from '@/pages/_app';

const PAGE_SLUGS = ['terms', 'cookies', 'public-rules', 'payment-regulations'] as const;
type PageSlug = (typeof PAGE_SLUGS)[number];

const I18N_KEY: Record<PageSlug, string> = {
	terms: 'terms',
	cookies: 'cookies',
	'public-rules': 'publicRules',
	'payment-regulations': 'paymentRegulations',
};

function isPageSlug(value: string): value is PageSlug {
	return (PAGE_SLUGS as readonly string[]).includes(value);
}

const LegalPage: NextPageWithLayout = function LegalPage() {
	const { t } = useTranslation('common');
	const router = useRouter();
	const { organizer } = useOrganizer();
	const slug = router.query.page as string | undefined;
	const [page, setPage] = useState<IOrganizerPage | null>(null);
	const [notFound, setNotFound] = useState(false);
	const locale = router.locale ?? 'ro';
	const fallback = 'ro';

	useEffect(() => {
		if (!slug) return;
		setPage(null);
		setNotFound(false);
		if (!isPageSlug(slug)) { setNotFound(true); return; }
		let cancelled = false;
		directGetPage(slug)
			.then((p) => {
				if (cancelled) return;
				if (!p) setNotFound(true);
				else setPage(p);
			})
			.catch(() => { if (!cancelled) setNotFound(true); });
		return () => { cancelled = true; };
	}, [slug]);

	if (notFound) return null;
	if (!page || !slug || !isPageSlug(slug)) return <div className="py-32" />;

	const title = t(`pages.${I18N_KEY[slug]}.title`);
	const content = page.content ?? {};
	const hasContent = (l: string) => !!content[l] && content[l].trim().length > 0;
	const usedLocale = hasContent(locale) ? locale : hasContent(fallback) ? fallback : Object.keys(content).find(hasContent);
	if (!usedLocale) return null;

	let sanitizedHtml: string;
	try { sanitizedHtml = sanitizeHtml(content[usedLocale]); } catch { sanitizedHtml = content[usedLocale]; }

	return (
		<>
			<Head>
				<title>{`${title} — ${organizer?.name ?? ''}`}</title>
			</Head>
			<div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
				<h1 className="mb-8 font-[family-name:var(--font-display)] text-[1.75rem] font-[800] tracking-tight text-[var(--theme-text)] md:text-[2.25rem]">
					{title}
				</h1>
				<div
					lang={usedLocale}
					className="prose-page break-words text-[0.9375rem] leading-relaxed text-[var(--theme-text-muted)]
						[&_a]:font-medium [&_a]:text-[var(--brand-accent)] [&_a]:underline [&_a]:underline-offset-2 [&_a]:transition-colors [&_a]:duration-200 hover:[&_a]:text-[var(--theme-text)]
						[&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:font-[family-name:var(--font-display)] [&_h2]:text-[1.25rem] [&_h2]:font-[700] [&_h2]:text-[var(--theme-text)]
						[&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-[family-name:var(--font-display)] [&_h3]:text-[1.0625rem] [&_h3]:font-[700] [&_h3]:text-[var(--theme-text)]
						[&_li]:mb-1.5 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-4
						[&_strong]:font-[600] [&_strong]:text-[var(--theme-text)] [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6"
					dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
				/>
			</div>
		</>
	);
};

LegalPage.getLayout = (page) => <Layout>{page}</Layout>;

export default LegalPage;

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '@/i18n.config';

export const getStaticPaths = () => ({ paths: [], fallback: true });
export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: await serverSideTranslations(locale ?? 'ro', ['common'], nextI18NextConfig),
  revalidate: 60,
});