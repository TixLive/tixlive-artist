import { useEffect, useRef, useState } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Drawer, DrawerBody, DrawerContent, DrawerHeader, Input, useDisclosure } from '@heroui/react';
import { Icon } from '@iconify/react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';

import Layout from '@/components/layout/Layout';
import OrderSummary from '@/components/checkout/OrderSummary';
import PromoCodeInput from '@/components/checkout/PromoCodeInput';
import PaymentMethodSelector from '@/components/checkout/PaymentMethodSelector';
import PaymentDetailsSlot from '@/components/checkout/PaymentDetailsSlot';
import PriceBreakdown from '@/components/checkout/PriceBreakdown';
import AttendeeIdentityRow from '@/components/checkout/AttendeeIdentityRow';
import ProfileForm from '@/components/account/ProfileForm';
import { getSite, getEvent, getMe } from '@/lib/api';
import { AttendeePageMiddleware } from '@/middleware/Attendee.Middleware';
import { ACCESS_COOKIE } from '@/lib/cookies';
import { IOrganizer, IEventDetail, ICartItem, IAddonCartItem, IAvailablePaymentMethod, IMe } from '@/types';

const checkoutSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  phone: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

interface CheckoutPageProps {
  organizer: IOrganizer;
  event: IEventDetail;
  session: { id: number; date: string };
  cart: ICartItem[];
  addonCart: IAddonCartItem[];
  brandPrimary: string;
  brandAccent: string;
  eventType: string;
  me: IMe | null;
  meError: boolean;
}

export default function CheckoutPage({ organizer, event, session, cart, addonCart, me, meError }: CheckoutPageProps) {
  const { t } = useTranslation('common');
  const router = useRouter();

  const paymentMethods: IAvailablePaymentMethod[] = event.available_payment_methods ?? [];
  const [selectedPaymentId, setSelectedPaymentId] = useState<number>(paymentMethods[0]?.id ?? 0);
  const [discount, setDiscount] = useState<{ percent?: number; amount?: number } | undefined>();
  const [promoCode, setPromoCode] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  const { isOpen: drawerOpen, onOpen: openDrawer, onOpenChange: setDrawerOpen } = useDisclosure();

  // Generated once per page mount. Two browser tabs = two keys = two orders, which
  // is the correct semantic. The same tab clicking Pay twice = same key = one order.
  const idempotencyKeyRef = useRef<string>('');
  if (!idempotencyKeyRef.current) {
    idempotencyKeyRef.current =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  const isAuthed = me !== null;
  const selectedMethod = paymentMethods.find((m) => m.id === selectedPaymentId) ?? paymentMethods[0];

  const methods = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = methods;

  // Re-enable Pay button after the user closes the drawer (we assume they
  // saved or chose not to). The retry submit will re-check PROFILE_INCOMPLETE
  // server-side, so a half-finished edit can't slip through.
  useEffect(() => {
    if (!drawerOpen && profileIncomplete) {
      setProfileIncomplete(false);
    }
  }, [drawerOpen, profileIncomplete]);

  const submitOrder = async (values?: CheckoutFormValues) => {
    setSubmitting(true);
    setSubmitError('');

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
        promo_code: promoCode || undefined,
        locale: router.locale ?? 'en',
        idempotency_key: idempotencyKeyRef.current,
      };

      // Authed: server reads PII from User row via JWT. We do NOT send PII fields.
      // Anonymous: include the form values (proxy enforces the same on its side).
      const body = isAuthed
        ? baseBody
        : {
            ...baseBody,
            email: values?.email,
            first_name: values?.first_name,
            last_name: values?.last_name,
            phone: values?.phone ?? '',
          };

      const res = await fetch('/api/order/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const response = await res.json();

      if (!res.ok) {
        const code = String(response.code ?? '');
        if (code.includes('PROFILE_INCOMPLETE')) {
          // Open the drawer so the user can fill missing first/last/phone in
          // place — cart stays in the DOM, no navigation, no lost state.
          setProfileIncomplete(true);
          setSubmitting(false);
          openDrawer();
          return;
        }
        if (code.includes('SOLD_OUT') || code.includes('NO_AVAILABLE_TICKETS')) {
          setSubmitError(t('checkout.error_sold_out'));
        } else if (code.includes('PAYMENT_METHOD')) {
          setSubmitError(t('checkout.error_payment_method'));
        } else if (res.status === 400) {
          setSubmitError(t('checkout.error_invalid_order'));
        } else if (res.status >= 500) {
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

  const onSubmit = (values: CheckoutFormValues) => submitOrder(values);
  const onAuthedSubmit = () => submitOrder();

  const ctaLabel = selectedMethod
    ? t('checkout.pay_with', { provider: selectedMethod.name })
    : t('checkout.proceed_to_payment');

  return (
    <Layout organizer={organizer}>
      <Head>
        <title>Checkout - {event.title}</title>
      </Head>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Back link */}
        <Button
          variant="light"
          onPress={() => router.back()}
          className="mb-8 inline-flex items-center gap-1 text-[0.875rem] text-[var(--theme-text-muted)] transition-colors duration-200 hover:text-[var(--theme-text)]"
        >
          <Icon icon="mdi:arrow-left" width={18} />
          {t('checkout.back')}
        </Button>

        {/* Welcome banner for authed visitors */}
        {isAuthed && me && (
          <div className="mb-6 flex items-center gap-2">
            <Icon icon="mdi:check-circle" width={20} className="text-[var(--brand-accent)]" />
            <h2 className="font-[family-name:var(--font-display)] text-[1.125rem] font-[700] text-[var(--theme-text)]">
              {t('checkout.welcome_back', { name: me.first_name || me.email })}
            </h2>
          </div>
        )}

        {/* Two-column layout: form left, summary right */}
        <div className="md:flex md:gap-10">
          {/* Left column — form */}
          <div className="min-w-0 flex-1">
            <FormProvider {...methods}>
              <form onSubmit={isAuthed ? (e) => { e.preventDefault(); onAuthedSubmit(); } : handleSubmit(onSubmit)} noValidate>
                <div className="space-y-6">
                  {/* Mobile order summary (above form) */}
                  <div className="md:hidden">
                    <OrderSummary event={event} sessionDate={session.date} cart={cart} addonCart={addonCart} />
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
                    <section className="space-y-4">
                      <h3 className="font-[family-name:var(--font-display)] text-[1.125rem] font-[700] text-[var(--theme-text)]">
                        {t('checkout.your_details')}
                      </h3>

                      {meError && (
                        <div className="rounded-xl bg-[color-mix(in_srgb,var(--theme-text)_5%,transparent)] p-3 text-[0.8125rem] text-[var(--theme-text-muted)]">
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

                      <Input
                        label={t('checkout.phone_optional')}
                        type="tel"
                        {...register('phone')}
                        classNames={{ inputWrapper: 'rounded-xl' }}
                      />
                    </section>
                  )}

                  {/* Promo code */}
                  <section>
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
                    <div className="rounded-2xl bg-[#DC2626]/8 p-4 text-center text-[0.875rem] text-[#DC2626]">
                      {submitError}
                    </div>
                  )}

                  {/* Profile incomplete banner */}
                  {profileIncomplete && (
                    <div className="rounded-2xl bg-[color-mix(in_srgb,var(--brand-accent)_8%,transparent)] p-4 text-center text-[0.875rem] text-[var(--theme-text)]">
                      {t('checkout.profile_incomplete')}
                    </div>
                  )}

                  {/* Submit CTA */}
                  <div className="space-y-3">
                    <Button
                      type="submit"
                      className="w-full rounded-xl font-[family-name:var(--font-display)] font-[700] text-[var(--theme-bg)]"
                      style={{ backgroundColor: 'var(--brand-primary)' }}
                      size="lg"
                      isLoading={submitting}
                      isDisabled={submitting}
                    >
                      {submitting ? t('checkout.processing') : ctaLabel}
                      {!submitting && <Icon icon="mdi:arrow-right" className="ml-1" width={20} />}
                    </Button>

                    <p className="text-center text-[0.75rem] text-[var(--theme-text-muted)]">
                      {t('checkout.secure_payment_note')}
                    </p>
                  </div>
                </div>
              </form>
            </FormProvider>
          </div>

          {/* Right column — sticky order summary (desktop only) */}
          <aside className="hidden w-[360px] flex-shrink-0 md:block">
            <div className="sticky top-24">
              <OrderSummary event={event} sessionDate={session.date} cart={cart} addonCart={addonCart} />

              <div className="mt-4 rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-5">
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
          </aside>
        </div>
      </div>

      {/* Edit-profile drawer — preserves cart state, no navigation */}
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
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { req, query, locale } = ctx;
  try {
    // Support both GET (query params) and POST (body) for cart data
    let eventSlug: string | undefined;
    let sessionId: string | undefined;
    let cartJson: string | undefined;
    let addonsJson: string | undefined;

    if (req.method === 'POST') {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const rawBody = Buffer.concat(chunks).toString();
      const params = new URLSearchParams(rawBody);
      eventSlug = params.get('event') ?? undefined;
      sessionId = params.get('session') ?? undefined;
      cartJson = params.get('cart') ?? undefined;
      addonsJson = params.get('addons') ?? undefined;
    } else {
      eventSlug = query.event as string;
      sessionId = query.session as string;
      cartJson = query.cart as string;
      addonsJson = query.addons as string;
    }

    if (!eventSlug || !cartJson) {
      return { redirect: { destination: '/', permanent: false } };
    }

    const [site, event] = await Promise.all([getSite(), getEvent(eventSlug)]);

    if (!event) {
      return { redirect: { destination: '/', permanent: false } };
    }

    let cart: ICartItem[];
    try {
      cart = typeof cartJson === 'string' ? JSON.parse(cartJson) : cartJson;
    } catch {
      return { redirect: { destination: '/', permanent: false } };
    }

    if (!cart || cart.length === 0) {
      return { redirect: { destination: '/', permanent: false } };
    }

    let addonCart: IAddonCartItem[] = [];
    if (addonsJson) {
      try {
        addonCart = typeof addonsJson === 'string' ? JSON.parse(addonsJson) : addonsJson;
      } catch {
        addonCart = [];
      }
    }

    // Find the selected session
    const session = event.sessions?.find((s: { id: number }) => String(s.id) === sessionId) ?? event.sessions?.[0];

    // Optional auth: load profile for authed visitors. A failure here is non-fatal —
    // the page falls back to the anonymous form with a banner so a temporary
    // backend hiccup never blocks a paying customer.
    let me: IMe | null = null;
    let meError = false;
    const attendee = await AttendeePageMiddleware(ctx);
    if (attendee) {
      const token = ctx.req.cookies?.[ACCESS_COOKIE] || '';
      try {
        me = await getMe(token);
      } catch {
        me = null;
        meError = true;
      }
    }

    return {
      props: {
        organizer: site,
        event,
        session: session ? { id: session.id, date: session.date } : { id: 0, date: '' },
        cart,
        addonCart,
        brandPrimary: site.brand_primary_color ?? '#6366f1',
        brandAccent: site.brand_accent_color ?? '#818cf8',
        eventType: event.event_type ?? 'general',
        me,
        meError,
        ...(await serverSideTranslations(locale ?? 'en', ['common'])),
      },
    };
  } catch (error) {
    console.error('Checkout getServerSideProps error:', error);
    return { redirect: { destination: '/', permanent: false } };
  }
};
