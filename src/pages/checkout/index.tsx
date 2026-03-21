import { useState } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { Button, Input } from '@heroui/react';
import { Icon } from '@iconify/react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';

import Layout from '@/components/layout/Layout';
import OrderSummary from '@/components/checkout/OrderSummary';
import PromoCodeInput from '@/components/checkout/PromoCodeInput';
import PaymentMethodSelector from '@/components/checkout/PaymentMethodSelector';
import PaymentDetailsSlot from '@/components/checkout/PaymentDetailsSlot';
import PriceBreakdown from '@/components/checkout/PriceBreakdown';
import { getSite, getEvent } from '@/lib/api';
import { IOrganizer, IEventDetail, ICartItem, IAvailablePaymentMethod } from '@/types';

const checkoutSchema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

interface CheckoutPageProps {
  organizer: IOrganizer;
  event: IEventDetail;
  session: { id: number; date: string };
  cart: ICartItem[];
  brandPrimary: string;
  brandAccent: string;
  eventType: string;
}

export default function CheckoutPage({ organizer, event, session, cart }: CheckoutPageProps) {
  const { t } = useTranslation('common');
  const router = useRouter();

  const paymentMethods: IAvailablePaymentMethod[] = event.available_payment_methods ?? [];
  const [selectedPaymentId, setSelectedPaymentId] = useState<number>(paymentMethods[0]?.id ?? 0);
  const [discount, setDiscount] = useState<{ percent?: number; amount?: number } | undefined>();
  const [promoCode, setPromoCode] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const selectedMethod = paymentMethods.find((m) => m.id === selectedPaymentId) ?? paymentMethods[0];

  const methods = useForm<CheckoutFormValues>({
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

  const onSubmit = async (values: CheckoutFormValues) => {
    setSubmitting(true);
    setSubmitError('');

    try {
      const parsed = checkoutSchema.parse(values);

      const body = {
        session_id: session.id,
        payment_method_id: selectedPaymentId,
        email: parsed.email,
        first_name: parsed.first_name,
        last_name: parsed.last_name,
        phone: parsed.phone ?? '',
        cart: cart.map((item) => ({
          ticket_package_id: item.ticket_type_id,
          quantity: item.quantity,
        })),
        promo_code: promoCode || undefined,
        locale: router.locale ?? 'en',
      };

      const res = await fetch('/api/order/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const response = await res.json();
      if (!res.ok) throw new Error(response.error ?? 'Order failed');
      if (!response.payment_url) throw new Error('No payment URL received. Please try again.');
      window.location.href = response.payment_url;
    } catch (err: unknown) {
      const error = err as { message?: string; code?: string };
      if (error.code === 'SOLD_OUT' || error.message?.includes('sold out')) {
        setSubmitError('Sorry, tickets just sold out.');
      } else {
        setSubmitError(error.message ?? 'Something went wrong. Please try again.');
      }
      setSubmitting(false);
    }
  };

  const ctaLabel = selectedMethod
    ? t('checkout.pay_with', { provider: selectedMethod.name })
    : t('checkout.proceed_to_payment');

  return (
    <Layout organizer={organizer}>
      <Head>
        <title>Checkout - {event.title}</title>
      </Head>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Back link */}
        <Button
          variant="light"
          onPress={() => router.back()}
          className="mb-6 inline-flex items-center gap-1 text-[0.875rem] text-[var(--theme-text-muted)]"
        >
          <Icon icon="mdi:arrow-left" width={18} />
          {t('checkout.back')}
        </Button>

        {/* Two-column layout: form left, summary right */}
        <div className="md:flex md:gap-8">
          {/* Left column — form */}
          <div className="min-w-0 flex-1">
            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="space-y-6">
                  {/* Mobile order summary (above form) */}
                  <div className="md:hidden">
                    <OrderSummary event={event} sessionDate={session.date} cart={cart} />
                  </div>

                  {/* Attendee details */}
                  <section className="space-y-4">
                    <h3 className="font-[family-name:var(--font-display)] text-[1.125rem] font-semibold text-[var(--theme-text)]">
                      {t('checkout.your_details')}
                    </h3>

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
                    <div className="rounded-xl bg-red-50 p-3 text-center text-[0.875rem] text-red-600">
                      {submitError}
                    </div>
                  )}

                  {/* Submit CTA */}
                  <div className="space-y-3">
                    <Button
                      type="submit"
                      className="w-full rounded-full font-[family-name:var(--font-display)] font-semibold text-white"
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
          <aside className="hidden w-[340px] flex-shrink-0 md:block">
            <div className="sticky top-20">
              <OrderSummary event={event} sessionDate={session.date} cart={cart} />

              <div className="mt-4 rounded-xl border border-[var(--theme-surface)] p-4">
                <PriceBreakdown
                  items={cart}
                  discount={discount}
                  currency={cart[0]?.currency ?? 'USD'}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, query, locale }) => {
  try {
    // Support both GET (query params) and POST (body) for cart data
    let eventSlug: string | undefined;
    let sessionId: string | undefined;
    let cartJson: string | undefined;

    if (req.method === 'POST') {
      // HTML form POST sends application/x-www-form-urlencoded
      // Next.js parses this into query params automatically
      // Read raw body and parse as URL-encoded form data
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const rawBody = Buffer.concat(chunks).toString();
      const params = new URLSearchParams(rawBody);
      eventSlug = params.get('event') ?? undefined;
      sessionId = params.get('session') ?? undefined;
      cartJson = params.get('cart') ?? undefined;
    } else {
      eventSlug = query.event as string;
      sessionId = query.session as string;
      cartJson = query.cart as string;
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

    // Find the selected session
    const session = event.sessions?.find((s: { id: number }) => String(s.id) === sessionId) ?? event.sessions?.[0];

    return {
      props: {
        organizer: site,
        event,
        session: session ? { id: session.id, date: session.date } : { id: 0, date: '' },
        cart,
        brandPrimary: site.brand_primary_color ?? '#6366f1',
        brandAccent: site.brand_accent_color ?? '#818cf8',
        eventType: event.event_type ?? 'general',
        ...(await serverSideTranslations(locale ?? 'en', ['common'])),
      },
    };
  } catch (error) {
    console.error('Checkout getServerSideProps error:', error);
    return { redirect: { destination: '/', permanent: false } };
  }
};
