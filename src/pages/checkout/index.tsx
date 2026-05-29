import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Checkbox, Drawer, DrawerBody, DrawerContent, DrawerHeader, Input, useDisclosure } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useTranslation, Trans } from 'next-i18next';
import { isValidPhoneNumber } from 'react-phone-number-input';

import Layout from '@/components/layout/Layout';
import type { NextPageWithLayout } from '@/pages/_app';
import OrderSummary from '@/components/checkout/OrderSummary';
import PromoCodeInput from '@/components/checkout/PromoCodeInput';
import PaymentMethodSelector from '@/components/checkout/PaymentMethodSelector';
import PaymentDetailsSlot from '@/components/checkout/PaymentDetailsSlot';
import PriceBreakdown from '@/components/checkout/PriceBreakdown';
import AttendeeIdentityRow from '@/components/checkout/AttendeeIdentityRow';
import RecaptchaDisclaimer from '@/components/common/RecaptchaDisclaimer';
import ProfileForm from '@/components/account/ProfileForm';
import PhoneNumberInput from '@/components/forms/PhoneNumberInput';
import ApiService, { ApiError, getAccessToken, getRefreshToken } from '@/services/Api.Service';
import { normalizeLocale } from '@/lib/staticI18n';
import { fetchEvent } from '@/queries/events/useGetEvent';
import { useCreateOrder } from '@/queries/orders/useCreateOrder';
import { useOrganizer } from '@/contexts/OrganizerContext';
import { useBuyFlowStep } from '@/contexts/LayoutContext';
import { IEventDetail, ICartItem, IAddonCartItem, IAvailablePaymentMethod, IMe } from '@/types';

type CheckoutFormValues = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  accept_terms: boolean;
};

const CheckoutPage: NextPageWithLayout = function CheckoutPage() {
  const { t, i18n } = useTranslation('common');
  const router = useRouter();
  const { organizer } = useOrganizer();
  useBuyFlowStep(2);

  // Data loaded from sessionStorage + API
  const [event, setEvent] = useState<IEventDetail | null>(null);
  const [session, setSession] = useState<{ id: number; date: string }>({ id: 0, date: '' });
  const [cart, setCart] = useState<ICartItem[]>([]);
  const [addonCart, setAddonCart] = useState<IAddonCartItem[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [seatLabels, setSeatLabels] = useState<string[]>([]);
  const [me, setMe] = useState<IMe | null>(null);
  const [meError, setMeError] = useState(false);
  const [ready, setReady] = useState(false);

  const [selectedPaymentId, setSelectedPaymentId] = useState<number>(0);
  const [discount, setDiscount] = useState<{ percent?: number; amount?: number } | undefined>();
  const [promoCode, setPromoCode] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [seatConflict, setSeatConflict] = useState(false);

  const { isOpen: drawerOpen, onOpen: openDrawer, onOpenChange: setDrawerOpen } = useDisclosure();
  const createOrderMutation = useCreateOrder();

  const idempotencyKeyRef = useRef<string>('');
  if (!idempotencyKeyRef.current) {
    idempotencyKeyRef.current =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  useEffect(() => {
    const raw = sessionStorage.getItem('tixlive:checkout');
    if (!raw) {
      router.replace('/');
      return;
    }

    let stored: Record<string, string>;
    try {
      stored = JSON.parse(raw);
    } catch {
      router.replace('/');
      return;
    }

    const { event: eventSlug, session: sessionRaw, cart: cartJson, addons: addonsJson, selected_seats: seatsJson, seat_labels: labelsJson } = stored;

    if (!eventSlug || !cartJson) {
      router.replace('/');
      return;
    }

    let parsedCart: ICartItem[] = [];
    try {
      parsedCart = JSON.parse(cartJson);
      if (!Array.isArray(parsedCart) || parsedCart.length === 0) {
        router.replace('/');
        return;
      }
    } catch {
      router.replace('/');
      return;
    }

    let parsedAddons: IAddonCartItem[] = [];
    if (addonsJson) { try { parsedAddons = JSON.parse(addonsJson); } catch { parsedAddons = []; } }

    let parsedSeats: string[] = [];
    if (seatsJson) { try { const p = JSON.parse(seatsJson); if (Array.isArray(p)) parsedSeats = p.filter((s): s is string => typeof s === 'string'); } catch { parsedSeats = []; } }

    let parsedLabels: string[] = [];
    if (labelsJson) { try { const p = JSON.parse(labelsJson); if (Array.isArray(p)) parsedLabels = p.filter((s): s is string => typeof s === 'string'); } catch { parsedLabels = []; } }

    setCart(parsedCart);
    setAddonCart(parsedAddons);
    setSelectedSeats(parsedSeats);
    setSeatLabels(parsedLabels);

    // Fetch event and me in parallel.
    // /api/me returns 401 when the user is a guest — that's expected, not an error.
    // Only flag meError for real failures (network / 5xx).
    const hasAttendeeCookies = Boolean(getAccessToken() || getRefreshToken());
    const mePromise: Promise<{ kind: 'ok'; data: IMe } | { kind: 'guest' } | { kind: 'error' }> = hasAttendeeCookies
      ? ApiService.get<IMe>('/api/public/me')
          .then((data) => ({ kind: 'ok' as const, data }))
          .catch(() => ({ kind: 'error' as const }))
      : Promise.resolve({ kind: 'guest' as const });

    Promise.all([fetchEvent(eventSlug), mePromise]).then(([ev, meResult]) => {
      if (!ev) { router.replace('/'); return; }

      if (ev.is_seated && parsedSeats.length === 0) {
        router.replace(`/events/${eventSlug}`);
        return;
      }

      const matchedSession = sessionRaw ? ev.sessions?.find((s: { id: number }) => String(s.id) === sessionRaw) : undefined;
      const resolvedSession = matchedSession ?? ev.sessions?.[0];

      setEvent(ev);
      setSession(resolvedSession ? { id: resolvedSession.id, date: resolvedSession.date } : { id: 0, date: '' });
      setSelectedPaymentId(ev.available_payment_methods?.[0]?.id ?? 0);

      if (meResult.kind === 'ok' && meResult.data?.email) {
        setMe(meResult.data as IMe);
      } else if (meResult.kind === 'error') {
        setMeError(true);
      }

      setReady(true);
    }).catch(() => {
      router.replace('/');
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!drawerOpen && profileIncomplete) {
      setProfileIncomplete(false);
    }
  }, [drawerOpen, profileIncomplete]);

  const goPickSeats = () => {
    if (!event) return;
    const data: Record<string, string> = {
      event: event.slug,
      session: String(session.id),
      cart: JSON.stringify(cart),
      ...(addonCart.length > 0 && { addons: JSON.stringify(addonCart) }),
    };
    sessionStorage.setItem('tixlive:seats', JSON.stringify(data));
    router.push(`/events/${event.slug}/seats`);
  };

  const submitOrder = async (values?: CheckoutFormValues) => {
    setSubmitting(true);
    setSubmitError('');
    setSeatConflict(false);

    const isAuthed = me !== null;

    try {
      const baseBody = {
        session_id: session.id,
        payment_method_id: selectedPaymentId,
        cart: cart.map((item) => ({
          ticket_package_id: item.ticket_type_id,
          quantity: item.quantity,
        })),
        ...(addonCart.length > 0 && {
          addons: addonCart.map((a) => ({ addon_id: a.addon_id, quantity: a.quantity })),
        }),
        ...(selectedSeats.length > 0 && { selected_seats: selectedSeats }),
        promo_code: promoCode || undefined,
        locale: normalizeLocale(i18n.language),
        idempotency_key: idempotencyKeyRef.current,
      };

      const body = isAuthed
        ? baseBody
        : {
            ...baseBody,
            email: values?.email,
            first_name: values?.first_name,
            last_name: values?.last_name,
            phone: values?.phone ?? '',
          };

      let response;
      try {
        response = await createOrderMutation.mutateAsync(body);
      } catch (err) {
        const e = err instanceof ApiError ? err : (err as Error & { status?: number; code?: string });
        const code = String(e.code ?? e.message ?? '');
        const status = e.status ?? 0;
        if (code.includes('PROFILE_INCOMPLETE')) {
          setProfileIncomplete(true);
          setSubmitting(false);
          openDrawer();
          return;
        }
        const SEAT_ERROR_CODES = ['SEAT_TAKEN', 'SEATS_REQUIRED', 'SEAT_COUNT_MISMATCH', 'INVALID_SEAT_ID', 'DUPLICATE_SEATS'];
        if (SEAT_ERROR_CODES.some((c) => code.includes(c))) {
          setSubmitError(t('checkout.error_seat_taken'));
          setSeatConflict(true);
        } else if (code.includes('SOLD_OUT') || code.includes('NO_AVAILABLE_TICKETS')) {
          setSubmitError(t('checkout.error_sold_out'));
        } else if (code.includes('TICKET_LIMIT_REACHED')) {
          setSubmitError(t('checkout.error_too_many_tickets'));
        } else if (code.includes('PAYMENT_METHOD')) {
          setSubmitError(t('checkout.error_payment_method'));
        } else if (code.includes('PROMOCODE_LIMIT_OVERFLOW')) {
          setSubmitError(t('checkout.error_promo_exhausted'));
        } else if (code.includes('PROMO_CODE_NOT_FOUND')) {
          setSubmitError(t('checkout.error_promo_invalid'));
        } else if (status === 400) {
          setSubmitError(t('checkout.error_invalid_order'));
        } else if (status >= 500) {
          setSubmitError(t('checkout.error_server'));
        } else {
          setSubmitError(t('checkout.error_generic'));
        }
        setSubmitting(false);
        return;
      }

      if (!response.payment_url) {
        setSubmitError(t('checkout.error_generic'));
        setSubmitting(false);
        return;
      }

      window.location.href = response.payment_url;
    } catch {
      setSubmitError(t('checkout.error_generic'));
      setSubmitting(false);
    }
  };

  const checkoutSchema = useMemo(
    () =>
      z.object({
        first_name: z.string().min(1, t('checkout.first_name_required')),
        last_name: z.string().min(1, t('checkout.last_name_required')),
        email: z.string().min(1, t('checkout.email_required')).email(t('checkout.email_invalid')),
        phone: z
          .string()
          .min(1, t('checkout.phone_required'))
          .refine((v) => isValidPhoneNumber(v ?? ''), { message: t('checkout.phone_invalid') }),
        accept_terms: z.boolean().refine((v) => v === true, { message: t('checkout.terms_required') }),
      }),
    [t],
  );

  const methods = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { first_name: '', last_name: '', email: '', phone: '', accept_terms: false },
  });

  const { register, handleSubmit, control, formState: { errors } } = methods;
  const onSubmit = (values: CheckoutFormValues) => submitOrder(values);
  const onAuthedSubmit = () => {
    // For authenticated users only `accept_terms` is captured by this form;
    // first/last/email/phone come from the account profile.
    if (!methods.getValues('accept_terms')) {
      methods.setError('accept_terms', { message: t('checkout.terms_required') });
      return;
    }
    submitOrder();
  };

  if (!ready || !event) return null;

  const isAuthed = me !== null;
  const paymentMethods: IAvailablePaymentMethod[] = event.available_payment_methods ?? [];
  const selectedMethod = paymentMethods.find((m) => m.id === selectedPaymentId) ?? paymentMethods[0];
  const ctaLabel = selectedMethod
    ? t('checkout.pay_with', { provider: selectedMethod.name })
    : t('checkout.proceed_to_payment');

  return (
    <>
      <Head>
        <title>{`Checkout - ${event.title}`}</title>
      </Head>

      <div className="mx-auto max-w-[1200px] px-4 pb-12 pt-7 sm:px-5 md:px-8">
        {/* Back pill */}
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-5 inline-flex items-center gap-2 text-[13px] font-[600] tracking-[-0.005em] text-[var(--ink-3)] transition-colors duration-150 hover:text-[var(--ink)]"
        >
          <Icon icon="mdi:chevron-left" width={13} /> {t('checkout.back')}
        </button>

        {/* Heading */}
        <div className="mb-7">
          {isAuthed && me ? (
            <h1 className="m-0 flex items-center gap-2.5 text-[28px] font-[800] tracking-[-0.032em] text-[var(--ink)] sm:text-[32px]">
              <Icon icon="mdi:check-circle" width={24} className="text-[var(--ink)]" />
              {t('checkout.welcome_back', { name: me.first_name || me.email })}
            </h1>
          ) : (
            <>
              <h1 className="m-0 text-[28px] font-[800] tracking-[-0.032em] text-[var(--ink)] sm:text-[32px]">
                {t('checkout.your_details')}
              </h1>
              <p className="mt-1.5 text-[14px] text-[var(--ink-3)]">{t('checkout.your_details_subtitle')}</p>
            </>
          )}
        </div>

        {/* Two-column layout: form left, summary right */}
        <div className="grid gap-7 md:grid-cols-[1fr_380px] md:items-start md:gap-10">
          {/* Left column — form */}
          <div className="min-w-0">
            <FormProvider {...methods}>
              <form onSubmit={isAuthed ? (e) => { e.preventDefault(); onAuthedSubmit(); } : handleSubmit(onSubmit)} noValidate>
                <div className="space-y-4">
                  {/* Mobile order summary (above form) */}
                  <div className="md:hidden">
                    <OrderSummary event={event} sessionDate={session.date} cart={cart} addonCart={addonCart} seatLabels={seatLabels} />
                  </div>

                  {/* Identity / details */}
                  {isAuthed && me ? (
                    <section className="space-y-3">
                      <AttendeeIdentityRow me={me} onEditPress={openDrawer} />
                      {meError && (
                        <p className="text-[0.8125rem] text-[var(--theme-text-muted)]">
                          {t('checkout.me_error_fallback_note')}
                        </p>
                      )}
                    </section>
                  ) : (
                    <section className="flex flex-col gap-4 rounded-[18px] bg-[var(--surface)] p-5 sm:p-6" style={{ boxShadow: 'var(--shadow-2)' }}>
                      <header className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="m-0 text-[20px] font-[800] tracking-[-0.022em] text-[var(--ink)]">
                            {t('checkout.personal_data_title')}
                          </h2>
                          <p className="mt-1 text-[12.5px] leading-[1.45] text-[var(--ink-3)]">
                            {t('checkout.personal_data_subtitle')}
                          </p>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-[var(--bg-2)] px-2.5 py-1.5 text-[10.5px] font-[700] uppercase tracking-[0.06em] text-[var(--ink-2)]">
                          <Icon icon="mdi:shield-check-outline" width={11} /> {t('checkout.secure_badge')}
                        </span>
                      </header>

                      {meError && (
                        <div className="rounded-[12px] bg-[var(--bg-2)] p-3 text-[13px] text-[var(--ink-3)]">
                          {t('checkout.me_error_fallback')}
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input
                          label={t('checkout.first_name')}
                          isRequired
                          {...register('first_name')}
                          isInvalid={!!errors.first_name}
                          errorMessage={errors.first_name?.message}
                          classNames={{ inputWrapper: 'rounded-xl' }}
                        />
                        <Input
                          label={t('checkout.last_name')}
                          isRequired
                          {...register('last_name')}
                          isInvalid={!!errors.last_name}
                          errorMessage={errors.last_name?.message}
                          classNames={{ inputWrapper: 'rounded-xl' }}
                        />
                      </div>

                      <Input
                        label={t('checkout.email')}
                        type="email"
                        isRequired
                        {...register('email')}
                        isInvalid={!!errors.email}
                        errorMessage={errors.email?.message}
                        classNames={{ inputWrapper: 'rounded-xl' }}
                      />

                      <PhoneNumberInput
                        id="checkout-phone"
                        name="phone"
                        control={control}
                        label={t('checkout.phone')}
                        isRequired
                        errorMessage={errors.phone?.message as string | undefined}
                      />
                    </section>
                  )}

                  {/* Promo code */}
                  <section className="rounded-[18px] bg-[var(--surface)] p-4 sm:p-5" style={{ boxShadow: 'var(--shadow-1)' }}>
                    <PromoCodeInput
                      eventId={event.id}
                      onApply={(d, code) => {
                        setDiscount(d);
                        setPromoCode(code);
                      }}
                      onRemove={() => {
                        setDiscount(undefined);
                        setPromoCode('');
                      }}
                    />
                  </section>

                  {/* Payment method selector */}
                  {paymentMethods.length > 0 && (
                    <section>
                      <PaymentMethodSelector
                        methods={paymentMethods}
                        selected={selectedPaymentId}
                        onSelect={setSelectedPaymentId}
                      />
                    </section>
                  )}

                  {/* Payment details slot */}
                  {selectedMethod && (
                    <PaymentDetailsSlot method={selectedMethod} />
                  )}

                  {/* Error */}
                  {submitError && (
                    <div className="rounded-[14px] bg-[#DC2626]/8 p-4 text-center text-[13.5px] font-[500] text-[#DC2626]">
                      {submitError}
                      {seatConflict && (
                        <button
                          type="button"
                          onClick={goPickSeats}
                          className="mt-3 w-full rounded-full bg-white px-5 py-2.5 text-[13px] font-[600] text-[var(--ink)] transition-colors duration-150 hover:bg-[var(--bg-2)]"
                        >
                          {t('checkout.choose_different_seats')}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Profile incomplete banner */}
                  {profileIncomplete && (
                    <div className="rounded-[14px] bg-[var(--bg-2)] p-4 text-center text-[13.5px] text-[var(--ink-2)]">
                      {t('checkout.profile_incomplete')}
                    </div>
                  )}

                  {/* Price breakdown — mobile only */}
                  <div className="rounded-[18px] bg-[var(--bg-2)] p-5 md:hidden">
                    <PriceBreakdown
                      items={cart}
                      addonItems={addonCart}
                      totalTicketQty={cart.reduce((s, i) => s + i.quantity, 0)}
                      discount={discount}
                      currency={cart[0]?.currency ?? 'USD'}
                      platformFeePayer={event.platform_fee_payer}
                      providerFeePayer={event.provider_fee_payer}
                      platformFeePercent={event.platform_fee_percent}
                      platformFeeFixed={event.platform_fee_fixed}
                      providerFeePercent={selectedMethod?.fee_percent ?? 0}
                    />
                  </div>

                  {/* Terms & Conditions */}
                  <div className="space-y-1.5">
                    <Controller
                      control={control}
                      name="accept_terms"
                      render={({ field }) => (
                        <label className="flex items-start gap-2.5 rounded-[12px] bg-[var(--bg-2)] px-3 py-2.5 text-[12.5px] leading-[1.45] text-[var(--ink-2)]">
                          <input
                            type="checkbox"
                            checked={!!field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            onBlur={field.onBlur}
                            className="mt-0.5 shrink-0 accent-[var(--ink)]"
                          />
                          <span className="flex-1">
                            <Trans
                              i18nKey="checkout.terms_agree"
                              ns="common"
                              components={{
                                a: (
                                  <Link
                                    href="/terms"
                                    target="_blank"
                                    className="font-[600] text-[var(--ink)] underline-offset-2 hover:underline"
                                  />
                                ),
                              }}
                            />
                          </span>
                        </label>
                      )}
                    />
                    {errors.accept_terms && (
                      <p className="px-2 text-[12px] text-[#DC2626]">
                        {errors.accept_terms.message as string}
                      </p>
                    )}
                  </div>

                  {/* Submit CTA */}
                  <div className="flex flex-col gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="urgency-cta inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-[var(--ink)] px-6 py-[17px] text-[15px] font-[600] tracking-[-0.012em] text-white transition-colors duration-150 hover:bg-[var(--ink-2)] disabled:cursor-wait disabled:opacity-70"
                      style={{ boxShadow: '0 6px 20px -6px rgba(0,0,0,0.25)' }}
                    >
                      {submitting ? (
                        <>
                          <Icon icon="mdi:loading" width={16} className="animate-spin" />
                          {t('checkout.processing')}
                        </>
                      ) : (
                        <>
                          {ctaLabel}
                          <Icon icon="mdi:arrow-right" width={14} />
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-1.5 text-center text-[11.5px] text-[var(--ink-3)]">
                      <Icon icon="mdi:shield-check-outline" width={12} />
                      <span>{t('checkout.secure_payment_note')}</span>
                    </div>

                    <RecaptchaDisclaimer />
                  </div>
                </div>
              </form>
            </FormProvider>
          </div>

          {/* Right column — sticky order summary (desktop only) */}
          <aside className="hidden flex-shrink-0 md:block">
            <div className="sticky top-[88px] flex flex-col gap-3">
              <OrderSummary event={event} sessionDate={session.date} cart={cart} addonCart={addonCart} seatLabels={seatLabels} />

              <div className="rounded-[18px] bg-[var(--bg-2)] p-5">
                <span className="block text-[10.5px] font-[700] uppercase tracking-[0.12em] text-[var(--ink-3)]">{t('checkout.summary_label')}</span>
                <div className="mt-3">
                  <PriceBreakdown
                    items={cart}
                    addonItems={addonCart}
                    totalTicketQty={cart.reduce((s, i) => s + i.quantity, 0)}
                    discount={discount}
                    currency={cart[0]?.currency ?? 'USD'}
                    platformFeePayer={event.platform_fee_payer}
                    providerFeePayer={event.provider_fee_payer}
                    platformFeePercent={event.platform_fee_percent}
                    platformFeeFixed={event.platform_fee_fixed}
                    providerFeePercent={selectedMethod?.fee_percent ?? 0}
                  />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Edit-profile drawer */}
      {isAuthed && me && (
        <Drawer isOpen={drawerOpen} onOpenChange={setDrawerOpen} placement="right" size="md">
          <DrawerContent>
            {() => (
              <>
                <DrawerHeader>{t('checkout.edit_profile_title')}</DrawerHeader>
                <DrawerBody>
                  <ProfileForm initial={me} />
                </DrawerBody>
              </>
            )}
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
};

CheckoutPage.getLayout = (page) => <Layout>{page}</Layout>;

export default CheckoutPage;

import { staticI18nProps } from '@/lib/staticI18n';

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: staticI18nProps(locale),
});