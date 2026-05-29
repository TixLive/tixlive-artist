import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { ICartItem } from '@/types';
import { useGetEvent } from '@/queries/events/useGetEvent';
import { useOrganizer } from '@/contexts/OrganizerContext';
import { useHeaderCart } from '@/contexts/LayoutContext';
import Layout from '@/components/layout/Layout';
import type { NextPageWithLayout } from '@/pages/_app';
import EventHero from '@/components/event/EventHero';
import StickyCTABar from '@/components/event/StickyCTABar';
import PoliciesBlock from '@/components/event/PoliciesBlock';
import KeyFactsStrip from '@/components/event/KeyFactsStrip';
import SectionShell from '@/components/event/sections/SectionShell';
import EventCountdown from '@/components/event/EventCountdown';
import SessionPicker from '@/components/event/SessionPicker';
import TicketTypeRow from '@/components/event/TicketTypeRow';
import AddonRow from '@/components/event/AddonRow';
import AddressMap from '@/components/common/AddressMap';
import TicketAvailabilityNotice, { TicketAvailabilityVariant } from '@/components/event/TicketAvailabilityNotice';
import EventPageSkeleton from '@/components/event/EventPageSkeleton';
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

const EventDetailPage: NextPageWithLayout = function EventDetailPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  // Static export: router.query.slug is '_' (shell placeholder); read real slug from URL
  const [slug, setSlug] = useState<string | undefined>(undefined);
  const { organizer } = useOrganizer();

  useEffect(() => {
    const q = router.query.slug as string | undefined;
    if (q && q !== '_') { setSlug(q); return; }
    const parts = window.location.pathname.split('/').filter(Boolean);
    setSlug(parts[1] ? decodeURIComponent(parts[1]) : undefined); // /events/:slug
  }, [router.query.slug]);

  const { data: event, isFetching } = useGetEvent({ slug });
  const notFound = !!slug && !isFetching && event === null;

  const [activeSessionId, setActiveSessionId] = useState(0);
  useEffect(() => {
    if (event) setActiveSessionId(event.sessions?.[0]?.id ?? 0);
  }, [event]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [addonQuantities, setAddonQuantities] = useState<Record<number, number>>({});
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  // Derived state — safe with null event (empty arrays/false until loaded)
  const ticketTypes = event?.ticket_types ?? [];
  const addons = event?.ticket_addons ?? [];
  const isSeated = !!event?.is_seated;
  const salesOpen = event?.status === 'open';

  const isEventSoldOut = useMemo(() => {
    return ticketTypes.length > 0 && ticketTypes.every((tt) => tt.remaining_capacity !== null && tt.remaining_capacity === 0);
  }, [ticketTypes]);

  const availabilityNotice: TicketAvailabilityVariant | null =
    event?.status === 'soon'
      ? 'coming_soon'
      : event?.status === 'closed'
        ? 'closed'
        : isEventSoldOut
          ? 'sold_out'
          : null;

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

  const currency = ticketTypes[0]?.currency ?? event?.currency ?? 'MDL';
  const ticketsRef = useRef<HTMLDivElement>(null);

  const totalQuantity = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  // Per-order cap: TOTAL tickets across all categories ≤ event.max_tickets_per_user
  // (default 10). `orderRemaining` is the headroom left for the whole order; each
  // stepper can only grow until the order total hits the cap. Mirrors the seat
  // page's total-selection limit and the besttix validateMaxPerUser check.
  const maxPerOrder = ticketTypes[0]?.max_tickets_per_user ?? 10;
  const orderRemaining = Math.max(0, maxPerOrder - totalQuantity);
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

  const [copied, setCopied] = useState(false);

  const maxPrice = useMemo(
    () => (ticketTypes.length > 0 ? Math.max(...ticketTypes.map((tt) => tt.price)) : priceFrom),
    [ticketTypes, priceFrom]
  );

  const addonLines = useMemo(
    () => addons.filter((a) => (addonQuantities[a.id] ?? 0) > 0).map((a) => ({ ...a, qty: addonQuantities[a.id] })),
    [addons, addonQuantities]
  );

  const showSocial = !!(event?.fomo_enabled && (event?.fomo_live_viewers || event?.fomo_recent_sales));
  const showCountdown = !!(event?.fomo_enabled && event?.fomo_countdown);

  const onShare = useCallback(async () => {
    const url = window.location.href;
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: event?.title ?? '', url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* user dismissed the share sheet */
    }
  }, [event?.title]);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const fmtTime = (d: string) =>
    new Date(d).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', hour12: false });

  const buyCtaLabel = isSeated
    ? t('seating.select_seats')
    : totalQuantity > 0
      ? `Checkout · ${totalPrice} ${currency}`
      : t('event.buy_ticket');

  const handleQuantityChange = useCallback((ticketTypeId: number, qty: number) => {
    setQuantities((prev) => ({ ...prev, [ticketTypeId]: qty }));
  }, []);

  const handleAddonQuantityChange = useCallback((addonId: number, qty: number) => {
    setAddonQuantities((prev) => ({ ...prev, [addonId]: qty }));
  }, []);

  const handleBuy = useCallback(() => {
    if (!salesOpen || !event) return;
    if (!isSeated && cartItems.length === 0) return;

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

    const data: Record<string, string> = {
      event: event.slug,
      session: String(activeSessionId),
      cart: JSON.stringify(cartItems),
      ...(addonItems.length > 0 && { addons: JSON.stringify(addonItems) }),
    };

    if (isSeated) {
      sessionStorage.setItem('tixlive:seats', JSON.stringify(data));
      router.push(`/events/${event.slug}/seats`);
    } else {
      sessionStorage.setItem('tixlive:checkout', JSON.stringify(data));
      router.push('/checkout');
    }
  }, [salesOpen, event, isSeated, cartItems, activeSessionId, addons, addonQuantities, currency, router]);

  const headerCart = useMemo(
    () => (totalQuantity > 0
      ? { cartQuantity: totalQuantity, cartTotal: totalPrice, currency, onCartClick: handleBuy }
      : null),
    [totalQuantity, totalPrice, currency, handleBuy]
  );
  useHeaderCart(headerCart);

  // Early returns after all hooks
  if (notFound) return <div className="py-32 text-center text-[var(--theme-muted)]">Event not found.</div>;
  if (!event) return <EventPageSkeleton />;

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

  const ekey = 'text-[11px] font-[600] uppercase tracking-[0.12em] text-[var(--ink-3)]';

  const heroPriceLabel = priceFrom > 0
    ? maxPrice > priceFrom
      ? `${priceFrom} - ${maxPrice} ${currency}`
      : `${priceFrom} ${currency}`
    : t('event.free');

  return (
    <>
      <Head>
        <title>{`${event.title}${organizer ? ` — ${organizer.name}` : ''}`}</title>
        <meta property="og:title" content={event.title} />
        <meta property="og:description" content={event.description || `Get tickets for ${event.title}`} />
        {event.poster_url && <meta property="og:image" content={event.poster_url} />}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <>
        <EventHero
          event={event}
          onBuy={salesOpen ? (isSeated || totalQuantity > 0 ? handleBuy : scrollToTickets) : undefined}
          priceFrom={priceFrom}
          currency={currency}
          ctaLabel={isSeated ? t('seating.select_seats') : t('events.get_tickets')}
        />

        <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 pb-10 pt-10 sm:px-5 md:gap-[56px] md:px-8 md:pb-16">
          {/* Live status row */}
          {(showSocial || showCountdown) && (
            <div className="flex flex-wrap items-center gap-3">
              {showSocial && <KeyFactsStrip event={event} />}
              {showCountdown && <EventCountdown target={event.sessions?.[0]?.date ?? event.date_start} />}
            </div>
          )}

          {/* Two-column body */}
          <section id="about" className="event-split grid gap-7 md:gap-14" style={{ gridTemplateColumns: 'minmax(0, 1fr) 380px' }}>
            <style>{`
              @media (max-width: 980px) {
                .event-split { grid-template-columns: 1fr !important; gap: 28px !important; }
                .event-split aside { position: static !important; }
              }
            `}</style>

            {/* Left column: description + location */}
            <div className="flex flex-col gap-12">
              {event.description && (
                <section>
                  <h2 className="m-0 text-[24px] font-[700] tracking-[-0.018em] text-[var(--ink)]">
                    {t('event.about')}
                  </h2>
                  <p
                    className={`mt-4 max-w-[620px] whitespace-pre-line text-[15px] leading-[1.6] text-[var(--ink-2)] ${
                      descriptionExpanded ? '' : 'line-clamp-6'
                    }`}
                  >
                    {event.description}
                  </p>
                  {event.description.length > 200 && (
                    <button
                      className="mt-3 text-[15px] font-[600] text-[var(--ink)] transition-colors duration-150 hover:text-[var(--ink-3)]"
                      onClick={() => setDescriptionExpanded((o) => !o)}
                    >
                      {descriptionExpanded ? t('event.show_less') : t('event.show_more')}
                    </button>
                  )}
                  {event.page_content?.policies && event.page_content.policies.length > 0 && (
                    <PoliciesBlock policies={event.page_content.policies} />
                  )}
                </section>
              )}

              {event.venue_name && (
                <section>
                  <h2 className="m-0 text-[24px] font-[700] tracking-[-0.018em] text-[var(--ink)]">
                    {t('event.location')}
                  </h2>
                  <div className="mt-5 flex flex-col gap-1.5">
                    <span className="text-[17px] font-[600] tracking-[-0.01em] text-[var(--ink)]">{event.venue_name}</span>
                    {event.venue_address && (
                      <span className="text-[13px] text-[var(--ink-3)]">{event.venue_address}</span>
                    )}
                  </div>
                  {event.google_place_id && (
                    <AddressMap
                      googlePlaceId={event.google_place_id}
                      address={[event.venue_name, event.venue_address].filter(Boolean).join(', ')}
                      height={280}
                    />
                  )}
                </section>
              )}
            </div>

            {/* Right sidebar: info card + CTAs + trust */}
            <aside className="flex flex-col gap-3 self-start md:sticky md:top-[88px]">
              {/* Info card */}
              <div
                className="overflow-hidden rounded-[22px] bg-[var(--surface)]"
                style={{ boxShadow: 'var(--shadow-float)' }}
              >
                <div className="px-5 py-4">
                  <div className={ekey}>{t('event.date_label')}</div>
                  <div className="mt-1.5 text-[17px] font-[700] leading-[1.3] tracking-[-0.015em] text-[var(--ink)]">
                    {fmtDate(event.date_start)}
                  </div>
                  <div className="mt-1 text-[13px] leading-[1.45] text-[var(--ink-3)]">
                    {t('event.doors_open')} {fmtTime(event.date_start)}
                  </div>
                </div>
                {event.venue_name && (
                  <>
                    <div className="h-px bg-[var(--line)]" />
                    <div className="px-5 py-4">
                      <div className={ekey}>{t('event.location')}</div>
                      <div className="mt-1.5 text-[17px] font-[700] leading-[1.3] tracking-[-0.015em] text-[var(--ink)]">
                        {event.venue_name}
                      </div>
                      {event.venue_address && (
                        <div className="mt-1 text-[13px] leading-[1.45] text-[var(--ink-3)]">
                          {event.venue_address}
                        </div>
                      )}
                    </div>
                  </>
                )}
                <div className="h-px bg-[var(--line)]" />
                <div className="px-5 py-4">
                  <div className={ekey}>{t('event.price_label')}</div>
                  <div className="mt-1.5 text-[17px] font-[700] leading-[1.3] tracking-[-0.015em] text-[var(--ink)]">
                    {heroPriceLabel}
                  </div>
                  {ticketTypes.length > 0 && (
                    <div className="mt-1 text-[13px] leading-[1.45] text-[var(--ink-3)]">
                      {ticketTypes.length} {t('event.ticket_types_count', { count: ticketTypes.length })}
                    </div>
                  )}
                </div>
              </div>

              {/* Primary CTA */}
              {!salesOpen ? (
                <button
                  disabled
                  className="rounded-full bg-[var(--bg-2)] px-6 py-[17px] text-[15px] font-[600] tracking-[-0.012em] text-[var(--ink-3)]"
                >
                  {event.status === 'soon' ? t('event.coming_soon') : t('event.sales_ended')}
                </button>
              ) : (
                <button
                  onClick={isSeated || totalQuantity > 0 ? handleBuy : scrollToTickets}
                  className="urgency-cta inline-flex items-center justify-center gap-2.5 rounded-full bg-[var(--ink)] px-6 py-[17px] text-[15px] font-[600] tracking-[-0.012em] text-white transition-colors duration-150 hover:bg-[var(--ink-2)]"
                  style={{ boxShadow: '0 6px 20px -6px rgba(0,0,0,0.25)' }}
                >
                  {buyCtaLabel} <Icon icon="mdi:arrow-right" width={14} />
                </button>
              )}

              {/* Share */}
              <button
                onClick={onShare}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--bg-2)] px-6 py-[15px] text-[14px] font-[600] tracking-[-0.005em] text-[var(--ink)] transition-colors duration-150 hover:bg-[var(--bg-3)]"
              >
                {copied ? (
                  <>
                    <Icon icon="mdi:check" width={13} className="text-[#16A34A]" /> {t('event.link_copied')}
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:share-variant-outline" width={13} /> {t('event.share_event')}
                  </>
                )}
              </button>

              {/* Trust rows */}
              <div className="mt-1 flex flex-col gap-2">
                {[
                  { icon: 'mdi:shield-check-outline', title: t('event.trust.secure_payment'), sub: t('event.trust.ssl_256') },
                  { icon: 'mdi:flash-outline', title: t('event.trust.instant_ticket'), sub: t('event.trust.email_phone') },
                  { icon: 'mdi:check-decagram-outline', title: t('event.trust.guarantee_100'), sub: t('event.trust.easy_refund') },
                ].map((it) => (
                  <div
                    key={it.title}
                    className="flex items-center gap-3 rounded-[14px] bg-[var(--surface-elev)] px-4 py-[14px]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--bg-2)] text-[var(--ink)]">
                      <Icon icon={it.icon} width={16} />
                    </span>
                    <div className="min-w-0 leading-[1.3]">
                      <div className="text-[13.5px] font-[600] tracking-[-0.005em] text-[var(--ink)]">{it.title}</div>
                      <div className="text-[11.5px] text-[var(--ink-3)]">{it.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </section>

          {/* Order tickets — GA events always; seated events only when multi-session (for the session picker) */}
          {(!isSeated || (event.sessions ?? []).length > 1) && (
            <SectionShell
              id="tickets"
              label={t('event.order_tickets')}
              rightSlot={
                priceFrom > 0 && !isSeated ? (
                  <span className="font-[family-name:var(--font-mono)] text-[0.75rem] tracking-[0.03em] text-[var(--theme-text-muted)]">
                    {priceFrom} – {maxPrice} {currency}
                  </span>
                ) : undefined
              }
            >
              <div ref={ticketsRef} className="flex flex-col gap-6">
                {(event.sessions ?? []).length > 1 && (
                  <SessionPicker
                    sessions={event.sessions ?? []}
                    activeSessionId={activeSessionId}
                    onSelect={(id) => {
                      setActiveSessionId(id);
                      setQuantities({});
                    }}
                  />
                )}

                {availabilityNotice !== null ? (
                  <TicketAvailabilityNotice variant={availabilityNotice} />
                ) : !isSeated ? (
                  <>
                    {/* Price ladder */}
                    <div className="flex flex-col gap-3">
                      {ticketTypes.map((ticket, i) => (
                        <TicketTypeRow
                          key={ticket.id}
                          index={i + 1}
                          ticket={ticket}
                          quantity={quantities[ticket.id] ?? 0}
                          orderRemaining={orderRemaining}
                          onQuantityChange={handleQuantityChange}
                          showLowStockUrgency={!!(event.fomo_enabled && event.fomo_low_stock)}
                        />
                      ))}
                    </div>

                    {/* Add-ons */}
                    {addons.length > 0 && totalQuantity > 0 && (
                      <div>
                        <div className="flex items-center gap-2">
                          <Icon icon="mdi:auto-awesome" width={18} className="text-[var(--brand-accent)]" />
                          <h3 className="font-[family-name:var(--font-display)] text-[1.25rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)]">
                            {t('event.enhance_experience')}
                          </h3>
                        </div>
                        <p className="mt-1 text-[0.75rem] text-[var(--theme-text-muted)]">
                          {t('event.addon_per_ticket_note')}
                        </p>
                        <div className="mt-3 flex flex-col gap-2.5">
                          {addons.map((addon) => (
                            <AddonRow
                              key={addon.id}
                              addon={addon}
                              quantity={addonQuantities[addon.id] ?? 0}
                              max={addon.per_ticket ? totalQuantity : addon.max_quantity ?? 4}
                              onQuantityChange={handleAddonQuantityChange}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cart summary */}
                    {totalQuantity > 0 && (
                      <div className="overflow-hidden rounded-[22px] bg-[var(--ink)] text-white" style={{ boxShadow: 'var(--shadow-2)' }}>
                        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                          <span className="text-[10.5px] font-[700] uppercase tracking-[0.12em] text-white">
                            {t('event.your_cart')}
                          </span>
                          <span className="text-[10px] font-[700] uppercase tracking-[0.12em] text-white/55">
                            {t('event.step_1_of_2')}
                          </span>
                        </div>
                        <div className="px-6 py-4">
                          {cartItems.map((item) => (
                            <div key={item.ticket_type_id} className="flex items-center justify-between py-1.5 text-[14px]">
                              <span>
                                <b className="font-[700]">{item.quantity}×</b>
                                <span className="ml-2">{item.ticket_type_name}</span>
                              </span>
                              <span className="tabular-nums">{item.price * item.quantity} {currency}</span>
                            </div>
                          ))}
                          {addonLines.map((l) => (
                            <div key={l.id} className="flex items-center justify-between py-1 text-[13px] text-white/80">
                              <span>
                                <b className="font-[700]">{l.qty}×</b>
                                <span className="ml-2">{l.name}</span>
                              </span>
                              <span className="tabular-nums">
                                +{l.price * l.qty * (l.per_ticket ? totalQuantity : 1)} {currency}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between bg-white px-6 py-5 text-[var(--ink)]">
                          <div>
                            <div className="text-[10px] font-[700] uppercase tracking-[0.12em] text-[var(--ink-3)]">{t('common.total')}</div>
                            <div className="mt-0.5 text-[28px] font-[800] leading-none tracking-[-0.025em] tabular-nums">
                              {totalPrice} <span className="text-[14px] font-[700]">{currency}</span>
                            </div>
                          </div>
                          <button
                            onClick={handleBuy}
                            className="inline-flex items-center gap-2 rounded-full bg-[var(--ink)] py-3.5 pl-5 pr-4 text-[14px] font-[600] tracking-[-0.005em] text-white transition-colors duration-150 hover:bg-[var(--ink-2)]"
                          >
                            {t('event.continue_to_payment')}
                            <Icon icon="mdi:arrow-right" width={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Promo code — only for GA events; seated events apply promos at checkout */}
                    <div className="flex items-center gap-1 rounded-full bg-[var(--bg-2)] p-1.5">
                      <Icon icon="mdi:tag-outline" width={16} className="ml-2.5 shrink-0 text-[var(--ink-3)]" />
                      <input
                        type="text"
                        placeholder={t('event.promo_placeholder')}
                        className="h-9 min-w-0 flex-1 bg-transparent px-2 text-[14px] tracking-[-0.005em] text-[var(--ink)] placeholder:text-[var(--ink-4)] focus:outline-none"
                      />
                      <button className="h-10 shrink-0 rounded-full bg-[var(--ink)] px-5 text-[13.5px] font-[600] tracking-[-0.005em] text-white transition-colors duration-150 hover:bg-[var(--ink-2)]">
                        {t('event.apply')}
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </SectionShell>
          )}

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

          {/* Organizer card */}
          {organizer && (
            <Link
              href="/"
              className="flex items-center gap-5 rounded-[22px] bg-[var(--ink)] p-6 text-white transition-colors duration-150 hover:bg-[var(--ink-2)]"
            >
              {organizer.logo_url ? (
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-white p-2">
                  <Image
                    src={organizer.logo_url}
                    alt={organizer.name}
                    width={160}
                    height={160}
                    className="h-full w-full object-contain"
                  />
                </span>
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-white text-[24px] font-[800] tracking-[-0.022em] text-[var(--ink)]">
                  {organizer.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[22px] font-[800] tracking-[-0.022em]">{organizer.name}</div>
                <div className="mt-1 text-[11px] font-[700] uppercase tracking-[0.12em] text-white/60">
                  {t('event.all_events')}
                </div>
              </div>
              <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-[13px] font-[600] tracking-[-0.005em] text-[var(--ink)] sm:inline-flex">
                {t('event.see_all')} <Icon icon="mdi:arrow-right" width={13} />
              </span>
            </Link>
          )}
        </div>

        {/* Global sticky CTA — always visible on event pages, all viewports */}
        <StickyCTABar
          eyebrow={event.event_type || event.title}
          title={event.title}
          priceLabel={
            priceFrom > 0
              ? `${t('event.from_price')} ${priceFrom} ${currency}`
              : t('event.free')
          }
          ctaLabel={
            !salesOpen
              ? event.status === 'soon'
                ? t('event.coming_soon')
                : t('event.sales_ended')
              : isSeated
                ? t('seating.select_seats')
                : totalQuantity > 0
                  ? `${t('event.checkout')} · ${totalPrice} ${currency}`
                  : t('event.buy_ticket')
          }
          onCta={
            !salesOpen
              ? () => undefined
              : isSeated || totalQuantity > 0
                ? handleBuy
                : scrollToTickets
          }
          disabled={!salesOpen}
        />
      </>
    </>
  );
};

EventDetailPage.getLayout = (page) => <Layout>{page}</Layout>;

export default EventDetailPage;


import { staticI18nProps } from '@/lib/staticI18n';

export async function getStaticPaths() {
  return { paths: [{ params: { slug: '_' } }], fallback: false };
}

export function getStaticProps() {
  return { props: staticI18nProps() };
}
