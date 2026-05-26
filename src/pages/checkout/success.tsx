import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '@/i18n.config';
import { useTranslation } from 'next-i18next';

import Layout from '@/components/layout/Layout';
import { getSite } from '@/lib/api';
import { parseSeatId } from '@/lib/seat';
import { directGetOrder } from '@/lib/directApi';
import { IOrganizer } from '@/types';

interface OrderDetails {
  id: string;
  status: 'paid' | 'pending' | 'failed';
  event_title: string;
  session_date: string;
  items: { name: string; quantity: number; seat_id?: string | null }[];
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


  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    let cancelled = false;
    let pollCount = 0;
    const MAX_POLLS = 20; // ~60s total

    const fetchOrder = async () => {
      try {
        const data: OrderDetails = await directGetOrder(orderId) as unknown as OrderDetails;
        if (cancelled) return;

        // Keep polling while payment is pending, or while paid but PDF not yet generated
        const stillWaiting = data.status === 'pending' || (data.status === 'paid' && !data.pdf_url);
        if (stillWaiting && pollCount < MAX_POLLS) {
          pollCount++;
          setTimeout(fetchOrder, 3000);
          return;
        }

        setOrder(data);
        setLoading(false);
      } catch {
        if (!cancelled) { setNotFound(true); setLoading(false); }
      }
    };

    fetchOrder();
    return () => { cancelled = true; };
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

  return (
    <Layout organizer={organizer} currentStep={3}>
      <Head>
        <title>Payment Successful!</title>
      </Head>

      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-20">
        {/* 1. Status banner */}
        {loading || (order && order.status === 'pending') ? (
          <div className="mb-10 flex flex-col items-center text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--theme-surface)]">
              <Icon icon="mdi:loading" width={40} className="animate-spin text-[var(--brand-primary)]" />
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-[1.75rem] font-[700] tracking-[-0.02em] text-[var(--theme-text)] sm:text-[2.25rem]">
              Se procesează plata...
            </h1>
            <p className="mt-3 text-[0.9375rem] text-[var(--theme-text-muted)]">
              Așteptăm confirmarea de la bancă. Nu închideți pagina.
            </p>
          </div>
        ) : order && order.status === 'failed' ? (
          <div className="mb-10 flex flex-col items-center text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#DC2626]/10">
              <Icon icon="mdi:close-circle-outline" width={40} className="text-[#DC2626]" />
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-[1.75rem] font-[700] tracking-[-0.02em] text-[var(--theme-text)] sm:text-[2.25rem]">
              Plata nu a reușit
            </h1>
            <p className="mt-3 text-[0.9375rem] text-[var(--theme-text-muted)]">
              Cardul a fost refuzat de bancă. Întoarce-te și încearcă din nou.
            </p>
            <a href="/" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-6 py-3 font-[family-name:var(--font-display)] text-[0.9375rem] font-[700] text-[var(--theme-bg)]">
              <Icon icon="mdi:arrow-left" width={18} />
              Înapoi la evenimente
            </a>
          </div>
        ) : (
          <div className="mb-10 flex flex-col items-center text-center">
            <div className="animate-checkmark mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#16A34A]/10">
              <Icon icon="mdi:check-bold" width={40} className="text-[#16A34A]" />
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-[1.75rem] font-[700] tracking-[-0.02em] text-[var(--theme-text)] sm:text-[2.25rem]">
              Plată reușită!
            </h1>
            <p className="mt-3 text-[0.9375rem] text-[var(--theme-text-muted)]">
              Biletele tale sunt confirmate. Verifică email-ul pentru detalii.
            </p>
          </div>
        )}

        {/* 2. Order details — only for paid orders */}
        {order && order.status === 'paid' ? (
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
                  {order.items.map((item, i) => {
                    const seat = parseSeatId(item.seat_id);
                    return (
                    <div key={i} className="flex items-baseline justify-between gap-3 py-1 text-[0.875rem] text-[var(--theme-text)]">
                      <span>
                        {item.name}
                        {seat && (
                          <span className="ml-2 font-[family-name:var(--font-data)] text-[0.8125rem] text-[var(--theme-text-muted)]">
                            · {t('seating.seat_label', { row: seat.row, seat: seat.seat })}
                          </span>
                        )}
                      </span>
                      <span className="font-[family-name:var(--font-data)] tabular-nums text-[var(--theme-text-muted)]">×{item.quantity}</span>
                    </div>
                    );
                  })}
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

            {/* 4. Share */}
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
