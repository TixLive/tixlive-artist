import { useState, useMemo, useCallback, useRef } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { IOrganizer, IEventDetail, ICartItem, ITicketAddon } from '@/types';
import { getSite, getEvent } from '@/lib/api';
import Layout from '@/components/layout/Layout';
import EventHero from '@/components/event/EventHero';
import EventSidebar from '@/components/event/EventSidebar';
import StickyBuyBar from '@/components/event/StickyBuyBar';
import KeyFactsStrip from '@/components/event/KeyFactsStrip';
import SessionPicker from '@/components/event/SessionPicker';
import TicketTypeRow from '@/components/event/TicketTypeRow';
import AddonRow from '@/components/event/AddonRow';
import AddressMap from '@/components/common/AddressMap';
import LineupSection from '@/components/event/sections/LineupSection';
import TeamsSection from '@/components/event/sections/TeamsSection';
import SpeakersSection from '@/components/event/sections/SpeakersSection';
import SponsorsSection from '@/components/event/sections/SponsorsSection';
import ProgramSection from '@/components/event/sections/ProgramSection';
import RulesSection from '@/components/event/sections/RulesSection';
import FaqSection from '@/components/event/sections/FaqSection';
import TravelSection from '@/components/event/sections/TravelSection';
import PackingSection from '@/components/event/sections/PackingSection';
import DressCodeSection from '@/components/event/sections/DressCodeSection';
import CampingInfoSection from '@/components/event/sections/CampingInfoSection';
import SpecialMessageSection from '@/components/event/sections/SpecialMessageSection';
import VideoSection from '@/components/event/sections/VideoSection';

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
  const [addonQuantities, setAddonQuantities] = useState<Record<number, number>>({});
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const ticketTypes = event.ticket_types ?? [];
  const addons = event.ticket_addons ?? [];

  const isEventSoldOut = useMemo(() => {
    return ticketTypes.length > 0 && ticketTypes.every((tt) => tt.remaining_capacity !== null && tt.remaining_capacity === 0);
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
  const addonTotal = useMemo(() => {
    return addons.reduce((sum, addon) => {
      const qty = addonQuantities[addon.id] ?? 0;
      if (qty === 0) return sum;
      const multiplier = addon.per_ticket ? totalQuantity : 1;
      return sum + addon.price * qty * multiplier;
    }, 0);
  }, [addons, addonQuantities, totalQuantity]);

  const totalPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0) + addonTotal,
    [cartItems, addonTotal]
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

  const handleAddonQuantityChange = useCallback((addonId: number, qty: number) => {
    setAddonQuantities((prev) => ({ ...prev, [addonId]: qty }));
  }, []);

  const handleBuy = useCallback(() => {
    if (cartItems.length === 0) return;
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/checkout';
    form.style.display = 'none';

    const addonItems = addons
      .filter((a) => (addonQuantities[a.id] ?? 0) > 0)
      .map((a) => ({
        addon_id: a.id,
        addon_name: a.name,
        price: a.price,
        quantity: addonQuantities[a.id],
        per_ticket: a.per_ticket,
        currency,
      }));

    const fields = {
      event: event.slug,
      session: String(activeSessionId),
      cart: JSON.stringify(cartItems),
      ...(addonItems.length > 0 && { addons: JSON.stringify(addonItems) }),
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
  }, [cartItems, event.slug, activeSessionId, addons, addonQuantities, currency]);

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
        cartQuantity={totalQuantity}
        cartTotal={totalPrice}
        currency={currency}
        onCartClick={handleBuy}
      >
        <EventHero event={event} />
        <KeyFactsStrip event={event} />

        {/* Two-column layout: content left, sidebar right */}
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:flex md:gap-10">
          {/* Left column — content */}
          <div className="min-w-0 flex-1">
            {/* Description */}
            {event.description && (
              <section id="about">
                <h2 className="mb-3 font-[family-name:var(--font-display)] text-[1.25rem] font-[700] text-[var(--theme-text)]">
                  About Event
                </h2>
                <div className="relative">
                  <p
                    className={`text-[0.9375rem] leading-relaxed text-[var(--theme-text-muted)] ${
                      !descriptionExpanded ? 'line-clamp-3' : ''
                    }`}
                  >
                    {event.description}
                  </p>
                  {!descriptionExpanded && event.description.length > 200 && (
                    <button
                      className="mt-1.5 text-[0.875rem] font-medium text-[var(--brand-accent)] transition-colors duration-200 hover:text-[var(--theme-text)] focus-visible:ring-2 focus-visible:ring-offset-2"
                      onClick={() => setDescriptionExpanded(true)}
                    >
                      Show more
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* Tickets */}
            <section className="mt-10" id="tickets" ref={ticketsRef}>
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="font-[family-name:var(--font-display)] text-[1.25rem] font-[700] text-[var(--theme-text)]">
                  Order Tickets
                </h2>
                {priceFrom > 0 && (
                  <span className="font-[family-name:var(--font-data)] text-[0.8125rem] text-[var(--theme-text-muted)]">
                    {priceFrom} - {Math.max(...ticketTypes.map(tt => tt.price))} {currency}
                  </span>
                )}
              </div>

              {(event.sessions ?? []).length > 1 && (
                <div className="mb-4 mt-3">
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
                  <div className="mt-3 flex flex-col gap-3">
                    {ticketTypes.map((ticket) => (
                      <TicketTypeRow
                        key={ticket.id}
                        ticket={ticket}
                        quantity={quantities[ticket.id] ?? 0}
                        onQuantityChange={handleQuantityChange}
                      />
                    ))}
                  </div>

                  {/* Cart summary */}
                  {totalQuantity > 0 && (
                    <div className="mt-5 rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-5">
                      <div className="space-y-2 text-[0.8125rem]">
                        {cartItems.map(item => (
                          <div key={item.ticket_type_id} className="flex items-center justify-between">
                            <span className="text-[var(--theme-text)]">
                              {item.quantity} {item.ticket_type_name}
                            </span>
                            <span className="font-[family-name:var(--font-data)] tabular-nums text-[var(--theme-text)]">
                              {item.price * item.quantity} {currency}
                            </span>
                          </div>
                        ))}
                        {addonTotal > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--theme-text-muted)]">Add-ons</span>
                            <span className="font-[family-name:var(--font-data)] tabular-nums text-[var(--theme-text-muted)]">
                              +{addonTotal} {currency}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between border-t border-[color-mix(in_srgb,var(--theme-text)_6%,transparent)] pt-3">
                          <span className="font-[family-name:var(--font-display)] font-[700] text-[var(--theme-text)]">Total</span>
                          <span className="font-[family-name:var(--font-data)] text-[1.125rem] font-bold tabular-nums text-[var(--theme-text)]">
                            {totalPrice} {currency}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="solid"
                        size="lg"
                        className="mt-4 w-full rounded-xl font-[family-name:var(--font-display)] font-[700] text-[var(--theme-bg)]"
                        style={{ backgroundColor: 'var(--brand-primary)' }}
                        onPress={handleBuy}
                      >
                        Continue to Checkout
                        <Icon icon="mdi:arrow-right" className="ml-1" width={20} />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-3 rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] py-8 text-center">
                  <Icon icon="mdi:alert-circle" className="mx-auto mb-2 text-[#DC2626]" width={32} />
                  <p className="font-[family-name:var(--font-display)] text-[1rem] font-[700] text-[#DC2626]">
                    Sold Out
                  </p>
                  <p className="mt-1 text-[0.8125rem] text-[var(--theme-text-muted)]">
                    This event is no longer available
                  </p>
                </div>
              )}
            </section>

            {/* Add-ons ("Enhance Your Experience") */}
            {addons.length > 0 && totalQuantity > 0 && (
              <section className="mt-10">
                <div className="mb-1 flex items-center gap-2">
                  <Icon icon="mdi:auto-awesome" width={20} className="text-[var(--brand-accent)]" />
                  <h2 className="font-[family-name:var(--font-display)] text-[1.25rem] font-[700] text-[var(--theme-text)]">
                    Enhance Your Experience
                  </h2>
                </div>
                <p className="mb-3 text-[0.75rem] text-[var(--theme-text-muted)]">
                  Price per ticket · Applied to all tickets in your cart.
                </p>
                <div className="flex flex-col gap-3">
                  {addons.map((addon) => (
                    <AddonRow
                      key={addon.id}
                      addon={addon}
                      quantity={addonQuantities[addon.id] ?? 0}
                      onQuantityChange={handleAddonQuantityChange}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Promo code */}
            <div className="mt-10 flex items-center gap-2">
              <Icon icon="mdi:tag-outline" width={18} className="shrink-0 text-[var(--theme-text-muted)]" />
              <input
                type="text"
                placeholder="Cod promoțional"
                className="h-10 flex-1 rounded-xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-bg)] px-3 text-[0.875rem] text-[var(--theme-text)] placeholder:text-[var(--theme-text-muted)] transition-colors duration-200 focus:border-[var(--brand-accent)] focus:outline-none"
              />
              <button className="h-10 shrink-0 rounded-xl border border-[color-mix(in_srgb,var(--theme-text)_10%,transparent)] px-4 font-[family-name:var(--font-display)] text-[0.8125rem] font-[700] text-[var(--theme-text)] transition-colors duration-200 hover:bg-[var(--theme-surface)]">
                Aplică
              </button>
            </div>

            {/* Trust indicators */}
            <div className="mt-10 flex items-start justify-between border-t border-[color-mix(in_srgb,var(--theme-text)_6%,transparent)] pt-10">
              <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
                <Icon icon="mdi:shield-check-outline" width={24} className="text-[var(--theme-text-muted)]" />
                <span className="text-[0.8125rem] font-medium text-[var(--theme-text)]">Plată securizată</span>
                <span className="text-[0.6875rem] text-[var(--theme-text-muted)]">SSL 256-bit</span>
              </div>
              <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
                <Icon icon="mdi:flash-outline" width={24} className="text-[var(--theme-text-muted)]" />
                <span className="text-[0.8125rem] font-medium text-[var(--theme-text)]">Bilet instant</span>
                <span className="text-[0.6875rem] text-[var(--theme-text-muted)]">Email & telefon</span>
              </div>
              <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
                <Icon icon="mdi:check-decagram-outline" width={24} className="text-[var(--theme-text-muted)]" />
                <span className="text-[0.8125rem] font-medium text-[var(--theme-text)]">Garanție 100%</span>
                <span className="text-[0.6875rem] text-[var(--theme-text-muted)]">Rambursare ușoară</span>
              </div>
            </div>

            {/* Event-type-specific sections */}
            {event.active_sections && event.page_content && (
              <>
                {event.active_sections.map((section) => {
                  const pc = event.page_content!;
                  switch (section) {
                    case 'lineup':
                      return pc.lineup?.length ? <LineupSection key={section} artists={pc.lineup} /> : null;
                    case 'teams':
                      return pc.teams?.length ? <TeamsSection key={section} teams={pc.teams} /> : null;
                    case 'speakers':
                      return pc.speakers?.length ? <SpeakersSection key={section} speakers={pc.speakers} /> : null;
                    case 'sponsors':
                      return pc.sponsors?.length ? <SponsorsSection key={section} sponsors={pc.sponsors} /> : null;
                    case 'program':
                      return pc.program?.length ? <ProgramSection key={section} items={pc.program} /> : null;
                    case 'rules':
                      return pc.rules?.length ? <RulesSection key={section} rules={pc.rules} /> : null;
                    case 'faq':
                      return pc.faq?.length ? <FaqSection key={section} items={pc.faq} /> : null;
                    case 'video':
                      return pc.video_url ? <VideoSection key={section} videoUrl={pc.video_url} aftermovieUrl={pc.aftermovie_url} /> : null;
                    case 'travel':
                      return pc.travel?.length ? <TravelSection key={section} recommendations={pc.travel} /> : null;
                    case 'packing':
                      return pc.packing?.length ? <PackingSection key={section} items={pc.packing} /> : null;
                    case 'dress_code':
                      return (pc.dress_code_type || pc.dress_code_recommended || pc.dress_code_forbidden)
                        ? <DressCodeSection key={section} type={pc.dress_code_type} recommended={pc.dress_code_recommended} forbidden={pc.dress_code_forbidden} />
                        : null;
                    case 'camping_info':
                      return (pc.camping_checkin || pc.camping_checkout || pc.camping_showers || pc.camping_electricity)
                        ? <CampingInfoSection key={section} checkin={pc.camping_checkin} checkout={pc.camping_checkout} showers={pc.camping_showers} electricity={pc.camping_electricity} />
                        : null;
                    case 'special_message':
                      return pc.special_message ? <SpecialMessageSection key={section} message={pc.special_message} /> : null;
                    default:
                      return null;
                  }
                })}
              </>
            )}

            {/* Venue */}
            {event.venue_name && (
              <section className="mt-10" id="info">
                <h2 className="mb-3 font-[family-name:var(--font-display)] text-[1.25rem] font-[700] text-[var(--theme-text)]">
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
                {event.google_place_id && (
                  <div className="mt-3">
                    <AddressMap googlePlaceId={event.google_place_id} />
                  </div>
                )}
              </section>
            )}

            {/* Organizer card */}
            <section className="mb-10 mt-10">
              <h2 className="mb-3 font-[family-name:var(--font-display)] text-[1.25rem] font-[700] text-[var(--theme-text)]">
                Organizer
              </h2>
              <Link
                href="/"
                className="flex items-center gap-4 rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] p-5 transition-colors duration-200 hover:bg-[var(--theme-surface)]"
              >
                {organizer.logo_url ? (
                  <Image
                    src={organizer.logo_url}
                    alt={organizer.name}
                    width={48}
                    height={48}
                    className="rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--theme-surface)] font-[family-name:var(--font-display)] text-[1.125rem] font-[800] text-[var(--theme-text-muted)]">
                    {organizer.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-[family-name:var(--font-display)] text-[0.9375rem] font-[700] text-[var(--theme-text)]">
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
