import { useState, useMemo } from 'react';
import Head from 'next/head';
import { useGetEvents } from '@/queries/events/useGetEvents';
import { useOrganizer } from '@/contexts/OrganizerContext';
import Layout from '@/components/layout/Layout';
import type { NextPageWithLayout } from '@/pages/_app';
import HeroCarousel from '@/components/landing/HeroCarousel';
import CategoryFilter, { Category } from '@/components/landing/CategoryFilter';
import EventGrid from '@/components/landing/EventGrid';
import HomePageSkeleton from '@/components/landing/HomePageSkeleton';

const Home: NextPageWithLayout = function Home() {
	const { organizer } = useOrganizer();
	const {
		data,
		isLoading: initialLoading,
		fetchNextPage,
		isFetchingNextPage,
		hasNextPage,
	} = useGetEvents();

	const [category, setCategory] = useState<Category>('All');

	const events = useMemo(() => data?.pages.flatMap((p) => p.events) ?? [], [data]);
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
				<title>{organizer ? `${organizer.name} — Events` : 'Events'}</title>
				{organizer && <>
					<meta property="og:title" content={`${organizer.name} — Events`} />
					<meta property="og:description" content={organizer.bio || `Events by ${organizer.name}`} />
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
							loading={isFetchingNextPage}
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

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '@/i18n.config';

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: await serverSideTranslations(locale ?? 'ro', ['common'], nextI18NextConfig),
});
