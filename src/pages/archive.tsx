import { useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import { useGetEvents } from '@/queries/events/useGetEvents';
import { useGetArchiveStats } from '@/queries/events/useGetArchiveStats';
import { useOrganizer } from '@/contexts/OrganizerContext';
import Layout from '@/components/layout/Layout';
import type { NextPageWithLayout } from '@/pages/_app';
import ArchiveTimeline from '@/components/archive/ArchiveTimeline';
import LoadMore from '@/components/common/LoadMore';

const Archive: NextPageWithLayout = function Archive() {
	const { t } = useTranslation('common');
	const { organizer } = useOrganizer();
	const {
		data,
		isLoading,
		fetchNextPage,
		isFetchingNextPage,
		hasNextPage,
		isError,
	} = useGetEvents({ timeframe: 'past' });
	const { data: stats } = useGetArchiveStats();

	const past = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);

	const handleLoadMore = async () => {
		if (hasNextPage && !isFetchingNextPage) await fetchNextPage();
	};

	const title = organizer
		? t('archive.page_title', { name: organizer.name })
		: t('archive.page_title_fallback');

	return (
		<>
			<Head>
				<title>{title}</title>
				<meta name="robots" content="noindex" />
			</Head>

			{isLoading ? (
				<div className="mx-auto flex max-w-[1160px] items-center justify-center px-4 py-32">
					<Icon
						icon="mdi:loading"
						className="h-7 w-7 animate-spin text-[var(--ink-4)]"
					/>
				</div>
			) : past.length === 0 ? (
				<div className="mx-auto flex max-w-[1160px] flex-col items-center justify-center px-4 py-28 text-center">
					<div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[22px] bg-[var(--bg-2)]">
						<Icon icon="mdi:history" className="h-9 w-9 text-[var(--ink-3)]" />
					</div>
					<h1 className="text-[28px] font-[800] tracking-[-0.032em] text-[var(--ink)]">
						{t('archive.empty')}
					</h1>
					<Link
						href="/"
						className="mt-7 inline-flex items-center gap-2 font-[family-name:var(--font-mono)] text-[10.5px] font-[700] uppercase tracking-[0.12em] text-[var(--ink-3)] transition-colors hover:text-[var(--ink)]"
					>
						<Icon icon="mdi:arrow-left" width={13} />
						{t('archive.back')}
					</Link>
				</div>
			) : (
				<>
					<ArchiveTimeline events={past} stats={stats} />
					<div className="mx-auto max-w-[1160px] px-4 sm:px-5 md:px-8">
						<LoadMore
							hasNextPage={hasNextPage ?? false}
							isFetching={isFetchingNextPage}
							isError={isError}
							onLoadMore={handleLoadMore}
							label={t('archive.load_more')}
						/>
						<Link
							href="/"
							className="mb-12 mt-[30px] inline-flex items-center gap-2 font-[family-name:var(--font-mono)] text-[10.5px] font-[700] uppercase tracking-[0.12em] text-[var(--ink-3)] transition-colors hover:text-[var(--ink)]"
						>
							<Icon icon="mdi:arrow-left" width={13} />
							{t('archive.back')}
						</Link>
					</div>
				</>
			)}
		</>
	);
};

Archive.getLayout = (page) => <Layout>{page}</Layout>;

export default Archive;

import { staticI18nProps } from '@/lib/staticI18n';

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
	props: staticI18nProps(locale),
});
