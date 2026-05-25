import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { Button, Input, Skeleton } from '@heroui/react';
import { Icon } from '@iconify/react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '@/i18n.config';
import { useTranslation } from 'next-i18next';

import Layout from '@/components/layout/Layout';
import { getSite } from '@/lib/api';
import { IOrganizer } from '@/types';

interface OrderDetails {
  id: string;
  event_title: string;
  session_date: string;
  items: { name: string; quantity: number }[];
  pdf_url?: string;
}

interface SuccessPageProps {
  organizer: IOrganizer;
  orderId: string;
  brandPrimary: string;
  brandAccent: string;
}

export default function CheckoutSuccessPage({ organizer, orderId, brandPrimary, brandAccent }: SuccessPageProps) {
  const { t } = useTranslation('common');
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Magic link state
  const [magicEmail, setMagicEmail] = useState('');
  const [sendingLink, setSendingLink] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [linkError, setLinkError] = useState('');

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/order/${orderId}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setOrder(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleShare = async () => {
    const shareData = {
      title: order?.event_title ?? 'Check out this event!',
      url: window.location.origin,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(shareData.url);
    }
  };

  const handleSendMagicLink = async () => {
    if (!magicEmail.trim()) return;

    setSendingLink(true);
    setLinkError('');
    setLinkSent(false);

    try {
      const res = await fetch('/api/auth/email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: magicEmail.trim() }),
      });

      if (!res.ok) throw new Error('Failed to send');
      setLinkSent(true);
    } catch {
      setLinkError('Couldn\'t send email. Please try again.');
    } finally {
      setSendingLink(false);
    }
  };

  return (
    <Layout organizer={organizer} currentStep={3}>
      <Head>
        <title>Payment Successful!</title>
      </Head>

      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-20">
        {/* 1. Checkmark animation */}
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="animate-checkmark mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#16A34A]/10">
            <Icon icon="mdi:check-bold" width={40} className="text-[#16A34A]" />
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-[1.75rem] font-[700] tracking-[-0.02em] text-[var(--theme-text)] sm:text-[2.25rem]">
            Payment successful!
          </h1>
          <p className="mt-3 text-[0.9375rem] text-[var(--theme-text-muted)]">
            Your tickets are confirmed. Check your email for details.
          </p>
        </div>

        {/* 2. Order details */}
        {loading ? (
          <div className="space-y-4 rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-6">
            <Skeleton className="h-6 w-3/4 rounded-lg" />
            <Skeleton className="h-4 w-1/2 rounded-lg" />
            <Skeleton className="h-4 w-2/3 rounded-lg" />
          </div>
        ) : notFound ? (
          <div className="rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-6 text-center">
            <p className="text-[0.875rem] text-[var(--theme-text-muted)]">Order not found</p>
            <Link
              href="/"
              className="mt-2 inline-block font-[family-name:var(--font-body)] text-[0.875rem] font-[600] text-[var(--brand-accent)] underline underline-offset-2"
            >
              Contact the organizer
            </Link>
          </div>
        ) : order ? (
          <div className="space-y-4">
            {/* Order summary */}
            <div className="overflow-hidden rounded-[22px] border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] shadow-[0_1px_2px_rgba(20,19,18,0.04),0_8px_24px_rgba(20,19,18,0.06)]">
              <div className="px-6 py-5">
                <div className="font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[color-mix(in_srgb,var(--theme-text)_45%,transparent)]">
                  {order.id}
                </div>
                <h2 className="mt-1.5 font-[family-name:var(--font-display)] text-[1.25rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)]">{order.event_title}</h2>
                {order.session_date && (
                  <p className="mt-1 font-[family-name:var(--font-data)] text-[0.875rem] tabular-nums text-[var(--theme-text-muted)]">
                    {new Date(order.session_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
              {order.items && order.items.length > 0 && (
                <div className="border-t border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] px-6 py-4">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-baseline justify-between gap-3 py-1 text-[0.875rem] text-[var(--theme-text)]">
                      <span>{item.name}</span>
                      <span className="font-[family-name:var(--font-data)] tabular-nums text-[var(--theme-text-muted)]">×{item.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Download tickets */}
            {order.pdf_url && (
              <a href={order.pdf_url} target="_blank" rel="noopener noreferrer" className="block">
                <Button
                  className="w-full rounded-full font-[family-name:var(--font-body)] text-[0.9375rem] font-[700] text-[var(--theme-bg)]"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                  size="lg"
                >
                  <Icon icon="mdi:download" width={20} className="mr-2" />
                  Download your tickets
                </Button>
              </a>
            )}

            {/* 4. Save tickets section */}
            <div className="rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-6">
              <h3 className="font-[family-name:var(--font-display)] text-[1.0625rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)]">
                Save tickets to your account
              </h3>
              <p className="mt-1 text-[0.875rem] text-[var(--theme-text-muted)]">
                Enter your email and we&apos;ll send you a 6-digit code. Use it on the sign-in page to access your tickets anytime.
              </p>

              {linkSent ? (
                <div className="mt-4 rounded-xl bg-[#16A34A]/8 p-4 text-[0.875rem] text-[#16A34A]">
                  <Icon icon="mdi:check" className="mr-1 inline" width={16} />
                  Code sent to {magicEmail}. Check your inbox, then{' '}
                  <Link href={`/login?next=%2Fmy-tickets`} className="underline">
                    sign in here
                  </Link>
                  .
                </div>
              ) : (
                <div className="mt-4 flex gap-2">
                  <Input
                    type="email"
                    placeholder="Your email"
                    value={magicEmail}
                    onValueChange={setMagicEmail}
                    classNames={{ inputWrapper: 'rounded-xl' }}
                    size="sm"
                  />
                  <Button
                    variant="solid"
                    className="shrink-0 rounded-full font-[family-name:var(--font-body)] font-[700] text-[var(--theme-bg)]"
                    style={{ backgroundColor: 'var(--brand-primary)' }}
                    onPress={handleSendMagicLink}
                    isLoading={sendingLink}
                    isDisabled={!magicEmail.trim()}
                  >
                    Send code
                  </Button>
                </div>
              )}

              {linkError && (
                <p className="mt-2 text-[0.875rem] text-[#DC2626]">
                  {linkError}
                  <button
                    type="button"
                    onClick={handleSendMagicLink}
                    className="ml-2 underline"
                  >
                    Retry
                  </button>
                </p>
              )}
            </div>

            {/* 5. Share */}
            <div className="flex justify-center pt-2">
              <Button
                variant="bordered"
                className="rounded-full border-[color-mix(in_srgb,var(--theme-text)_12%,transparent)] font-[family-name:var(--font-body)] font-[600] text-[var(--theme-text)]"
                onPress={handleShare}
              >
                Share this event
                <Icon icon="mdi:arrow-right" width={18} className="ml-1" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <style jsx global>{`
        @keyframes checkmark-pop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          60% {
            transform: scale(1.15);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-checkmark {
          animation: checkmark-pop 0.5s ease-out;
        }
      `}</style>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query, locale }) => {
  try {
    const orderId = (query.token as string) ?? '';
    const site = await getSite();

    return {
      props: {
        organizer: site,
        orderId,
        brandPrimary: site.brand_primary_color ?? '#2D2A26',
        brandAccent: site.brand_accent_color ?? '#8B6914',
        ...(await serverSideTranslations(locale ?? 'en', ['common'], nextI18NextConfig)),
      },
    };
  } catch (error) {
    console.error('Success page getServerSideProps error:', error);
    return {
      props: {
        organizer: {
          id: 0,
          name: '',
          slug: '',
          logo_url: null,
          brand_primary_color: null,
          brand_accent_color: null,
          bio: null,
          social_links: {},
        } as IOrganizer,
        orderId: '',
        brandPrimary: '#2D2A26',
        brandAccent: '#8B6914',
        ...(await serverSideTranslations(locale ?? 'en', ['common'], nextI18NextConfig)),
      },
    };
  }
};
