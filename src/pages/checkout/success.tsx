import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import Layout from '@/components/layout/Layout';
import type { NextPageWithLayout } from '@/pages/_app';
import { parseSeatId } from '@/lib/seat';
import { useGetOrderByToken } from '@/queries/orders/useGetOrderByToken';
import { useBuyFlowStep } from '@/contexts/LayoutContext';
import type { IOrderDetail } from '@/types';

interface OrderDetails extends Pick<IOrderDetail, 'id' | 'event_title' | 'session_date' | 'pdf_url'> {
  status: 'paid' | 'pending' | 'failed';
  items: { name: string; quantity: number; seat_id?: string | null }[];
}

const MAX_POLLS = 20;
const POLL_INTERVAL_MS = 3000;

const CheckoutSuccessPage: NextPageWithLayout = function CheckoutSuccessPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  useBuyFlowStep(3);
  const orderId = (router.query.token as string) ?? '';
  const pollCountRef = useRef(0);
  const [pollLimitReached, setPollLimitReached] = useState(false);

  const { data: order, isError } = useGetOrderByToken({
    token: router.isReady && orderId ? orderId : null,
    refetchInterval: (q) => {
      const d = (q as { state: { data: OrderDetails | undefined } }).state.data;
      if (!d) return POLL_INTERVAL_MS;
      const stillWaiting = d.status === 'pending' || (d.status === 'paid' && !d.pdf_url);
      if (!stillWaiting) return false;
      pollCountRef.current += 1;
      if (pollCountRef.current >= MAX_POLLS) return false;
      return POLL_INTERVAL_MS;
    },
  }) as { data: OrderDetails | undefined; isError: boolean };

  useEffect(() => {
    if (!order) return;
    const stillWaiting = order.status === 'pending' || (order.status === 'paid' && !order.pdf_url);
    if (stillWaiting && pollCountRef.current >= MAX_POLLS) setPollLimitReached(true);
  }, [order]);

  const notFound = (router.isReady && !orderId) || isError;
  const loading = !notFound && !order;

  const handleShare = async () => {
    const shareData = {
      title: order?.event_title ?? 'Check out this event!',
      url: window.location.origin,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(shareData.url);
    }
  };

  const stillPending = order?.status === 'pending' && !pollLimitReached;

  return (
    <>
      <Head>
        <title>Payment Successful!</title>
      </Head>

      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-20">
        {/* 1. Status banner */}
        {loading || stillPending ? (
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
        ) : notFound ? (
          <div className="mb-10 flex flex-col items-center text-center">
            <p className="text-[var(--theme-text-muted)]">Order not found.</p>
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
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-checkmark { animation: checkmark-pop 0.5s ease-out; }
      `}</style>
    </>
  );
};

CheckoutSuccessPage.getLayout = (page) => <Layout>{page}</Layout>;

export default CheckoutSuccessPage;

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '@/i18n.config';

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: await serverSideTranslations(locale ?? 'ro', ['common'], nextI18NextConfig),
});
