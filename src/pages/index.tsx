import { useState, useMemo, useCallback } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { IOrganizer, IEventListItem } from '@/types';
import { getSite, getEvents } from '@/lib/api';
import Layout from '@/components/layout/Layout';
import HeroCarousel from '@/components/landing/HeroCarousel';
import CategoryFilter, { Category } from '@/components/landing/CategoryFilter';
import EventGrid from '@/components/landing/EventGrid';
import OrganizerIdentityBar from '@/components/landing/OrganizerIdentityBar';

interface HomeProps {
  organizer: IOrganizer;
  events: IEventListItem[];
  total: number;
  brandPrimary: string;
  brandAccent: string;
}

export default function Home({ organizer, events: initialEvents, total: initialTotal, brandPrimary, brandAccent }: HomeProps) {
  const { t } = useTranslation('common');
  const [events, setEvents] = useState(initialEvents);
  const [total, setTotal] = useState(initialTotal);
  const [category, setCategory] = useState<Category>('All');
  const [loadingMore, setLoadingMore] = useState(false);

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
      const res = await fetch(`/api/events?offset=${events.length}`);
      const data = await res.json();
      if (data.events) {
        setEvents((prev) => [...prev, ...data.events]);
        setTotal(data.total ?? total);
      }
    } catch {
      // Handle error silently
    } finally {
      setLoadingMore(false);
    }
  }, [events.length, total]);

  return (
    <>
      <Head>
        <title>{organizer.name} — Events</title>
        <meta property="og:title" content={`${organizer.name} — Events`} />
        <meta property="og:description" content={organizer.bio || `Events by ${organizer.name}`} />
        {organizer.logo_url && <meta property="og:image" content={organizer.logo_url} />}
      </Head>

      <Layout
        organizerName={organizer.name}
        logoUrl={organizer.logo_url}
        socialLinks={organizer.social_links}
      >
        <HeroCarousel events={events} />
        <OrganizerIdentityBar organizer={organizer} eventCount={total} />
        <CategoryFilter active={category} onChange={setCategory} />
        <section className="py-6">
          <EventGrid
            events={filteredEvents}
            total={filteredTotal}
            onLoadMore={handleLoadMore}
            loading={loadingMore}
            organizerBio={organizer.bio ?? undefined}
            categoryLabel={category}
          />
        </section>
      </Layout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<HomeProps> = async ({ locale }) => {
  const [organizer, eventsData] = await Promise.all([getSite(), getEvents()]);

  return {
    props: {
      organizer,
      events: eventsData.events,
      total: eventsData.total,
      brandPrimary: organizer.brand_primary_color || '',
      brandAccent: organizer.brand_accent_color || '',
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
};
