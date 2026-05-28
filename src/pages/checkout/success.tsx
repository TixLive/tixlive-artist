import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
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
	const [copied, setCopied] = useState(false);

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
		const shareData = { title: order?.event_title ?? t('success.share_default_title'), url: window.location.origin };
		if (navigator.share) {
			try { await navigator.share(shareData); } catch { /* user cancelled */ }
		} else {
			await navigator.clipboard.writeText(shareData.url);
		}
	};

	const handleCopyOrder = async () => {
		if (!order?.id) return;
		try {
			await navigator.clipboard.writeText(order.id);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {}
	};

	const stillPending = order?.status === 'pending' && !pollLimitReached;

	return (
		<>
			<Head>
				<title>{t('success.page_title')}</title>
			</Head>

			<div className="mx-auto max-w-[760px] px-4 pb-12 pt-8 sm:px-5 md:px-8">
				{/* 1. Status banner */}
				{loading || stillPending ? (
					<div className="mb-8 flex flex-col items-center text-center">
						<div className="mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[var(--bg-2)]">
							<Icon icon="mdi:loading" width={32} className="animate-spin text-[var(--ink)]" />
						</div>
						<h1 className="m-0 text-[28px] font-[800] tracking-[-0.03em] text-[var(--ink)] sm:text-[36px]">
							{t('success.processing_title')}
						</h1>
						<p className="mt-3 max-w-[420px] text-[14px] leading-[1.5] text-[var(--ink-3)]">
							{t('success.processing_body')}
						</p>
					</div>
				) : order && order.status === 'failed' ? (
					<div className="mb-8 flex flex-col items-center text-center">
						<div className="mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#DC2626]/10">
							<Icon icon="mdi:close-circle-outline" width={36} className="text-[#DC2626]" />
						</div>
						<h1 className="m-0 text-[28px] font-[800] tracking-[-0.03em] text-[var(--ink)] sm:text-[36px]">
							{t('success.failed_title')}
						</h1>
						<p className="mt-3 max-w-[420px] text-[14px] leading-[1.5] text-[var(--ink-3)]">
							{t('success.failed_body')}
						</p>
						<Link
							href="/"
							className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--ink)] px-6 py-3 text-[14px] font-[600] tracking-[-0.005em] text-white transition-colors duration-150 hover:bg-[var(--ink-2)]"
						>
							<Icon icon="mdi:arrow-left" width={14} />
							{t('success.back_to_events')}
						</Link>
					</div>
				) : notFound ? (
					<div className="mb-8 flex flex-col items-center text-center">
						<p className="text-[var(--ink-3)]">{t('success.not_found')}</p>
					</div>
				) : (
					<div className="mb-6 flex flex-col items-center text-center">
						<div
							className="animate-checkmark mb-3 flex h-[72px] w-[72px] items-center justify-center rounded-full"
							style={{
								background: 'rgba(61, 123, 92, 0.10)',
								border: '2px solid rgba(61, 123, 92, 0.25)',
							}}
						>
							<div
								className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-[#3D7B5C] text-white"
								style={{ boxShadow: '0 6px 18px -4px rgba(61,123,92,0.5)' }}
							>
								<Icon icon="mdi:check-bold" width={24} />
							</div>
						</div>
						<h1 className="m-0 text-[28px] font-[800] tracking-[-0.03em] text-[var(--ink)] sm:text-[38px]">
							{t('success.paid_title')}
						</h1>
						<p className="mt-2 max-w-[420px] text-[14px] leading-[1.5] text-[var(--ink-3)]">
							{t('success.paid_body')}
						</p>
						{order?.id && (
							<button
								type="button"
								onClick={handleCopyOrder}
								className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11.5px] font-[700] tracking-[0.06em] tabular-nums transition-colors duration-150"
								style={{
									background: copied ? 'var(--ink)' : 'var(--bg-2)',
									color: copied ? 'white' : 'var(--ink)',
									fontFamily: 'var(--font-mono)',
								}}
							>
								{copied ? (
									<>
										<Icon icon="mdi:check" width={11} /> {t('success.copied').toUpperCase()}
									</>
								) : (
									<>
										{order.id} <Icon icon="mdi:content-copy" width={11} />
									</>
								)}
							</button>
						)}
					</div>
				)}

				{/* 2. Order details — only for paid orders */}
				{order && order.status === 'paid' ? (
					<div className="flex flex-col gap-3">
						<div className="overflow-hidden rounded-[18px] bg-[var(--surface)]" style={{ boxShadow: 'var(--shadow-2)' }}>
							<div className="px-6 py-5">
								<div className="text-[10.5px] font-[700] uppercase tracking-[0.12em] text-[var(--ink-3)]">
									{t('success.order_label')}
								</div>
								<h2 className="m-0 mt-1.5 text-[20px] font-[800] tracking-[-0.022em] text-[var(--ink)]">
									{order.event_title}
								</h2>
								{order.session_date && (
									<p className="mt-1 text-[13.5px] tabular-nums text-[var(--ink-3)]">
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
								<div className="border-t border-[var(--line-2)] px-6 py-4">
									{order.items.map((item, i) => {
										const seat = parseSeatId(item.seat_id);
										return (
											<div
												key={i}
												className="flex items-baseline justify-between gap-3 py-1.5 text-[14px] text-[var(--ink)]"
											>
												<span>
													<b className="font-[700]">{item.quantity}×</b>
													<span className="ml-2">{item.name}</span>
													{seat && (
														<span className="ml-2 text-[12.5px] tabular-nums text-[var(--ink-3)]">
															· {t('seating.seat_label', { row: seat.row, seat: seat.seat })}
														</span>
													)}
												</span>
											</div>
										);
									})}
								</div>
							)}
						</div>

						{order.pdf_url && (
							<a
								href={order.pdf_url}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--ink)] px-6 py-[15px] text-[15px] font-[600] tracking-[-0.012em] text-white transition-colors duration-150 hover:bg-[var(--ink-2)]"
								style={{ boxShadow: '0 6px 20px -6px rgba(0,0,0,0.25)' }}
							>
								<Icon icon="mdi:download" width={14} />
								{t('success.download_your_tickets')}
							</a>
						)}

						<button
							type="button"
							onClick={handleShare}
							className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--bg-2)] px-6 py-[13px] text-[14px] font-[600] tracking-[-0.005em] text-[var(--ink)] transition-colors duration-150 hover:bg-[var(--bg-3)]"
						>
							<Icon icon="mdi:share-variant-outline" width={14} />
							{t('success.share_this_event')}
						</button>

						<div className="mt-3 flex flex-wrap justify-center gap-2.5">
							<Link
								href="/"
								className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-2)] px-5 py-2.5 text-[13.5px] font-[600] tracking-[-0.005em] text-[var(--ink)] transition-colors duration-150 hover:bg-[var(--bg-3)]"
							>
								<Icon icon="mdi:chevron-left" width={13} /> {t('success.back_to_events')}
							</Link>
							<Link
								href="/account/tickets"
								className="inline-flex items-center gap-2 rounded-full bg-[var(--ink)] px-5 py-2.5 text-[13.5px] font-[600] tracking-[-0.005em] text-white transition-colors duration-150 hover:bg-[var(--ink-2)]"
							>
								<Icon icon="mdi:ticket-outline" width={13} /> {t('success.view_tickets')}
							</Link>
						</div>

						<p className="m-0 mt-5 text-center text-[12.5px] text-[var(--ink-3)]">
							{t('success.need_help')}{' '}
							<a
								href="mailto:support@tix.live"
								className="font-[700] text-[var(--ink)] underline-offset-2 hover:underline"
							>
								support@tix.live
							</a>
						</p>
					</div>
				) : null}
			</div>

			<style jsx global>{`
				@keyframes checkmark-pop {
					0% { transform: scale(0.4); opacity: 0; }
					60% { transform: scale(1.05); opacity: 1; }
					100% { transform: scale(1); opacity: 1; }
				}
				.animate-checkmark { animation: checkmark-pop 0.5s cubic-bezier(.2,.9,.3,1.3) both; }
			`}</style>
		</>
	);
};

CheckoutSuccessPage.getLayout = (page) => <Layout>{page}</Layout>;

export default CheckoutSuccessPage;

import { staticI18nProps } from '@/lib/staticI18n';

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
	props: staticI18nProps(locale),
});
