import { useState, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import Layout from '@/components/layout/Layout';
import type { NextPageWithLayout } from '@/pages/_app';
import { parseSeatId } from '@/lib/seat';
import { useGetOrderByToken } from '@/queries/orders/useGetOrderByToken';
import { useGetEvent } from '@/queries/events/useGetEvent';
import { useBuyFlowStep } from '@/contexts/LayoutContext';
import type { IOrderDetail } from '@/types';

const MAX_POLLS = 20;
const POLL_INTERVAL_MS = 3000;

const CheckoutSuccessPage: NextPageWithLayout = function CheckoutSuccessPage() {
	const { t, i18n } = useTranslation('common');
	const router = useRouter();
	useBuyFlowStep(3);
	const orderId = (router.query.token as string) ?? '';
	const pollCountRef = useRef(0);
	const [pollLimitReached, setPollLimitReached] = useState(false);
	const [copied, setCopied] = useState(false);

	const { data: order, isError } = useGetOrderByToken({
		token: router.isReady && orderId ? orderId : null,
		refetchInterval: (q) => {
			const d = (q as { state: { data: IOrderDetail | undefined } }).state.data;
			if (!d) return POLL_INTERVAL_MS;
			const stillWaiting = d.status === 'pending' || (d.status === 'paid' && !d.pdf_url);
			if (!stillWaiting) return false;
			pollCountRef.current += 1;
			// Give up after MAX_POLLS — flip state here (a react-query callback, not
			// render/effect) so the view re-renders out of the spinner once we stop.
			if (pollCountRef.current >= MAX_POLLS) {
				setPollLimitReached(true);
				return false;
			}
			return POLL_INTERVAL_MS;
		},
	}) as { data: IOrderDetail | undefined; isError: boolean };

	// Enrich the ticket card with the event banner + venue once the order resolves.
	const { data: event } = useGetEvent({ slug: order?.event_slug ?? null });

	const notFound = (router.isReady && !orderId) || isError;
	const loading = !notFound && !order;
	const isPaid = order?.status === 'paid';
	const isFailed = order?.status === 'failed';
	const isPending = order?.status === 'pending';
	const awaitingPdf = isPaid && !order?.pdf_url;
	// Spinner while we genuinely wait; once polling is exhausted we resolve to a
	// terminal screen (paid, or a calm "still processing" notice).
	const showProcessing = loading || ((isPending || awaitingPdf) && !pollLimitReached);
	const pendingTimeout = isPending && pollLimitReached;

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

	// ----- derived display data (paid view) -----
	const dateSource = order?.session_date || event?.date_start || '';
	const fmtDate = (d: string) =>
		d ? new Date(d).toLocaleDateString(i18n.language, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '';
	const fmtTime = (d: string) =>
		d ? new Date(d).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' }) : '';

	const items = order?.items ?? [];
	const totalQty = items.reduce((s, i) => s + i.quantity, 0);
	const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
	const fee = order?.total != null ? order.total - subtotal : 0;

	const calendarUrl = (() => {
		if (!order || !dateSource) return null;
		const start = new Date(dateSource);
		if (Number.isNaN(start.getTime())) return null;
		const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
		const stamp = (dt: Date) => dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
		const params = new URLSearchParams({
			action: 'TEMPLATE',
			text: order.event_title,
			dates: `${stamp(start)}/${stamp(end)}`,
			...(event?.venue_name ? { location: [event.venue_name, event.venue_address].filter(Boolean).join(', ') } : {}),
		});
		return `https://calendar.google.com/calendar/render?${params.toString()}`;
	})();

	const banner = event?.poster_url ?? null;

	return (
		<>
			<Head>
				<title>{t('success.page_title')}</title>
			</Head>

			<div className="mx-auto max-w-[760px] px-4 pb-12 pt-8 sm:px-5 md:px-8">
				{/* ===== Non-paid states ===== */}
				{showProcessing ? (
					<div className="flex flex-col items-center text-center">
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
				) : pendingTimeout ? (
					<div className="flex flex-col items-center text-center">
						<div className="mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[var(--bg-2)]">
							<Icon icon="mdi:clock-outline" width={32} className="text-[var(--ink)]" />
						</div>
						<h1 className="m-0 text-[28px] font-[800] tracking-[-0.03em] text-[var(--ink)] sm:text-[36px]">
							{t('success.processing_title')}
						</h1>
						<p className="mt-3 max-w-[420px] text-[14px] leading-[1.5] text-[var(--ink-3)]">
							{t('success.processing_timeout_body')}
						</p>
						{order?.id && (
							<button
								type="button"
								onClick={handleCopyOrder}
								className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11.5px] font-[700] tracking-[0.06em] tabular-nums transition-colors duration-150"
								style={{ background: copied ? 'var(--ink)' : 'var(--bg-2)', color: copied ? 'white' : 'var(--ink)', fontFamily: 'var(--font-mono)' }}
							>
								{copied ? (<><Icon icon="mdi:check" width={11} /> {t('success.copied').toUpperCase()}</>) : (<>{order.id} <Icon icon="mdi:content-copy" width={11} /></>)}
							</button>
						)}
					</div>
				) : isFailed ? (
					<div className="flex flex-col items-center text-center">
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
							href={order.event_slug ? `/events/${order.event_slug}` : '/'}
							className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--ink)] px-6 py-3 text-[14px] font-[600] tracking-[-0.005em] text-white transition-colors duration-150 hover:bg-[var(--ink-2)]"
						>
							<Icon icon="mdi:arrow-left" width={14} />
							{t('success.back_to_event')}
						</Link>
					</div>
				) : notFound ? (
					<div className="flex flex-col items-center text-center">
						<p className="text-[var(--ink-3)]">{t('success.not_found')}</p>
					</div>
				) : isPaid && order ? (
					/* ===== Paid — thank-you screen ===== */
					<>
						{/* Hero confirmation */}
						<div className="mb-6 flex flex-col items-center gap-3 text-center">
							<div
								className="animate-checkmark relative flex h-[72px] w-[72px] items-center justify-center rounded-full"
								style={{ background: 'rgba(61, 123, 92, 0.10)', border: '2px solid rgba(61, 123, 92, 0.25)' }}
							>
								<div
									className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-[#3D7B5C] text-white"
									style={{ boxShadow: '0 6px 18px -4px rgba(61,123,92,0.5)' }}
								>
									<Icon icon="mdi:check-bold" width={24} />
								</div>
							</div>
							<h1 className="m-0 mt-1.5 text-[28px] font-[800] tracking-[-0.03em] text-[var(--ink)] sm:text-[38px]">
								{t('success.paid_title')}
							</h1>
							<p className="m-0 max-w-[420px] text-[14px] leading-[1.5] text-[var(--ink-3)]">
								{t('success.paid_body')}
							</p>
							{order.id && (
								<button
									type="button"
									onClick={handleCopyOrder}
									className="mt-1 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11.5px] font-[700] tracking-[0.06em] tabular-nums transition-colors duration-150"
									style={{
										background: copied ? 'var(--ink)' : 'var(--bg-2)',
										color: copied ? 'white' : 'var(--ink)',
										fontFamily: 'var(--font-mono)',
									}}
								>
									{copied ? (
										<><Icon icon="mdi:check" width={11} /> {t('success.copied').toUpperCase()}</>
									) : (
										<>{order.id} <Icon icon="mdi:content-copy" width={11} /></>
									)}
								</button>
							)}
						</div>

						{/* Ticket card */}
						<div
							className="mb-4 overflow-hidden rounded-[22px] bg-[var(--surface)]"
							style={{ border: '1px solid var(--line)', boxShadow: '0 8px 28px -12px rgba(26,24,22,0.10)' }}
						>
							{/* Banner */}
							{banner && (
								<div className="relative overflow-hidden" style={{ aspectRatio: '16 / 6', background: 'var(--bg-2)' }}>
									<img src={banner} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" style={{ filter: 'blur(28px) saturate(1.1)', transform: 'scale(1.2)' }} />
									<img src={banner} alt={order.event_title} className="relative block h-full w-full object-contain" />
									<div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55))' }} />
									<div className="absolute bottom-3.5 left-[18px] flex flex-col gap-1 text-white">
										<span className="text-[10.5px] font-[700] uppercase tracking-[0.12em] opacity-85">
											{t('success.tickets_count', { count: totalQty })}
										</span>
										<span className="text-[18px] font-[800] tracking-[-0.02em]" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
											{order.event_title}
										</span>
									</div>
								</div>
							)}

							{/* Meta grid */}
							<div
								className="grid grid-cols-1 gap-2.5 px-[22px] py-[18px] sm:grid-cols-3 sm:gap-3.5"
								style={{ borderBottom: '1px dashed var(--line)' }}
							>
								{!banner && (
									<div className="col-span-full">
										<span className="block text-[10px] font-[700] uppercase tracking-[0.12em] text-[var(--ink-3)]">{t('success.order_label')}</span>
										<h2 className="m-0 mt-1 text-[20px] font-[800] tracking-[-0.022em] text-[var(--ink)]">{order.event_title}</h2>
									</div>
								)}
								{dateSource && <MetaCol label={t('success.meta_date')} value={fmtDate(dateSource)} />}
								{dateSource && <MetaCol label={t('success.meta_time')} value={fmtTime(dateSource)} />}
								{event?.venue_name && <MetaCol label={t('success.meta_location')} value={event.venue_name} />}
							</div>

							{/* Line items */}
							{items.length > 0 && (
								<div className="flex flex-col gap-2 px-[22px] py-3.5">
									{items.map((item, i) => {
										const seat = parseSeatId(item.seat_id);
										return (
											<div key={i} className="flex items-center justify-between gap-3 text-[14px]">
												<div className="flex min-w-0 items-center gap-2.5">
													<span className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-[8px] bg-[var(--bg-2)] text-[var(--ink-2)]">
														<Icon icon="mdi:ticket-outline" width={14} />
													</span>
													<span className="font-[600] tracking-[-0.005em] text-[var(--ink)]">
														{item.quantity}× {item.name}
														{seat && (
															<span className="ml-2 text-[12.5px] tabular-nums text-[var(--ink-3)]">
																· {t('seating.seat_label', { row: seat.row, seat: seat.seat })}
															</span>
														)}
													</span>
												</div>
												<span className="flex-shrink-0 font-[700] tabular-nums text-[var(--ink)]">
													{(item.price * item.quantity).toLocaleString()} {order.currency}
												</span>
											</div>
										);
									})}
									{fee > 0.5 && (
										<>
											<div className="my-1 h-px bg-[var(--line)]" />
											<div className="flex items-center justify-between text-[12px] text-[var(--ink-3)]">
												<span>{t('price_breakdown.service_fee')}</span>
												<span className="tabular-nums">{Math.round(fee).toLocaleString()} {order.currency}</span>
											</div>
										</>
									)}
									{order.total != null && (
										<div className="mt-1 flex items-baseline justify-between">
											<span className="text-[16px] font-[800] tracking-[-0.018em] text-[var(--ink)]">{t('success.total_paid')}</span>
											<span className="text-[22px] font-[800] tracking-[-0.022em] tabular-nums text-[var(--ink)]">
												{order.total.toLocaleString()} <span className="text-[12px] font-[500] text-[var(--ink-3)]">{order.currency}</span>
											</span>
										</div>
									)}
								</div>
							)}

							{/* Perforated separator + download */}
							<PerforatedDivider />
							<div className="flex items-center justify-between gap-4 px-[22px] pb-6 pt-2">
								<div className="flex flex-col gap-1">
									<span className="text-[10px] font-[700] uppercase tracking-[0.12em] text-[var(--ink-3)]">{t('success.scan_label')}</span>
									<span className="max-w-[260px] text-[13px] leading-[1.45] text-[var(--ink-2)]">{t('success.scan_note')}</span>
								</div>
								{order.pdf_url && (
									<a
										href={order.pdf_url}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex flex-shrink-0 items-center gap-2 rounded-full bg-[var(--ink)] px-5 py-3 text-[14px] font-[600] tracking-[-0.005em] text-white transition-colors duration-150 hover:bg-[var(--ink-2)]"
									>
										<Icon icon="mdi:download" width={14} />
										{t('success.download_tickets')}
									</a>
								)}
							</div>
						</div>

						{/* Secondary actions */}
						<div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
							{order.pdf_url && (
								<SecondaryAction as="a" href={order.pdf_url} icon="mdi:download" label={t('success.action_download')} external />
							)}
							{calendarUrl && (
								<SecondaryAction as="a" href={calendarUrl} icon="mdi:calendar-outline" label={t('success.action_calendar')} external />
							)}
							<SecondaryAction as="button" onClick={handleShare} icon="mdi:share-variant-outline" label={t('success.action_share')} />
							<SecondaryAction as="link" href="/account/tickets" icon="mdi:ticket-outline" label={t('success.action_tickets')} />
						</div>

						{/* What's next */}
						<div className="mb-[22px] rounded-[18px] bg-[var(--surface)] px-[22px] py-[18px]" style={{ border: '1px solid var(--line)' }}>
							<h3 className="m-0 mb-3.5 text-[15px] font-[800] tracking-[-0.012em] text-[var(--ink)]">{t('success.whats_next')}</h3>
							<div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
								<NextStep icon="mdi:email-outline" title={t('success.next_email_title')} body={t('success.next_email_body')} />
								<NextStep icon="mdi:calendar-check-outline" title={t('success.next_calendar_title')} body={t('success.next_calendar_body')} />
								<NextStep icon="mdi:party-popper" title={t('success.next_enjoy_title')} body={event?.venue_name ? t('success.next_enjoy_body_venue', { venue: event.venue_name }) : t('success.next_enjoy_body')} />
							</div>
						</div>

						{/* Footer nav */}
						<div className="flex flex-wrap justify-center gap-2.5">
							<Link
								href={order.event_slug ? `/events/${order.event_slug}` : '/'}
								className="inline-flex items-center gap-2 rounded-full bg-[var(--surface)] px-[22px] py-3 text-[13.5px] font-[600] tracking-[-0.005em] text-[var(--ink)] transition-colors duration-150 hover:bg-[var(--bg-2)]"
								style={{ border: '1px solid var(--line)' }}
							>
								<Icon icon="mdi:chevron-left" width={13} /> {t('success.back_to_event')}
							</Link>
							<Link
								href="/"
								className="inline-flex items-center gap-2 rounded-full bg-[var(--ink)] px-[22px] py-3 text-[13.5px] font-[600] tracking-[-0.005em] text-white transition-colors duration-150 hover:bg-[var(--ink-2)]"
							>
								{t('success.discover_more')} <Icon icon="mdi:arrow-right" width={13} />
							</Link>
						</div>

						{/* Support */}
						<p className="m-0 mt-5 text-center text-[12.5px] text-[var(--ink-3)]">
							{t('success.need_help')}{' '}
							<a href="mailto:support@tix.live" className="font-[700] text-[var(--ink)] underline-offset-2 hover:underline">
								support@tix.live
							</a>
						</p>
					</>
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

function PerforatedDivider() {
	return (
		<div className="relative h-4">
			<div className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[var(--bg)]" style={{ left: -8 }} />
			<div className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[var(--bg)]" style={{ right: -8 }} />
			<div className="absolute left-3.5 right-3.5 top-1/2" style={{ borderTop: '1px dashed var(--ink-5)' }} />
		</div>
	);
}

function MetaCol({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex min-w-0 flex-col gap-[3px]">
			<span className="text-[10px] font-[700] uppercase tracking-[0.1em] text-[var(--ink-3)]">{label}</span>
			<span className="truncate text-[13.5px] font-[700] tracking-[-0.008em] text-[var(--ink)]">{value}</span>
		</div>
	);
}

type SecondaryActionProps = {
	icon: string;
	label: string;
	as: 'a' | 'button' | 'link';
	href?: string;
	onClick?: () => void;
	external?: boolean;
};

function SecondaryAction({ icon, label, as, href, onClick, external }: SecondaryActionProps) {
	const className =
		'inline-flex items-center justify-center gap-2 rounded-[12px] bg-[var(--surface)] px-2 py-[11px] text-[12px] font-[600] tracking-[-0.005em] text-[var(--ink-2)] transition-colors duration-150 hover:bg-[var(--bg-2)] hover:text-[var(--ink)]';
	const style = { border: '1px solid var(--line)' } as const;
	const inner = (
		<>
			<Icon icon={icon} width={14} /> {label}
		</>
	);
	if (as === 'a') {
		return (
			<a href={href} className={className} style={style} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
				{inner}
			</a>
		);
	}
	if (as === 'link') {
		return (
			<Link href={href ?? '/'} className={className} style={style}>
				{inner}
			</Link>
		);
	}
	return (
		<button type="button" onClick={onClick} className={className} style={style}>
			{inner}
		</button>
	);
}

function NextStep({ icon, title, body }: { icon: string; title: string; body: string }) {
	return (
		<div className="flex items-start gap-3 rounded-[12px] bg-[var(--bg-2)] px-3.5 py-3">
			<span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] bg-[var(--surface)] text-[var(--ink)]">
				<Icon icon={icon} width={15} />
			</span>
			<div className="flex flex-col gap-0.5">
				<span className="text-[13px] font-[700] tracking-[-0.005em] text-[var(--ink)]">{title}</span>
				<span className="text-[11.5px] leading-[1.4] text-[var(--ink-3)]">{body}</span>
			</div>
		</div>
	);
}

CheckoutSuccessPage.getLayout = (page) => <Layout>{page}</Layout>;

export default CheckoutSuccessPage;

import { staticI18nProps } from '@/lib/staticI18n';

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
	props: staticI18nProps(locale),
});
