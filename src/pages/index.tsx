import { useState, useMemo, useCallback, useEffect } from 'react';
import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import { IEventListItem } from '@/types';
import { directGetEvents } from '@/lib/directApi';
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
	const [events, setEvents] = useState<IEventListItem[]>([]);
	const [total, setTotal] = useState(0);
	const [category, setCategory] = useState<Category>('All');
	const [loadingMore, setLoadingMore] = useState(false);
	const [initialLoading, setInitialLoading] = useState(true);

	useEffect(() => {
		directGetEvents()
			.then((data) => { setEvents(data.events); setTotal(data.total); })
			.catch(() => {})
			.finally(() => setInitialLoading(false));
	}, []);

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

	const handleLoadMore = useCallback(async () => {
		setLoadingMore(true);
		try {
			const data = await directGetEvents(events.length);
			if (data.events) {
				setEvents((prev) => [...prev, ...data.events]);
				setTotal(data.total ?? total);
			}
		} catch {
			// silent
		} finally {
			setLoadingMore(false);
		}
	}, [events.length, total]);

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
							loading={loadingMore}
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