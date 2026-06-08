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
import PastEventsSection from '@/components/landing/PastEventsSection';
import HomePageSkeleton from '@/components/landing/HomePageSkeleton';

const Home: NextPageWithLayout = function Home() {
	const { t } = useTranslation('common');
	const { organizer } = useOrganizer();
	const {
		data: upcomingData,
		isLoading: initialLoading,
		fetchNextPage,
		isFetchingNextPage,
		hasNextPage,
		isError,
	} = useGetEvents({ timeframe: 'upcoming' });
	const { data: pastData } = useGetEvents({ timeframe: 'past' });

	const [category, setCategory] = useState<Category>('All');

	const upcoming = useMemo(() => upcomingData?.pages.flatMap((p) => p.data) ?? [], [upcomingData]);
	const past = useMemo(() => pastData?.pages.flatMap((p) => p.data) ?? [], [pastData]);

	const availableTypes = useMemo(() => {
		const seen = new Set<string>();
		for (const e of [...upcoming, ...past]) if (e.event_type) seen.add(e.event_type);
		return [...seen];
	}, [upcoming, past]);

	const filteredUpcoming = useMemo(() => {
		if (category === 'All') return upcoming;
		return upcoming.filter((e) => e.event_type?.toLowerCase() === category.toLowerCase());
	}, [upcoming, category]);

	const filteredPast = useMemo(() => {
		if (category === 'All') return past;
		return past.filter((e) => e.event_type?.toLowerCase() === category.toLowerCase());
	}, [past, category]);

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
					<HeroCarousel events={upcoming} />
					<CategoryFilter active={category} onChange={setCategory} availableTypes={availableTypes} />
					<section className="py-10 md:py-12">
						<EventGrid
							events={filteredUpcoming}
							total={filteredUpcoming.length}
							onLoadMore={handleLoadMore}
							hasNextPage={category === 'All' ? hasNextPage : false}
							loading={isFetchingNextPage}
							isError={isError}
							organizerBio={organizer?.bio ?? undefined}
							categoryLabel={category}
						/>
						<PastEventsSection events={filteredPast} />
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
