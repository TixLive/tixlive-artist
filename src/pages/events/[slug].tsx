import { useState, useMemo, useCallback, useRef } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { IOrganizer, IEventDetail, ICartItem } from '@/types';
import { getSite, getEvent } from '@/lib/api';
import Layout from '@/components/layout/Layout';
import EventHero from '@/components/event/EventHero';
import EventSidebar from '@/components/event/EventSidebar';
import StickyBuyBar from '@/components/event/StickyBuyBar';
import KeyFactsStrip from '@/components/event/KeyFactsStrip';
import SessionPicker from '@/components/event/SessionPicker';
import TicketTypeRow from '@/components/event/TicketTypeRow';

interface EventDetailProps {
  event: IEventDetail;
  organizer: IOrganizer;
  brandPrimary: string;
  brandAccent: string;
  eventType: string;
}

export default function EventDetailPage({ event, organizer }: EventDetailProps) {
  const { t } = useTranslation('common');
  const [activeSessionId, setActiveSessionId] = useState(
    event.sessions?.[0]?.id ?? 0
  );
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const ticketTypes = event.ticket_types ?? [];

  const isEventSoldOut = useMemo(() => {
    return ticketTypes.every((tt) => tt.remaining_capacity === 0);
  }, [ticketTypes]);

  const cartItems: ICartItem[] = useMemo(() => {
    return ticketTypes
      .filter((tt) => (quantities[tt.id] ?? 0) > 0)
      .map((tt) => ({
        ticket_type_id: tt.id,
        ticket_type_name: tt.name,
        price: tt.price,
        quantity: quantities[tt.id],
        currency: tt.currency,
      }));
  }, [ticketTypes, quantities]);

  const currency = ticketTypes[0]?.currency ?? event.currency ?? 'MDL';
  const ticketsRef = useRef<HTMLDivElement>(null);

  const totalQuantity = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );
  const totalPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );
  const priceFrom = useMemo(
    () => ticketTypes.length > 0 ? Math.min(...ticketTypes.map((tt) => tt.price)) : 0,
    [ticketTypes]
  );

  const scrollToTickets = useCallback(() => {
    ticketsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleQuantityChange = useCallback((ticketTypeId: number, qty: number) => {
    setQuantities((prev) => ({ ...prev, [ticketTypeId]: qty }));
  }, []);

  const handleBuy = useCallback(() => {
    if (cartItems.length === 0) return;
    // POST redirect to avoid URL length limits with large carts
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/checkout';
    form.style.display = 'none';

    const fields = {
      event: event.slug,
      session: String(activeSessionId),
      cart: JSON.stringify(cartItems),
    };

    for (const [key, value] of Object.entries(fields)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
  }, [cartItems, event.slug, activeSessionId]);

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    startDate: event.date_start,
    ...(event.poster_url && { image: event.poster_url }),
    ...(event.description && { description: event.description }),
    location: {
      '@type': 'Place',
      name: event.venue_name || '',
      ...(event.venue_address && {
        address: {
          '@type': 'PostalAddress',
          streetAddress: event.venue_address,
        },
      }),
    },
    offers: ticketTypes.map((tt) => ({
      '@type': 'Offer',
      name: tt.name,
      price: tt.price,
      priceCurrency: tt.currency,
      availability:
        tt.remaining_capacity === 0
          ? 'https://schema.org/SoldOut'
          : 'https://schema.org/InStock',
    })),
  };

  return (
    <>
      <Head>
        <title>{event.title} — {organizer.name}</title>
        <meta property="og:title" content={event.title} />
        <meta property="og:description" content={event.description || `Get tickets for ${event.title}`} />
        {event.poster_url && <meta property="og:image" content={event.poster_url} />}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <Layout
        organizerName={organizer.name}
        logoUrl={organizer.logo_url}
        socialLinks={organizer.social_links}
      >
        <EventHero event={event} />
        <KeyFactsStrip event={event} />

        {/* Two-column layout: content left, sidebar right */}
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:flex md:gap-8">
          {/* Left column — content */}
          <div className="min-w-0 flex-1">
            {/* Description */}
            {event.description && (
              <section>
                <h2 className="mb-2 font-[family-name:var(--font-display)] text-[1.5rem] font-semibold text-[var(--theme-text)]">
                  About
                </h2>
                <div className="relative">
                  <p
                    className={`text-[0.875rem] leading-relaxed text-[var(--theme-text-muted)] ${
                      !descriptionExpanded ? 'line-clamp-3' : ''
                    }`}
                  >
                    {event.description}
                  </p>
                  {!descriptionExpanded && event.description.length > 200 && (
                    <button
                      className="mt-1 text-[0.875rem] font-medium text-[var(--brand-primary)] focus-visible:ring-2 focus-visible:ring-offset-2"
                      onClick={() => setDescriptionExpanded(true)}
                    >
                      Show more
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* Tickets */}
            <section className="mt-8" ref={ticketsRef}>
              <h2 className="mb-3 font-[family-name:var(--font-display)] text-[1.5rem] font-semibold text-[var(--theme-text)]">
                Tickets
              </h2>

              {(event.sessions ?? []).length > 1 && (
                <div className="mb-4">
                  <SessionPicker
                    sessions={event.sessions ?? []}
                    activeSessionId={activeSessionId}
                    onSelect={(id) => {
                      setActiveSessionId(id);
                      setQuantities({});
                    }}
                  />
                </div>
              )}

              {!isEventSoldOut ? (
                <>
                  <div className="flex flex-col gap-2">
                    {ticketTypes.map((ticket) => (
                      <TicketTypeRow
                        key={ticket.id}
                        ticket={ticket}
                        quantity={quantities[ticket.id] ?? 0}
                        onQuantityChange={handleQuantityChange}
                      />
                    ))}
                  </div>

                  {totalQuantity > 0 && (
                    <div className="mt-4 rounded-xl border border-[color-mix(in_srgb,var(--theme-text)_15%,transparent)] bg-[var(--theme-surface)] p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-[0.875rem] text-[var(--theme-text-muted)]">
                          {totalQuantity} {totalQuantity === 1 ? 'ticket' : 'tickets'}
                        </span>
                        <span className="font-[family-name:var(--font-data)] text-[1.25rem] font-bold text-[var(--theme-text)]">
                          {totalPrice} {currency}
                        </span>
                      </div>
                      <Button
                        variant="solid"
                        size="lg"
                        className="w-full rounded-full font-[family-name:var(--font-display)] font-semibold text-white"
                        style={{ backgroundColor: 'var(--brand-primary)' }}
                        onPress={handleBuy}
                      >
                        Buy Tickets
                        <Icon icon="mdi:arrow-right" className="ml-1" width={20} />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-xl border border-[color-mix(in_srgb,var(--theme-text)_15%,transparent)] bg-[var(--theme-surface)] py-6 text-center">
                  <Icon icon="mdi:alert-circle" className="mx-auto mb-2 text-red-500" width={32} />
                  <p className="font-[family-name:var(--font-display)] text-[1rem] font-semibold text-red-600">
                    Sold Out
                  </p>
                  <p className="mt-1 text-[0.8125rem] text-[var(--theme-text-muted)]">
                    This event is no longer available
                  </p>
                </div>
              )}
            </section>

            {/* Venue */}
            {event.venue_name && (
              <section className="mt-8">
                <h2 className="mb-2 font-[family-name:var(--font-display)] text-[1.5rem] font-semibold text-[var(--theme-text)]">
                  Venue
                </h2>
                <div className="flex items-start gap-3">
                  <Icon icon="mdi:map-marker" className="mt-0.5 shrink-0 text-[var(--theme-text-muted)]" width={22} />
                  <div>
                    <p className="text-[0.875rem] font-medium text-[var(--theme-text)]">{event.venue_name}</p>
                    {event.venue_address && (
                      <p className="text-[0.75rem] text-[var(--theme-text-muted)]">{event.venue_address}</p>
                    )}
                  </div>
                </div>
                {/* Map placeholder */}
                <div className="mt-3 flex h-[200px] items-center justify-center rounded-xl bg-[var(--theme-surface)] text-[var(--theme-text-muted)]">
                  <Icon icon="mdi:map" width={40} />
                </div>
              </section>
            )}

            {/* Organizer card */}
            <section className="mb-8 mt-8">
              <h2 className="mb-3 font-[family-name:var(--font-display)] text-[1.5rem] font-semibold text-[var(--theme-text)]">
                Organizer
              </h2>
              <Link
                href="/"
                className="flex items-center gap-3 rounded-xl border border-[var(--theme-surface)] p-4 transition hover:bg-[var(--theme-surface)]"
              >
                {organizer.logo_url ? (
                  <Image
                    src={organizer.logo_url}
                    alt={organizer.name}
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--theme-surface)] font-[family-name:var(--font-display)] text-[1.125rem] font-bold text-[var(--theme-text-muted)]">
                    {organizer.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-[family-name:var(--font-display)] text-[0.875rem] font-semibold text-[var(--theme-text)]">
                    {organizer.name}
                  </p>
                  <p className="text-[0.75rem] text-[var(--theme-text-muted)]">View all events</p>
                </div>
              </Link>
            </section>
          </div>

          {/* Right column — sticky CTA card (desktop only) */}
          <EventSidebar
            priceFrom={priceFrom}
            currency={currency}
            event={event}
            totalQuantity={totalQuantity}
            totalPrice={totalPrice}
            onScrollToTickets={scrollToTickets}
            onBuy={handleBuy}
          />
        </div>

        {/* Mobile sticky buy bar */}
        <div className="md:hidden">
          <StickyBuyBar
            cartItems={cartItems}
            currency={currency}
            onBuy={handleBuy}
          />
        </div>

        {/* Bottom padding for mobile sticky bar */}
        {cartItems.length > 0 && <div className="h-24 md:hidden" />}
      </Layout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<EventDetailProps> = async ({ params, locale }) => {
  const slug = params?.slug as string;

  const [organizer, event] = await Promise.all([getSite(), getEvent(slug)]);

  if (!event || event.status !== 'open') {
    return { notFound: true };
  }

  return {
    props: {
      event,
      organizer,
      brandPrimary: organizer.brand_primary_color || '',
      brandAccent: organizer.brand_accent_color || '',
      eventType: event.event_type || '',
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
};
