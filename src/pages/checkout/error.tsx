import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import Layout from '@/components/layout/Layout';
import type { NextPageWithLayout } from '@/pages/_app';
import { useGetOrderByToken } from '@/queries/orders/useGetOrderByToken';
import { useBuyFlowStep } from '@/contexts/LayoutContext';

const CheckoutErrorPage: NextPageWithLayout = function CheckoutErrorPage() {
	const { t } = useTranslation('common');
	const router = useRouter();
	useBuyFlowStep(2);
	const token = (router.query.token as string) ?? '';

	// Single fetch (no polling) — only to recover the event so we can offer
	// "back to event". A cancelled/failed order is still readable by token.
	const { data: order } = useGetOrderByToken({
		token: router.isReady && token ? token : null,
		refetchInterval: false,
	});

	const eventSlug = order?.event_slug;
	const eventHref = eventSlug ? `/events/${eventSlug}` : '/';

	return (
		<>
			<Head>
				<title>{t('payment_error.page_title')}</title>
			</Head>

			<div className="mx-auto max-w-[760px] px-4 pb-12 pt-8 sm:px-5 md:px-8">
				{/* Hero — failure */}
				<div className="flex flex-col items-center gap-3 text-center">
					<div
						className="animate-errorpop relative flex h-[72px] w-[72px] items-center justify-center rounded-full"
						style={{ background: 'rgba(220, 38, 38, 0.10)', border: '2px solid rgba(220, 38, 38, 0.22)' }}
					>
						<div
							className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-[#DC2626] text-white"
							style={{ boxShadow: '0 6px 18px -4px rgba(220,38,38,0.45)' }}
						>
							<Icon icon="mdi:close-thick" width={24} />
						</div>
					</div>
					<h1 className="m-0 mt-1.5 text-[28px] font-[800] tracking-[-0.03em] text-[var(--ink)] sm:text-[38px]">
						{t('payment_error.title')}
					</h1>
					<p className="m-0 max-w-[420px] text-[14px] leading-[1.5] text-[var(--ink-3)]">
						{order?.event_title
							? t('payment_error.body_event', { event: order.event_title })
							: t('payment_error.body')}
					</p>

					{/* Footer nav */}
					<div className="mt-6 flex flex-wrap justify-center gap-2.5">
						<Link
							href={eventHref}
							className="inline-flex items-center gap-2 rounded-full bg-[var(--ink)] px-6 py-3 text-[14px] font-[600] tracking-[-0.005em] text-white transition-colors duration-150 hover:bg-[var(--ink-2)]"
						>
							<Icon icon="mdi:refresh" width={14} />
							{eventSlug ? t('payment_error.back_to_event') : t('payment_error.back_to_events')}
						</Link>
						{eventSlug && (
							<Link
								href="/"
								className="inline-flex items-center gap-2 rounded-full bg-[var(--surface)] px-[22px] py-3 text-[14px] font-[600] tracking-[-0.005em] text-[var(--ink)] transition-colors duration-150 hover:bg-[var(--bg-2)]"
								style={{ border: '1px solid var(--line)' }}
							>
								{t('payment_error.back_to_events')}
							</Link>
						)}
					</div>

					{/* Support */}
					<p className="m-0 mt-6 text-center text-[12.5px] text-[var(--ink-3)]">
						{t('payment_error.need_help')}{' '}
						<a href="mailto:support@tix.live" className="font-[700] text-[var(--ink)] underline-offset-2 hover:underline">
							support@tix.live
						</a>
					</p>
				</div>
			</div>

			<style jsx global>{`
				@keyframes errorpop {
					0% { transform: scale(0.4); opacity: 0; }
					60% { transform: scale(1.05); opacity: 1; }
					100% { transform: scale(1); opacity: 1; }
				}
				.animate-errorpop { animation: errorpop 0.45s cubic-bezier(.2,.9,.3,1.3) both; }
			`}</style>
		</>
	);
};

CheckoutErrorPage.getLayout = (page) => <Layout>{page}</Layout>;

export default CheckoutErrorPage;

import { staticI18nProps } from '@/lib/staticI18n';

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
	props: staticI18nProps(locale),
});
