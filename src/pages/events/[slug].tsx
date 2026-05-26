import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { IEventDetail, ICartItem } from '@/types';
import { directGetEvent } from '@/lib/directApi';
import { useOrganizer } from '@/contexts/OrganizerContext';
import { useEventType } from '@/hooks/useEventType';
import { useHeaderCart } from '@/contexts/LayoutContext';
import Layout from '@/components/layout/Layout';
import type { NextPageWithLayout } from '@/pages/_app';
import EventHero from '@/components/event/EventHero';
import StickyBuyBar from '@/components/event/StickyBuyBar';
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
    setSlug(parts[1] || undefined); // /events/:slug
  }, [router.query.slug]);

  const { data: event, isFetching } = useQuery<IEventDetail | null>({
    queryKey: ['event', slug],
    queryFn: () => directGetEvent(slug!),
    enabled: !!slug,
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });
  const notFound = !!slug && !isFetching && event === null;

  useEventType(event?.event_type);

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
      : 'Cumpără Bilet';

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

  const hairline = 'border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)]';
  const monoLabel = 'font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[var(--theme-text-muted)]';

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
        <EventHero event={event} />

        <div className="mx-auto flex max-w-[1120px] flex-col gap-10 px-4 py-10 sm:px-6 md:gap-[72px] md:py-16">
          {/* Live status row */}
          {(showSocial || showCountdown) && (
            <div className="flex flex-wrap items-center gap-3">
              {showSocial && <KeyFactsStrip event={event} />}
              {showCountdown && <EventCountdown target={event.sessions?.[0]?.date ?? event.date_start} />}
            </div>
          )}

          {/* About + buy card */}
          <section
            id="about"
            className={`grid gap-8 md:items-start md:gap-14 ${
              (event.description || event.venue_name) ? 'md:grid-cols-[1.6fr_1fr]' : 'md:max-w-md'
            }`}
          >
            {/* Left column: description + location */}
            {(event.description || event.venue_name) && (
              <div className="flex flex-col gap-10">
                {event.description && (
                  <div>
                    <h2 className="font-[family-name:var(--font-display)] text-[1.75rem] font-[700] tracking-[-0.02em] text-[var(--theme-text)] sm:text-[2rem]">
                      Despre Eveniment
                    </h2>
                    <p
                      className={`mt-4 whitespace-pre-line text-[0.9375rem] leading-relaxed text-[var(--theme-text-muted)] sm:text-[1.0625rem] ${
                        descriptionExpanded ? '' : 'line-clamp-6'
                      }`}
                    >
                      {event.description}
                    </p>
                    {event.description.length > 200 && (
                      <button
                        className="mt-3 font-[family-name:var(--font-body)] text-[0.9375rem] font-[600] text-[var(--brand-accent)] transition-colors duration-200 hover:text-[var(--theme-text)] focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
                        onClick={() => setDescriptionExpanded((o) => !o)}
                      >
                        {descriptionExpanded ? 'Arată mai puțin' : 'Arată mai mult'}
                      </button>
                    )}
                  </div>
                )}

                {event.venue_name && (
                  <div>
                    <h2 className="font-[family-name:var(--font-display)] text-[1.75rem] font-[700] tracking-[-0.02em] text-[var(--theme-text)] sm:text-[2rem]">
                      Locație
                    </h2>
                    <div className="mt-4">
                      <p className="font-[family-name:var(--font-display)] text-[1.0625rem] font-[700] text-[var(--theme-text)]">
                        {event.venue_name}
                      </p>
                      {event.venue_address && (
                        <p className="mt-0.5 text-[0.8125rem] text-[var(--theme-text-muted)]">{event.venue_address}</p>
                      )}
                    </div>
                    {event.google_place_id && (
                      <AddressMap
                        googlePlaceId={event.google_place_id}
                        address={[event.venue_name, event.venue_address].filter(Boolean).join(', ')}
                        height={280}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Right column: buy card + trust badges */}
            <div className="flex flex-col gap-4">
              <div
                className={`overflow-hidden rounded-[22px] border ${hairline} bg-[var(--theme-surface)] shadow-[0_1px_2px_rgba(20,19,18,0.04),0_8px_24px_rgba(20,19,18,0.06)]`}
              >
                <div className="px-6">
                  <div className={`border-b ${hairline} py-4`}>
                    <div className={monoLabel}>Data</div>
                    <div className="mt-1 font-[family-name:var(--font-display)] text-[1.0625rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)]">
                      {fmtDate(event.date_start)}
                    </div>
                    <div className="mt-0.5 text-[0.75rem] text-[var(--theme-text-muted)]">
                      Porțile se deschid la {fmtTime(event.date_start)}
                    </div>
                  </div>

                  {event.venue_name && (
                    <div className={`border-b ${hairline} py-4`}>
                      <div className={monoLabel}>Locație</div>
                      <div className="mt-1 font-[family-name:var(--font-display)] text-[1.0625rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)]">
                        {event.venue_name}
                      </div>
                      {event.venue_address && (
                        <div className="mt-0.5 text-[0.75rem] text-[var(--theme-text-muted)]">{event.venue_address}</div>
                      )}
                    </div>
                  )}

                  <div className="py-4">
                    <div className={monoLabel}>Preț</div>
                    <div className="mt-1 font-[family-name:var(--font-display)] text-[1.0625rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)]">
                      {priceFrom > 0
                        ? maxPrice > priceFrom
                          ? `${priceFrom} – ${maxPrice} ${currency}`
                          : `${priceFrom} ${currency}`
                        : 'Gratuit'}
                    </div>
                    {ticketTypes.length > 0 && (
                      <div className="mt-0.5 text-[0.75rem] text-[var(--theme-text-muted)]">
                        {ticketTypes.length} {ticketTypes.length === 1 ? 'tip de bilet' : 'tipuri de bilete'}
                      </div>
                    )}
                  </div>
                </div>

                <div className={`flex flex-col gap-2.5 border-t ${hairline} bg-[var(--theme-bg)] px-5 py-4`}>
                  {!salesOpen ? (
                    <Button
                      isDisabled
                      variant="flat"
                      size="lg"
                      className="w-full rounded-full font-[family-name:var(--font-body)] text-[0.9375rem] font-[700]"
                    >
                      {event.status === 'soon' ? 'În curând' : 'Vânzări Încheiate'}
                    </Button>
                  ) : (
                    <Button
                      variant="solid"
                      size="lg"
                      className="w-full rounded-full font-[family-name:var(--font-body)] text-[0.9375rem] font-[700] text-[var(--theme-bg)]"
                      style={{ backgroundColor: 'var(--brand-primary)' }}
                      onPress={isSeated || totalQuantity > 0 ? handleBuy : scrollToTickets}
                    >
                      {buyCtaLabel}
                      <Icon icon="mdi:arrow-right" className="ml-1" width={18} />
                    </Button>
                  )}
                  <Button
                    variant="bordered"
                    size="lg"
                    onPress={onShare}
                    className="w-full rounded-full border-[color-mix(in_srgb,var(--theme-text)_12%,transparent)] font-[family-name:var(--font-body)] text-[0.875rem] font-[600] text-[var(--theme-text)]"
                  >
                    {copied ? (
                      <>
                        <Icon icon="mdi:check" width={16} className="text-[#16A34A]" /> Link copiat
                      </>
                    ) : (
                      <>
                        <Icon icon="mdi:share-variant-outline" width={16} /> Distribuie evenimentul
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Trust badges */}
              <div className="flex flex-col gap-2">
                {[
                  { icon: 'mdi:shield-check-outline', title: 'Plată securizată', sub: 'SSL 256-bit' },
                  { icon: 'mdi:flash-outline', title: 'Bilet instant', sub: 'Email & telefon' },
                  { icon: 'mdi:check-decagram-outline', title: 'Garanție 100%', sub: 'Rambursare ușoară' },
                ].map((it) => (
                  <div
                    key={it.title}
                    className={`flex items-center gap-3 rounded-2xl border ${hairline} bg-[var(--theme-surface)] px-4 py-3`}
                  >
                    <Icon icon={it.icon} width={22} className="shrink-0 text-[var(--theme-text-muted)]" />
                    <div className="min-w-0">
                      <div className="font-[family-name:var(--font-display)] text-[0.8125rem] font-[700] text-[var(--theme-text)]">
                        {it.title}
                      </div>
                      <div className="font-[family-name:var(--font-mono)] text-[0.625rem] tracking-[0.05em] text-[var(--theme-text-muted)]">
                        {it.sub}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Order tickets — GA events always; seated events only when multi-session (for the session picker) */}
          {(!isSeated || (event.sessions ?? []).length > 1) && (
            <SectionShell
              id="tickets"
              label="Comandă Bilete"
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
                            Îmbunătățește-ți Experiența
                          </h3>
                        </div>
                        <p className="mt-1 text-[0.75rem] text-[var(--theme-text-muted)]">
                          Preț per bilet · Aplicat la toate biletele din coș.
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
                      <div className="overflow-hidden rounded-[22px] bg-[var(--brand-primary)] text-[var(--theme-bg)]">
                        <div className="flex items-center justify-between border-b border-[color-mix(in_srgb,var(--theme-bg)_12%,transparent)] px-6 py-4">
                          <span className="font-[family-name:var(--font-mono)] text-[0.6875rem] uppercase tracking-[0.15em]">
                            Coșul tău
                          </span>
                          <span className="font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.1em] opacity-55">
                            Pasul 1 din 2
                          </span>
                        </div>
                        <div className="px-6 py-4">
                          {cartItems.map((item) => (
                            <div key={item.ticket_type_id} className="flex items-center justify-between py-1.5">
                              <span className="text-[0.875rem]">
                                <b className="font-[family-name:var(--font-display)] font-[700]">{item.quantity}×</b>
                                <span className="ml-2">{item.ticket_type_name}</span>
                              </span>
                              <span className="font-[family-name:var(--font-data)] text-[0.875rem] tabular-nums">
                                {item.price * item.quantity} {currency}
                              </span>
                            </div>
                          ))}
                          {addonLines.map((l) => (
                            <div key={l.id} className="flex items-center justify-between py-1 opacity-80">
                              <span className="text-[0.8125rem]">
                                <b className="font-[family-name:var(--font-display)] font-[700]">{l.qty}×</b>
                                <span className="ml-2">{l.name}</span>
                              </span>
                              <span className="font-[family-name:var(--font-data)] text-[0.8125rem] tabular-nums">
                                +{l.price * l.qty * (l.per_ticket ? totalQuantity : 1)} {currency}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between bg-[var(--theme-bg)] px-6 py-5 text-[var(--theme-text)]">
                          <div>
                            <div className={monoLabel}>Total</div>
                            <div className="font-[family-name:var(--font-display)] text-[1.75rem] font-[800] leading-none tracking-[-0.02em] tabular-nums">
                              {totalPrice} <span className="text-[0.875rem] font-[700]">{currency}</span>
                            </div>
                          </div>
                          <Button
                            variant="solid"
                            size="lg"
                            className="rounded-full font-[family-name:var(--font-body)] font-[700] text-white"
                            style={{ backgroundColor: 'var(--brand-accent)' }}
                            onPress={handleBuy}
                          >
                            Continuă la Plată
                            <Icon icon="mdi:arrow-right" className="ml-1" width={18} />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Promo code — only for GA events; seated events apply promos at checkout */}
                    <div className={`flex items-center gap-1.5 rounded-full border ${hairline} bg-[var(--theme-surface)] p-1.5`}>
                      <Icon icon="mdi:tag-outline" width={18} className="ml-2 shrink-0 text-[var(--theme-text-muted)]" />
                      <input
                        type="text"
                        placeholder="Cod promoțional"
                        className="h-9 min-w-0 flex-1 bg-transparent px-2 font-[family-name:var(--font-mono)] text-[0.8125rem] tracking-[0.03em] text-[var(--theme-text)] placeholder:text-[var(--theme-text-muted)] focus:outline-none"
                      />
                      <button className="h-9 shrink-0 rounded-full bg-[var(--brand-primary)] px-5 font-[family-name:var(--font-body)] text-[0.8125rem] font-[700] text-[var(--theme-bg)] transition-opacity duration-200 hover:opacity-90">
                        Aplică
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
            className="flex items-center gap-5 rounded-[22px] bg-[var(--brand-primary)] p-6 text-[var(--theme-bg)] transition-opacity duration-200 hover:opacity-95"
          >
            {organizer.logo_url ? (
              <Image
                src={organizer.logo_url}
                alt={organizer.name}
                width={56}
                height={56}
                className="shrink-0 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--theme-bg)] font-[family-name:var(--font-display)] text-[1.5rem] font-[800] text-[var(--theme-text)]">
                {organizer.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-[family-name:var(--font-display)] text-[1.375rem] font-[700] tracking-[-0.01em]">
                {organizer.name}
              </div>
              <div className="mt-1 font-[family-name:var(--font-mono)] text-[0.6875rem] uppercase tracking-[0.1em] opacity-60">
                Toate evenimentele
              </div>
            </div>
            <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--theme-bg)_25%,transparent)] px-5 py-2.5 font-[family-name:var(--font-body)] text-[0.8125rem] font-[600] sm:inline-flex">
              Vezi toate <Icon icon="mdi:arrow-right" width={16} />
            </span>
          </Link>
          )}
        </div>

        {/* Desktop floating CTA — seated events (persistent buy entry, no inline selector) */}
        {isSeated && salesOpen && (
          <div className="pointer-events-none sticky bottom-7 z-40 -mt-24 hidden justify-center md:flex">
            <button
              onClick={handleBuy}
              className="pointer-events-auto flex items-center gap-4 rounded-full bg-[var(--brand-primary)] py-2 pl-6 pr-2 text-[var(--theme-bg)] shadow-[0_24px_60px_rgba(20,19,18,0.35)]"
            >
              <span className="text-left">
                <span className="block font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] opacity-55">
                  Bilete
                </span>
                <span className="block font-[family-name:var(--font-display)] text-[1.125rem] font-[700] tracking-[-0.01em]">
                  {priceFrom > 0 ? `De la ${priceFrom} ${currency}` : 'Locuri'}
                </span>
              </span>
              <span
                className="flex items-center gap-2 rounded-full px-6 py-3 font-[family-name:var(--font-body)] text-[0.875rem] font-[700] text-white"
                style={{ backgroundColor: 'var(--brand-accent)' }}
              >
                {t('seating.select_seats')}
                <Icon icon="mdi:arrow-right" width={16} />
              </span>
            </button>
          </div>
        )}

        {/* Mobile sticky buy bar */}
        <StickyBuyBar
          cartItems={cartItems}
          currency={currency}
          onBuy={handleBuy}
          ctaLabel={isSeated ? t('seating.select_seats') : undefined}
          isSeated={isSeated}
          salesOpen={salesOpen}
        />

        {/* Bottom padding for mobile sticky bar */}
        {(cartItems.length > 0 || (isSeated && salesOpen)) && <div className="h-24 md:hidden" />}
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
