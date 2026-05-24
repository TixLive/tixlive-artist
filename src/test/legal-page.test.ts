import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GetServerSidePropsContext } from 'next';

// Mock heavy / browser-coupled deps so importing the page module is safe in node env.
vi.mock('next/head', () => ({ default: () => null }));
vi.mock('@/components/layout/Layout', () => ({ default: () => null }));
vi.mock('next-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
vi.mock('next-i18next/serverSideTranslations', () => ({
	serverSideTranslations: vi.fn(async () => ({ _nextI18Next: {} })),
}));
vi.mock('@/i18n.config', () => ({
	default: { i18n: { defaultLocale: 'en', locales: ['en', 'ro', 'ru'] } },
}));

const getSite = vi.fn();
const getPage = vi.fn();
vi.mock('@/lib/api', () => ({
	getSite: (...a: unknown[]) => getSite(...a),
	getPage: (...a: unknown[]) => getPage(...a),
}));

// Import after mocks are registered.
import { getServerSideProps } from '@/pages/[page]';

type Ctx = Partial<GetServerSidePropsContext>;
const run = (ctx: Ctx) => getServerSideProps(ctx as GetServerSidePropsContext);

const organizerWith = (pageTypes: string[]) => ({
	id: 1,
	name: 'Org',
	slug: 'org',
	logo_url: null,
	social_links: {},
	pages: pageTypes.map((page_type) => ({ page_type, locales: ['en'] })),
});

beforeEach(() => {
	getSite.mockReset();
	getPage.mockReset();
});

describe('legal [page].tsx getServerSideProps', () => {
	it('404s for an unknown slug without hitting the API', async () => {
		const res = await run({ params: { page: 'not-a-page' }, locale: 'en' });
		expect(res).toEqual({ notFound: true });
		expect(getSite).not.toHaveBeenCalled();
		expect(getPage).not.toHaveBeenCalled();
	});

	it('404s when the page is not in organizer.pages (never calls getPage)', async () => {
		getSite.mockResolvedValue(organizerWith([])); // no published pages
		const res = await run({ params: { page: 'terms' }, locale: 'en' });
		expect(res).toEqual({ notFound: true });
		expect(getPage).not.toHaveBeenCalled();
	});

	it('404s (not 500) when getPage throws — unpublished/empty on the API', async () => {
		getSite.mockResolvedValue(organizerWith(['terms']));
		getPage.mockRejectedValue(new Error('404'));
		const res = await run({ params: { page: 'terms' }, locale: 'en' });
		expect(res).toEqual({ notFound: true });
	});

	it('404s when content is empty for every locale', async () => {
		getSite.mockResolvedValue(organizerWith(['cookies']));
		getPage.mockResolvedValue({ page_type: 'cookies', content: { en: '   ' } });
		const res = await run({ params: { page: 'cookies' }, locale: 'en' });
		expect(res).toEqual({ notFound: true });
	});

	it('renders requested locale when present', async () => {
		getSite.mockResolvedValue(organizerWith(['terms']));
		getPage.mockResolvedValue({ page_type: 'terms', content: { en: '<p>EN</p>', ro: '<p>RO</p>' } });
		const res = (await run({ params: { page: 'terms' }, locale: 'ro' })) as unknown as {
			props: Record<string, unknown>;
		};
		expect(res.props.sanitizedHtml).toBe('<p>RO</p>');
		expect(res.props.contentLocale).toBe('ro');
		expect(res.props.pageType).toBe('terms');
	});

	it('falls back to default locale, then any non-empty locale, exposing the used locale', async () => {
		getSite.mockResolvedValue(organizerWith(['public-rules']));
		// requested ru is empty, default en empty -> falls back to ro
		getPage.mockResolvedValue({ page_type: 'public-rules', content: { en: '', ru: '', ro: '<p>RO</p>' } });
		const res = (await run({ params: { page: 'public-rules' }, locale: 'ru' })) as unknown as {
			props: Record<string, unknown>;
		};
		expect(res.props.sanitizedHtml).toBe('<p>RO</p>');
		expect(res.props.contentLocale).toBe('ro');
	});
});
