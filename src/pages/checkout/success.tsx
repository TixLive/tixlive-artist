import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { Button, Input, Skeleton } from '@heroui/react';
import { Icon } from '@iconify/react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';

import Layout from '@/components/layout/Layout';
import { getSite } from '@/lib/api';
import { IOrganizer } from '@/types';

interface OrderDetails {
  id: string;
  event_title: string;
  session_date: string;
  tickets: { name: string; quantity: number }[];
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
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: magicEmail, order_id: orderId }),
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
    <Layout organizer={organizer}>
      <Head>
        <title>Payment Successful!</title>
      </Head>

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
        {/* 1. Checkmark animation */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="animate-checkmark mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <Icon icon="mdi:check-bold" width={40} className="text-green-500" />
          </div>
          <h1
            className="text-[1.5rem] font-bold sm:text-[2rem]"
            style={{ color: 'var(--brand-primary)' }}
          >
            Payment successful!
          </h1>
          <p className="mt-2 text-[0.875rem]" style={{ color: 'var(--theme-text-muted)' }}>
            Your tickets are confirmed. Check your email for details.
          </p>
        </div>

        {/* 2. Order details */}
        {loading ? (
          <div className="space-y-4 rounded-xl p-6" style={{ backgroundColor: 'var(--theme-surface)' }}>
            <Skeleton className="h-6 w-3/4 rounded-lg" />
            <Skeleton className="h-4 w-1/2 rounded-lg" />
            <Skeleton className="h-4 w-2/3 rounded-lg" />
          </div>
        ) : notFound ? (
          <div className="rounded-xl p-6 text-center" style={{ backgroundColor: 'var(--theme-surface)' }}>
            <p className="text-[0.875rem]" style={{ color: 'var(--theme-text-muted)' }}>Order not found</p>
            <Link
              href="/"
              className="mt-2 inline-block text-[0.875rem] font-medium underline"
              style={{ color: 'var(--brand-primary)' }}
            >
              Contact the organizer
            </Link>
          </div>
        ) : order ? (
          <div className="space-y-6">
            {/* Order summary */}
            <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--theme-surface)' }}>
              <h2 className="text-[1.125rem] font-semibold" style={{ color: 'var(--theme-text)' }}>{order.event_title}</h2>
              {order.session_date && (
                <p className="mt-1 text-[0.875rem]" style={{ color: 'var(--theme-text-muted)' }}>
                  {new Date(order.session_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              )}
              {order.tickets && order.tickets.length > 0 && (
                <div className="mt-3 space-y-1">
                  {order.tickets.map((ticket, i) => (
                    <p key={i} className="text-[0.875rem] text-gray-700">
                      {ticket.quantity}x {ticket.name}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Download tickets */}
            {order.pdf_url && (
              <a href={order.pdf_url} download>
                <Button
                  className="w-full rounded-full text-white font-semibold"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                  size="lg"
                >
                  <Icon icon="mdi:download" width={20} className="mr-2" />
                  Download your tickets
                </Button>
              </a>
            )}

            {/* 4. Magic link section */}
            <div className="rounded-xl border border-gray-200 p-6">
              <h3 className="text-[1.125rem] font-semibold" style={{ color: 'var(--theme-text)' }}>
                Save tickets to your account
              </h3>
              <p className="mt-1 text-[0.875rem]" style={{ color: 'var(--theme-text-muted)' }}>
                Access your tickets anytime from any device. Enter your email and we&apos;ll send a link.
              </p>

              {linkSent ? (
                <div className="mt-4 rounded-xl bg-green-50 p-3 text-[0.875rem] text-green-700">
                  ✓ Check your inbox! We sent a link to {magicEmail}. It expires in 24 hours.
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
                    variant="flat"
                    className="shrink-0 rounded-xl"
                    onPress={handleSendMagicLink}
                    isLoading={sendingLink}
                    isDisabled={!magicEmail.trim()}
                  >
                    Send link
                  </Button>
                </div>
              )}

              {linkError && (
                <p className="mt-2 text-[0.875rem] text-red-500">
                  ✕ {linkError}
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
            <div className="flex justify-center">
              <Button
                variant="ghost"
                className="rounded-full"
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
    const orderId = (query.order_id as string) ?? '';
    const site = await getSite();

    return {
      props: {
        organizer: site,
        orderId,
        brandPrimary: site.brand_primary_color ?? '#6366f1',
        brandAccent: site.brand_accent_color ?? '#818cf8',
        ...(await serverSideTranslations(locale ?? 'en', ['common'])),
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
        brandPrimary: '#6366f1',
        brandAccent: '#818cf8',
        ...(await serverSideTranslations(locale ?? 'en', ['common'])),
      },
    };
  }
};
