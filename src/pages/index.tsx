import { useState, useMemo } from 'react';
import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import { useGetEvents } from '@/queries/events/useGetEvents';
import { useOrganizer } from '@/contexts/OrganizerContext';
import Layout from '@/components/layout/Layout';
import type { NextPageWithLayout } from '@/pages/_app';
import HeroCarousel from '@/components/landing/HeroCarousel';
import CategoryFilter, { Category } from '@/components/landing/CategoryFilter';
import EventGrid from '@/components/landing/EventGrid';
import HomePageSkeleton from '@/components/landing/HomePageSkeleton';

const Home: NextPageWithLayout = function Home() {
	const { t } = useTranslation('common');
	const { organizer } = useOrganizer();
	const {
		data,
		isLoading: initialLoading,
		fetchNextPage,
		isFetchingNextPage,
		hasNextPage,
		isError,
	} = useGetEvents();

	const [category, setCategory] = useState<Category>('All');

	const events = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);
	const total = data?.pages[0]?.total ?? 0;

	const availableTypes = useMemo(() => {
		const seen = new Set<string>();
		for (const e of events) if (e.event_type) seen.add(e.event_type);
		return [...seen];
	}, [events]);

	const filteredEvents = useMemo(() => {
		if (category === 'All') return events;
		return events.filter((e) => e.event_type?.toLowerCase() === category.toLowerCase());
	}, [events, category]);

	const filteredTotal = useMemo(() => {
		if (category === 'All') return total;
		return filteredEvents.length;
	}, [category, total, filteredEvents.length]);

	const handleLoadMore = async () => {
		if (hasNextPage && !isFetchingNextPage) await fetchNextPage();
	};

	return (
		<>
			<Head>
				<title>{organizer ? t('home.title', { name: organizer.name }) : t('home.title_fallback')}</title>
				{organizer && <>
					<meta property="og:title" content={t('home.title', { name: organizer.name })} />
					<meta property="og:description" content={organizer.bio || t('home.og_description', { name: organizer.name })} />
					{organizer.logo_url && <meta property="og:image" content={organizer.logo_url} />}
				</>}
			</Head>
			{initialLoading ? (
				<HomePageSkeleton />
			) : (
				<>
					<HeroCarousel events={events} />
					<CategoryFilter active={category} onChange={setCategory} availableTypes={availableTypes} />
					<section className="py-10 md:py-12">
						<EventGrid
							events={filteredEvents}
							total={filteredTotal}
							onLoadMore={handleLoadMore}
							hasNextPage={category === 'All' ? hasNextPage : false}
							loading={isFetchingNextPage}
							isError={isError}
							organizerBio={organizer?.bio ?? undefined}
							categoryLabel={category}
						/>
					</section>
				</>
			)}
		</>
	);
};

Home.getLayout = (page) => <Layout>{page}</Layout>;

export default Home;

import { staticI18nProps } from '@/lib/staticI18n';

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: staticI18nProps(locale),
});
