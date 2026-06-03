'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
	addToast,
	Button,
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	useDisclosure,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';

import { computeAllSeats, GEOMETRY_VERSION, Seat } from '@/lib/seatingGeometry';
import {
	buildSeatTierMap,
	toggleSeat,
	isSelectionValid,
	deriveCart,
	selectionTotal,
	sanitizeSeats,
	formatSeatLabel,
} from '@/lib/seatSelection';
import { buildTierColorById, buildTierColorBySeatId } from '@/lib/tierColors';
import { suggestSeats } from '@/queries/seating/useSuggestSeats';
import AddonSection from '@/components/event/AddonSection';
import type { IAddonCartItem, ITicketAddon, ICartItem, ISeatingResponse } from '@/types';

function SeatingViewerLoading() {
	const { t } = useTranslation('common');
	return (
		<div className="flex h-full w-full items-center justify-center bg-[var(--bg)]">
			<div className="flex flex-col items-center gap-3 text-[var(--ink-3)]">
				<Icon icon="mdi:seat-outline" width={36} className="animate-pulse" />
				<span className="text-[11px] font-[700] uppercase tracking-[0.1em]">{t('seating.loading_map')}</span>
			</div>
		</div>
	);
}

const SeatingViewer = dynamic(() => import('@/components/seating/SeatingViewer'), {
	ssr: false,
	loading: () => <SeatingViewerLoading />,
});

interface SeatSelectionProps {
	slug: string;
	sessionId: number;
	sessionDate: string;
	sessionStart: string;
	eventTitle: string;
	venueName: string;
	venueAddress: string;
	maxPerOrder: number;
	seedCart: Array<{ ticket_package_id: number; quantity: number }>;
	addonCart: IAddonCartItem[];
	addons: ITicketAddon[];
	seating: ISeatingResponse;
	initialSelectedSeatIds: string[];
	initialShortfall: boolean;
	currency: string;
	/** Auto-allocate events: render the suggested seats as a read-only PREVIEW — the
	 *  buyer can't change them. Continue submits no selected_seats (server allocates). */
	readOnly?: boolean;
	/** Auto-allocate only: the buyer's original category cart + bundles. In read-only
	 *  mode these (not the seat-derived cart) are carried to checkout, so bundle
	 *  purchases survive the seat-preview hop. */
	originalCart?: ICartItem[];
	bundles?: Array<{ bundle_id: number; quantity: number; name: string; price: number }>;
}

function useReducedMotion(): boolean {
	const [reduced, setReduced] = useState(
		() => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
	useEffect(() => {
		if (typeof window === 'undefined' || !window.matchMedia) return;
		const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
		const onChange = () => setReduced(mq.matches);
		mq.addEventListener?.('change', onChange);
		return () => mq.removeEventListener?.('change', onChange);
	}, []);
	return reduced;
}

export default function SeatSelection({
	slug,
	sessionId,
	eventTitle,
	venueName,
	maxPerOrder,
	seedCart,
	addonCart,
	addons,
	seating,
	initialSelectedSeatIds,
	initialShortfall,
	currency,
	readOnly = false,
	originalCart,
	bundles,
}: SeatSelectionProps) {
	const { t } = useTranslation('common');
	const router = useRouter();
	const reducedMotion = useReducedMotion();

	const versionMismatch = seating.geometry_version !== GEOMETRY_VERSION;

	// ── Derived stable maps ───────────────────────────────────────────────────
	const tiers = seating.tiers;
	const seatTier = useMemo(() => buildSeatTierMap(tiers), [tiers]);
	const colorByTierId = useMemo(() => buildTierColorById(tiers), [tiers]);
	const tierColorBySeatId = useMemo(() => buildTierColorBySeatId(tiers, colorByTierId), [tiers, colorByTierId]);
	const priceBySeatId = useMemo(() => {
		const priceByTierId = new Map(tiers.map((t) => [t.ticket_package_id, t.price]));
		const m = new Map<string, number>();
		for (const [seatId, tierId] of seatTier) {
			const price = priceByTierId.get(tierId);
			if (price != null) m.set(seatId, price);
		}
		return m;
	}, [tiers, seatTier]);
	const seatById = useMemo(() => {
		const m = new Map<string, Seat>();
		for (const s of computeAllSeats(seating.sections)) m.set(s.id, s);
		return m;
	}, [seating.sections]);
	const bookedSet = useMemo(() => new Set(seating.booked), [seating.booked]);
	const tierMeta = useMemo(() => {
		const m = new Map<number, { name: string; index: number }>();
		tiers.forEach((tier, index) =>
			m.set(tier.ticket_package_id, {
				name: tier.name.split(' — ')[0].split(' (')[0].trim(),
				index,
			})
		);
		return m;
	}, [tiers]);
	const availableCount = useMemo(() => {
		let n = 0;
		for (const id of seatTier.keys()) if (!bookedSet.has(id)) n++;
		return n;
	}, [seatTier, bookedSet]);

	// ── State ─────────────────────────────────────────────────────────────────
	const [selected, setSelected] = useState<Set<string>>(
		() => new Set(sanitizeSeats(initialSelectedSeatIds, seatTier, bookedSet, maxPerOrder))
	);
	const [shortfall, setShortfall] = useState(initialShortfall);
	const [repicking, setRepicking] = useState(false);
	const [continuing, setContinuing] = useState(false);
	const [highlightedPrice, setHighlightedPrice] = useState<number | null>(null);
	// Add-on quantities, seeded from anything pre-picked on the event page (usually empty
	// for seated events, where extras are chosen here on the seat map).
	const [addonQuantities, setAddonQuantities] = useState<Record<number, number>>(
		() => Object.fromEntries(addonCart.map((a) => [a.addon_id, a.quantity]))
	);
	const handleAddonQuantityChange = useCallback((addonId: number, qty: number) => {
		setAddonQuantities((prev) => ({ ...prev, [addonId]: qty }));
	}, []);

	const { isOpen: autopickOpen, onClose: closeAutopick, onOpen: openAutopick } = useDisclosure({
		defaultOpen: !versionMismatch && initialSelectedSeatIds.length > 0,
	});
	const { isOpen: extrasOpen, onClose: closeExtras, onOpen: openExtras } = useDisclosure();

	// ── Derived selection ─────────────────────────────────────────────────────
	const total = useMemo(() => selectionTotal(selected, seatTier, tiers), [selected, seatTier, tiers]);
	const complete = isSelectionValid(selected.size);

	// Add-on pricing mirrors the GA flow: per_ticket extras multiply by the seat count.
	const addonTotal = useMemo(() => {
		return addons.reduce((sum, addon) => {
			const qty = addonQuantities[addon.id] ?? 0;
			if (qty === 0) return sum;
			return sum + addon.price * qty * (addon.per_ticket ? selected.size : 1);
		}, 0);
	}, [addons, addonQuantities, selected.size]);
	const grandTotal = total + addonTotal;
	const addonCount = useMemo(
		() => addons.reduce((n, a) => n + (addonQuantities[a.id] ?? 0), 0),
		[addons, addonQuantities]
	);

	type SelectedSeatItem = {
		seatId: string;
		tierId: number;
		tierName: string;
		label: string;
		color: string;
		price: number;
	};

	const selectedItems: SelectedSeatItem[] = useMemo(() => {
		const withIdx = [...selected].map((seatId) => {
			const tierId = seatTier.get(seatId) ?? -1;
			const meta = tierMeta.get(tierId);
			const seat = seatById.get(seatId);
			const item: SelectedSeatItem = {
				seatId,
				tierId,
				tierName: meta?.name ?? '',
				label: seat ? formatSeatLabel(seat) : seatId,
				color: tierColorBySeatId.get(seatId) ?? 'var(--ink-3)',
				price: priceBySeatId.get(seatId) ?? 0,
			};
			return { item, idx: meta?.index ?? 99 };
		});
		withIdx.sort((a, b) => a.idx - b.idx || a.item.label.localeCompare(b.item.label, undefined, { numeric: true }));
		return withIdx.map((x) => x.item);
	}, [selected, seatTier, tierMeta, seatById, tierColorBySeatId, priceBySeatId]);

	// Group selected seats by tier — one summary row per tier with seat chips below.
	const groupedByTier = useMemo(() => {
		const groups = new Map<number, { tierName: string; color: string; price: number; items: SelectedSeatItem[]; index: number }>();
		for (const it of selectedItems) {
			const meta = tierMeta.get(it.tierId);
			const existing = groups.get(it.tierId);
			if (existing) {
				existing.items.push(it);
			} else {
				groups.set(it.tierId, {
					tierName: it.tierName,
					color: it.color,
					price: it.price,
					items: [it],
					index: meta?.index ?? 99,
				});
			}
		}
		return [...groups.values()].sort((a, b) => a.index - b.index);
	}, [selectedItems, tierMeta]);

	// One pill per unique price value (multiple tiers can share a price)
	const uniquePrices = useMemo(() => {
		const seen = new Map<number, { color: string; tierName: string }>();
		for (const tier of tiers) {
			if (!seen.has(tier.price)) {
				seen.set(tier.price, {
					color: colorByTierId.get(tier.ticket_package_id) ?? '#888',
					tierName: tier.name.split(' — ')[0].split(' (')[0].trim(),
				});
			}
		}
		return [...seen.entries()].map(([price, { color, tierName }]) => ({ price, color, tierName }));
	}, [tiers, colorByTierId]);

	// Dim seats whose price doesn't match the highlighted price
	const displayColorBySeatId = useMemo(() => {
		if (highlightedPrice === null) return tierColorBySeatId;
		const m = new Map<string, string>();
		for (const [seatId, color] of tierColorBySeatId) {
			const price = priceBySeatId.get(seatId);
			m.set(seatId, price === highlightedPrice ? color : 'rgba(180,180,180,0.2)');
		}
		return m;
	}, [highlightedPrice, tierColorBySeatId, priceBySeatId]);

	const liveMessage = selected.size === 0
		? t('seating.no_seats_yet')
		: t('seating.live_complete', { count: selected.size, total: grandTotal, currency });

	// ── Handlers ─────────────────────────────────────────────────────────────
	const handleSeatToggle = useCallback(
		(seat: Seat) => {
			if (readOnly) return; // auto-allocate preview: seats are fixed
			const r = toggleSeat(seat.id, selected, seatTier, maxPerOrder);
			if (r.status === 'order_max') {
				addToast({ title: t('seating.cap_reached', { max: maxPerOrder }), color: 'warning' });
				return;
			}
			if (r.status === 'added' || r.status === 'removed') setSelected(r.next);
		},
		[readOnly, selected, seatTier, maxPerOrder, t]
	);

	const handleRemove = useCallback((seatId: string) => {
		setSelected((prev) => {
			const next = new Set(prev);
			next.delete(seatId);
			return next;
		});
	}, []);

	const handleRepick = useCallback(async () => {
		if (seedCart.length === 0) return;
		setRepicking(true);
		try {
			const res = await suggestSeats(slug, sessionId, seedCart);
			setSelected(new Set(sanitizeSeats(res.items.flatMap((i) => i.seat_ids), seatTier, bookedSet, maxPerOrder)));
			setShortfall(res.shortfall);
			openAutopick();
		} catch {
			addToast({ title: t('seating.repick_error'), color: 'danger' });
		} finally {
			setRepicking(false);
		}
	}, [seedCart, slug, sessionId, seatTier, bookedSet, maxPerOrder, openAutopick, t]);

	const handleContinue = useCallback(() => {
		if (!complete || continuing) return;
		setContinuing(true);
		const derivedCart = deriveCart(selected, seatTier, tiers, currency);
		const seatLabels = selectedItems.map((it) => {
			const hyphen = it.label.indexOf('-');
			const seatPart =
				hyphen >= 0
					? `${t('seating.row')} ${it.label.slice(0, hyphen)}, ${t('seating.seat')} ${it.label.slice(hyphen + 1)}`
					: it.label;
			return `${it.tierName} · ${seatPart}`;
		});

		const addonItems = addons
			.filter((a) => (addonQuantities[a.id] ?? 0) > 0)
			.map((a) => ({
				addon_id: a.id,
				addon_name: a.name,
				price: a.price,
				quantity: addonQuantities[a.id],
				per_ticket: a.per_ticket,
				currency,
			}));

		const data: Record<string, string> = {
			event: slug,
			session: String(sessionId),
			// Read-only (auto-allocate): the buyer's original category cart + bundles are
			// authoritative — the seat-derived cart would wrongly fold in bundle tiers.
			cart: JSON.stringify(readOnly && originalCart ? originalCart : derivedCart),
			// Auto-allocate: seats shown are a preview; the server assigns the real ones.
			// seat_labels stay for the checkout summary, but `auto_allocate` tells checkout
			// to omit selected_seats from the buy.
			selected_seats: JSON.stringify([...selected]),
			seat_labels: JSON.stringify(seatLabels),
			...(addonItems.length > 0 && { addons: JSON.stringify(addonItems) }),
			...(readOnly && { auto_allocate: '1' }),
			...(readOnly && bundles && bundles.length > 0 && { bundles: JSON.stringify(bundles) }),
			...(addonCart.length > 0 && { addons: JSON.stringify(addonCart) }),
		};
		sessionStorage.setItem('tixlive:checkout', JSON.stringify(data));
		router.push('/checkout');
	}, [complete, continuing, selected, seatTier, tiers, currency, selectedItems, slug, sessionId, addons, addonQuantities, addonCart, router, t, readOnly, originalCart, bundles]);

	// Reset continuing when page is restored from bfcache (browser back button)
	useEffect(() => {
		const onPageShow = (e: PageTransitionEvent) => {
			if (e.persisted) setContinuing(false);
		};
		window.addEventListener('pageshow', onPageShow);
		return () => window.removeEventListener('pageshow', onPageShow);
	}, []);

	// ── Version mismatch guard ────────────────────────────────────────────────
	if (versionMismatch) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
				<div className="max-w-md text-center">
					<Icon icon="mdi:update" width={40} className="mx-auto mb-4 text-[var(--ink-3)]" />
					<h2 className="mb-2 text-[1.25rem] font-[700] tracking-[-0.01em] text-[var(--ink)]">
						{t('seating.version_mismatch_title')}
					</h2>
					<p className="mb-6 text-[0.875rem] text-[var(--ink-3)]">{t('seating.version_mismatch_body')}</p>
					<div className="flex justify-center gap-3">
						<Button
							onPress={() => window.location.reload()}
							className="rounded-full bg-[var(--ink)] font-[700] text-white"
						>
							{t('seating.refresh')}
						</Button>
						<Button
							as={Link}
							href={`/events/${slug}`}
							variant="bordered"
							className="rounded-full border-[var(--line)] font-[600] text-[var(--ink)]"
						>
							{t('seating.back_to_event')}
						</Button>
					</div>
				</div>
			</div>
		);
	}

	const eyebrow = venueName ? `${t('seating.map_title')} · ${venueName}` : t('seating.map_title');
	const eventHref = `/events/${slug}`;

	// ── Render ────────────────────────────────────────────────────────────────
	return (
		<div className="fixed inset-0 flex flex-col overflow-hidden bg-[var(--bg)]">
			{/* ─── Header ─────────────────────────────────────────────────────── */}
			<header className="flex-shrink-0 border-b border-[var(--line)] bg-[var(--surface)]">
				{/* Row 1: back · centered title · close */}
				<div className="flex min-h-[56px] items-center gap-3 px-4 py-3 sm:gap-4 sm:px-[22px]">
					<Link
						href={eventHref}
						className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--bg-2)] px-3.5 text-[13px] font-[700] tracking-[-0.005em] text-[var(--ink)] transition-colors duration-150 hover:bg-[var(--bg-3)]"
						aria-label={t('seating.back_to_event')}
					>
						<Icon icon="mdi:chevron-left" width={12} />
						<span>{t('seating.back')}</span>
					</Link>

					<div className="min-w-0 flex-1 text-center">
						<p className="m-0 truncate text-[9.5px] font-[800] uppercase tracking-[0.16em] text-[var(--ink-3)]">
							{eyebrow}
						</p>
						<p className="m-0 mt-0.5 truncate text-[15px] font-[800] leading-tight tracking-[-0.018em] text-[var(--ink)]">
							{eventTitle}
						</p>
					</div>

					<Link
						href={eventHref}
						className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border border-[var(--line)] bg-[var(--bg-2)] text-[var(--ink)] transition-colors duration-150 hover:bg-[var(--bg-3)] sm:h-[38px] sm:w-[38px]"
						aria-label={t('seating.back_to_event')}
						title={t('seating.back_to_event')}
					>
						<Icon icon="mdi:close" width={14} />
					</Link>
				</div>

				{/* Row 2: tier filters + legend */}
				<div className="flex items-center justify-between gap-3 border-t border-[var(--line)] px-4 pb-3 pt-2.5 sm:px-[22px] sm:pb-3.5">
					<TierTabsScroller>
						<TierTab
							active={highlightedPrice === null}
							onClick={() => setHighlightedPrice(null)}
							label={t('seating.all_categories')}
						/>
						{uniquePrices.map(({ price, color, tierName }) => {
							const isActive = highlightedPrice === price;
							return (
								<TierTab
									key={price}
									active={isActive}
									onClick={() => setHighlightedPrice(isActive ? null : price)}
									label={`${price} ${currency}`}
									sub={tierName}
									color={color}
								/>
							);
						})}
					</TierTabsScroller>

					<div className="hidden shrink-0 items-center gap-4 text-[11.5px] font-[600] text-[var(--ink-3)] md:flex">
						<LegendDot colors={uniquePrices.map((p) => p.color)} label={t('seating.available_label')} />
						<LegendDot color="var(--brand-accent)" label={t('seating.selected_label')} fill />
						<LegendDot color="rgba(0,0,0,0.25)" label={t('seating.sold_label')} fill={false} />
					</div>
				</div>
			</header>

			{/* ─── Body: canvas + sidebar (desktop) ────────────────────────────── */}
			<div className="flex min-h-0 flex-1 flex-col overflow-hidden md:grid md:grid-cols-[minmax(0,1fr)_380px] md:grid-rows-1">
				{/* Canvas */}
				<div className="relative min-h-0 flex-1 overflow-hidden md:flex-none">
					<SeatingViewer
						sections={seating.sections}
						canvasW={seating.canvas_w}
						canvasH={seating.canvas_h}
						bookedSeatIds={bookedSet}
						selectedSeatIds={selected}
						tierColorBySeatId={displayColorBySeatId}
						priceBySeatId={priceBySeatId}
						currency={currency}
						onSeatToggle={handleSeatToggle}
						reducedMotion={reducedMotion}
					/>

					{/* Stat chips: available count + selected count */}
					<div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2">
						<span
							className="inline-flex items-center rounded-full border border-[var(--line)] bg-white/95 px-3.5 py-2 text-[11.5px] font-[800] uppercase tracking-[0.08em] tabular-nums text-[var(--ink-2)] backdrop-blur-md"
							style={{ boxShadow: '0 2px 8px -2px rgba(0,0,0,0.06)' }}
						>
							{availableCount.toLocaleString()} {t('seating.seats_available')}
						</span>
						{selected.size > 0 && (
							<span
								className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ink)] px-3.5 py-2 text-[11.5px] font-[800] uppercase tracking-[0.04em] tabular-nums text-white"
								style={{ boxShadow: '0 4px 14px -4px rgba(0,0,0,0.25)' }}
							>
								<span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
								{selected.size === 1
									? t('seating.seats_selected_one', { count: selected.size })
									: t('seating.seats_selected_other', { count: selected.size })}
							</span>
						)}
					</div>
				</div>

				{/* Desktop sidebar (md+) */}
				<aside
					className="hidden flex-col gap-3.5 overflow-auto border-l border-[var(--line)] bg-[var(--surface)] px-[22px] py-[22px] md:flex"
					aria-label={t('seating.your_seats')}
				>
					<OrderSummaryCard
						groupedByTier={groupedByTier}
						selectedCount={selected.size}
						addons={addons}
						addonQuantities={addonQuantities}
						onAddonChange={handleAddonQuantityChange}
						addonTotal={addonTotal}
						grandTotal={grandTotal}
						currency={currency}
						complete={complete}
						continuing={continuing}
						onContinue={handleContinue}
						onRemove={handleRemove}
						readOnly={readOnly}
						t={t}
					/>

					<NavHint t={t} />
				</aside>
			</div>

			{/* ─── Mobile bottom bar (< md) ───────────────────────────────────── */}
			<div className="flex-shrink-0 md:hidden">
				{selected.size === 0 ? (
					<div
						className="border-t border-[var(--line)] bg-[var(--bg)]"
						style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
					>
						<div className="flex h-[44px] items-center justify-center px-4">
							<span className="truncate text-[11px] font-[700] uppercase tracking-[0.12em] text-[var(--ink-3)]">
								{t('seating.canvas_hint')}
							</span>
						</div>
					</div>
				) : (
					<div className="bg-[var(--ink)] text-white" style={{ boxShadow: '0 -8px 28px -8px rgba(0,0,0,0.25)' }}>
						{/* Horizontal seat chips */}
						<div className="flex gap-2 overflow-x-auto px-4 pt-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
							{selectedItems.map((item) => {
								const hyphen = item.label.indexOf('-');
								const rowStr = hyphen >= 0 ? item.label.slice(0, hyphen) : item.label;
								const locStr = hyphen >= 0 ? item.label.slice(hyphen + 1) : '';
								return (
									<div key={item.seatId} className="relative shrink-0">
										<div className="flex min-w-[120px] flex-col gap-1 rounded-[14px] bg-white/[0.12] px-3.5 py-2.5 backdrop-blur-md">
											<div className="flex items-center gap-1.5">
												<span
													className="h-1.5 w-1.5 shrink-0 rounded-full"
													style={{ backgroundColor: item.color }}
													aria-hidden="true"
												/>
												<span className="truncate text-[10px] font-[700] uppercase tracking-[0.08em] text-white/70">
													{item.tierName}
												</span>
											</div>
											<p className="m-0 text-[13px] font-[700] leading-tight tracking-[-0.005em] tabular-nums text-white">
												{locStr ? <>{t('seating.row')} {rowStr} · {t('seating.seat')} {locStr}</> : rowStr}
											</p>
											<p className="m-0 text-[11px] font-[600] tabular-nums text-white/55">
												{item.price} {currency}
											</p>
										</div>
										{!readOnly && (
											<button
												type="button"
												onClick={() => handleRemove(item.seatId)}
												className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[var(--ink)]"
												style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}
												aria-label={t('seating.remove_seat')}
											>
												<Icon icon="mdi:close" width={13} />
											</button>
										)}
									</div>
								);
							})}
						</div>

						{/* Add extras trigger */}
						{addons.length > 0 && (
							<div className="px-4 pb-1 pt-1.5">
								<button
									type="button"
									onClick={openExtras}
									className="flex w-full items-center gap-2.5 rounded-[14px] bg-white/[0.12] px-3.5 py-3 text-left backdrop-blur-md transition-colors duration-150 hover:bg-white/[0.18]"
								>
									<Icon icon="mdi:auto-awesome" width={16} className="shrink-0 text-white" />
									<span className="min-w-0 flex-1 truncate text-[13px] font-[700] tracking-[-0.005em] text-white">
										{t('seating.add_extras')}
									</span>
									{addonCount > 0 && (
										<span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-[800] tabular-nums text-[var(--ink)]">
											{addonCount}
										</span>
									)}
									<Icon icon="mdi:chevron-right" width={14} className="shrink-0 text-white/60" />
								</button>
							</div>
						)}

						{/* Total + CTA */}
						<div
							className="flex items-center gap-4 px-4 pt-3"
							style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 14px)' }}
						>
							<div className="min-w-0 flex-1 leading-tight">
								<span className="block text-[10px] font-[700] uppercase tracking-[0.12em] text-white/55">
									{t('seating.total')}
								</span>
								<span className="block text-[22px] font-[800] tracking-[-0.022em] tabular-nums text-white">
									{grandTotal.toLocaleString()}{' '}
									<span className="text-[13px] font-[700] text-white/65">{currency}</span>
								</span>
							</div>
							<button
								type="button"
								onClick={handleContinue}
								disabled={!complete || continuing}
								className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3.5 text-[14px] font-[700] tracking-[-0.005em] text-[var(--ink)] transition-transform duration-150 hover:scale-[1.03] disabled:opacity-50"
							>
								{continuing ? (
									<Icon icon="mdi:loading" width={14} className="animate-spin" />
								) : (
									<>
										{t('seating.continue')}
										<Icon icon="mdi:arrow-right" width={13} />
									</>
								)}
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Live region */}
			<div aria-live="polite" className="sr-only">{liveMessage}</div>

			{/* ── Auto-pick arrival modal ───────────────────────────────────── */}
			<Modal isOpen={autopickOpen} onClose={closeAutopick} placement="center" backdrop="opaque" size="sm">
				<ModalContent>
					{() => (
						<>
							<ModalHeader className="text-[1.125rem] font-[700] tracking-[-0.01em] text-[var(--ink)]">
								{shortfall ? t('seating.autopick_partial_title') : t('seating.autopick_title')}
							</ModalHeader>
							<ModalBody>
								<p className="text-[0.875rem] text-[var(--ink-3)]">
									{shortfall
										? t('seating.autopick_partial_body')
										: t('seating.autopick_body', { count: selected.size })}
								</p>
								<ul className="mt-2 space-y-1.5">
									{tiers.map((tier) => {
										const seatsForTier = selectedItems.filter((it) => it.tierId === tier.ticket_package_id);
										if (seatsForTier.length === 0) return null;
										return (
											<li key={tier.ticket_package_id} className="flex items-center gap-2 text-[0.8125rem]">
												<span
													className="h-2.5 w-2.5 shrink-0 rounded-full"
													style={{ backgroundColor: colorByTierId.get(tier.ticket_package_id) ?? 'var(--ink-3)' }}
													aria-hidden="true"
												/>
												<span className="font-medium text-[var(--ink)]">{tier.name.split(' — ')[0].split(' (')[0].trim()}</span>
												<span className="tabular-nums text-[var(--ink-3)]">
													{seatsForTier.map((s) => s.label).join(', ')}
												</span>
											</li>
										);
									})}
								</ul>
								<p className="mt-2 text-[0.75rem] text-[var(--ink-3)]">
									{readOnly ? t('seating.autoalloc_preview_hint') : t('seating.autopick_tap_hint')}
								</p>
							</ModalBody>
							<ModalFooter>
								{!readOnly && seedCart.length > 0 && (
									<Button
										variant="bordered"
										onPress={handleRepick}
										isLoading={repicking}
										className="rounded-full border-[var(--line)] font-[600] text-[var(--ink)]"
									>
										{t('seating.pick_best')}
									</Button>
								)}
								<Button
									onPress={closeAutopick}
									className="rounded-full bg-[var(--ink)] font-[700] text-white"
								>
									{t('seating.looks_good')}
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>

			{/* ── Add-ons modal (mobile) ─────────────────────────────────────── */}
			<Modal
				isOpen={extrasOpen}
				onClose={closeExtras}
				placement="center"
				backdrop="opaque"
				size="md"
				scrollBehavior="inside"
			>
				<ModalContent>
					{() => (
						<>
							<ModalHeader className="flex items-center gap-2 text-[1.125rem] font-[700] tracking-[-0.01em] text-[var(--ink)]">
								<Icon icon="mdi:auto-awesome" width={18} className="text-[var(--brand-accent)]" />
								{t('event.enhance_experience')}
							</ModalHeader>
							<ModalBody>
								<p className="-mt-1 text-[0.75rem] text-[var(--ink-3)]">{t('event.addon_per_ticket_note')}</p>
								<AddonSection
									addons={addons}
									quantities={addonQuantities}
									ticketCount={selected.size}
									onQuantityChange={handleAddonQuantityChange}
									showHeader={false}
								/>
							</ModalBody>
							<ModalFooter>
								<Button onPress={closeExtras} className="rounded-full bg-[var(--ink)] font-[700] text-white">
									{addonTotal > 0
										? t('seating.extras_done_total', { total: addonTotal.toLocaleString(), currency })
										: t('seating.extras_done')}
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</div>
	);
}

// ─── Tier tabs horizontal scroller (with arrows + wheel-to-horizontal) ─────
function TierTabsScroller({ children }: { children: React.ReactNode }) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [canLeft, setCanLeft] = useState(false);
	const [canRight, setCanRight] = useState(false);

	const updateState = useCallback(() => {
		const el = scrollRef.current;
		if (!el) return;
		setCanLeft(el.scrollLeft > 2);
		setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
	}, []);

	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;
		updateState();
		const ro = new ResizeObserver(updateState);
		ro.observe(el);
		el.addEventListener('scroll', updateState, { passive: true });
		// Translate vertical wheel to horizontal scroll (mouse wheel users)
		const onWheel = (e: WheelEvent) => {
			if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
			el.scrollLeft += e.deltaY;
			e.preventDefault();
		};
		el.addEventListener('wheel', onWheel, { passive: false });
		return () => {
			ro.disconnect();
			el.removeEventListener('scroll', updateState);
			el.removeEventListener('wheel', onWheel);
		};
	}, [updateState]);

	const scrollBy = (dir: -1 | 1) => {
		const el = scrollRef.current;
		if (!el) return;
		el.scrollBy({ left: dir * Math.max(120, el.clientWidth * 0.7), behavior: 'smooth' });
	};

	return (
		<div className="relative flex min-w-0 flex-1 items-center">
			{/* Left chevron + fade */}
			<div
				className={`pointer-events-none absolute left-0 top-0 z-10 flex h-full items-center pr-6 transition-opacity duration-150 ${
					canLeft ? 'opacity-100' : 'opacity-0'
				}`}
				style={{ background: 'linear-gradient(90deg, var(--surface) 30%, transparent 100%)' }}
			>
				<button
					type="button"
					onClick={() => scrollBy(-1)}
					tabIndex={canLeft ? 0 : -1}
					aria-hidden={!canLeft}
					className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] transition-colors duration-150 hover:bg-[var(--bg-2)]"
					style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
					aria-label="Scroll left"
				>
					<Icon icon="mdi:chevron-left" width={14} />
				</button>
			</div>

			{/* Scroll track */}
			<div
				ref={scrollRef}
				className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
			>
				{children}
			</div>

			{/* Right chevron + fade */}
			<div
				className={`pointer-events-none absolute right-0 top-0 z-10 flex h-full items-center justify-end pl-6 transition-opacity duration-150 ${
					canRight ? 'opacity-100' : 'opacity-0'
				}`}
				style={{ background: 'linear-gradient(270deg, var(--surface) 30%, transparent 100%)' }}
			>
				<button
					type="button"
					onClick={() => scrollBy(1)}
					tabIndex={canRight ? 0 : -1}
					aria-hidden={!canRight}
					className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] transition-colors duration-150 hover:bg-[var(--bg-2)]"
					style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
					aria-label="Scroll right"
				>
					<Icon icon="mdi:chevron-right" width={14} />
				</button>
			</div>
		</div>
	);
}

// ─── Tier filter tab ────────────────────────────────────────────────────────
function TierTab({
	active,
	onClick,
	label,
	sub,
	color,
}: {
	active: boolean;
	onClick: () => void;
	label: string;
	sub?: string;
	color?: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-[600] tracking-[-0.005em] transition-colors duration-150 ${
				active
					? 'bg-[var(--ink)] text-white'
					: 'border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--bg-2)]'
			}`}
		>
			{color && (
				<span
					className="h-2.5 w-2.5 shrink-0 rounded-full"
					style={{ backgroundColor: active ? 'rgba(255,255,255,0.7)' : color }}
					aria-hidden="true"
				/>
			)}
			<span className="tabular-nums">{label}</span>
			{sub && <span className="text-[11px] font-[500] opacity-55">· {sub}</span>}
		</button>
	);
}

// ─── Legend dot ─────────────────────────────────────────────────────────────
function LegendDot({
	color,
	colors,
	label,
	fill = true,
}: {
	color?: string;
	colors?: string[];
	label: string;
	fill?: boolean;
}) {
	let dotStyle: React.CSSProperties;
	if (colors && colors.length > 1) {
		// Multi-color pie via conic-gradient — matches the actual tier colors
		const stops = colors
			.map((c, i) => `${c} ${(i / colors.length) * 360}deg ${((i + 1) / colors.length) * 360}deg`)
			.join(', ');
		dotStyle = { background: `conic-gradient(${stops})` };
	} else if (fill) {
		dotStyle = { backgroundColor: color };
	} else {
		dotStyle = { border: `1.5px solid ${color}` };
	}
	return (
		<span className="inline-flex items-center gap-1.5">
			<span className="h-2.5 w-2.5 shrink-0 rounded-full" style={dotStyle} aria-hidden="true" />
			{label}
		</span>
	);
}

// ─── Order summary card ────────────────────────────────────────────────────
type TFn = (key: string, options?: Record<string, unknown>) => string;

interface SelectedSeatGroup {
	tierName: string;
	color: string;
	price: number;
	items: Array<{ seatId: string; label: string }>;
	index: number;
}

function OrderSummaryCard({
	groupedByTier,
	selectedCount,
	addons,
	addonQuantities,
	onAddonChange,
	addonTotal,
	grandTotal,
	currency,
	complete,
	continuing,
	onContinue,
	onRemove,
	readOnly,
	t,
}: {
	groupedByTier: SelectedSeatGroup[];
	selectedCount: number;
	addons: ITicketAddon[];
	addonQuantities: Record<number, number>;
	onAddonChange: (addonId: number, quantity: number) => void;
	addonTotal: number;
	grandTotal: number;
	currency: string;
	complete: boolean;
	continuing: boolean;
	onContinue: () => void;
	onRemove: (seatId: string) => void;
	readOnly?: boolean;
	t: TFn;
}) {
	if (selectedCount === 0) {
		return (
			<div className="rounded-[14px] bg-[var(--bg-2)] px-4 py-5 text-center">
				<p className="m-0 text-[12.5px] font-[600] leading-[1.5] text-[var(--ink-3)]">
					{t('seating.no_seats_yet')}
				</p>
				<p className="m-0 mt-1 text-[11.5px] leading-[1.5] text-[var(--ink-4)]">
					{t('seating.canvas_hint')}
				</p>
			</div>
		);
	}

	const ticketsLabel = selectedCount === 1 ? t('seating.ticket_one') : t('seating.ticket_other');

	return (
		<div className="rounded-[18px] border border-[var(--line)] bg-[var(--surface)] p-5" style={{ boxShadow: 'var(--shadow-1)' }}>
			<div className="flex items-center justify-between">
				<span className="text-[11px] font-[700] uppercase tracking-[0.08em] text-[var(--ink-3)]">
					{t('seating.your_order')}
				</span>
				<span className="inline-flex items-center rounded-full bg-[var(--bg-2)] px-2.5 py-[3px] text-[11px] font-[700] tabular-nums text-[var(--ink-2)]">
					{selectedCount} {ticketsLabel}
				</span>
			</div>

			<div className="mt-3.5 flex flex-col gap-3">
				{groupedByTier.map((group) => (
					<SumLine key={group.tierName} group={group} currency={currency} onRemove={onRemove} readOnly={readOnly} t={t} />
				))}
			</div>

			{addons.length > 0 && (
				<>
					<div className="my-3.5 h-px bg-[var(--line)]" />
					<AddonSection
						addons={addons}
						quantities={addonQuantities}
						ticketCount={selectedCount}
						onQuantityChange={onAddonChange}
					/>
				</>
			)}

			<div className="my-3.5 h-px bg-[var(--line)]" />

			{addonTotal > 0 && (
				<div className="mb-2 flex items-center justify-between text-[12.5px] text-[var(--ink-3)]">
					<span>{t('seating.extras')}</span>
					<span className="tabular-nums">+{addonTotal.toLocaleString()} {currency}</span>
				</div>
			)}

			<div className="flex items-baseline justify-between">
				<span className="text-[15px] font-[700] tracking-[-0.012em] text-[var(--ink)]">{t('seating.total')}</span>
				<span className="text-[20px] font-[800] leading-none tracking-[-0.018em] tabular-nums text-[var(--ink)]">
					{grandTotal.toLocaleString()}{' '}
					<span className="text-[12px] font-[600] text-[var(--ink-3)]">{currency}</span>
				</span>
			</div>

			<button
				type="button"
				onClick={onContinue}
				disabled={!complete || continuing}
				className="mt-3.5 inline-flex h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[var(--ink)] text-[14px] font-[700] tracking-[-0.005em] text-white transition-transform duration-150 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
			>
				{continuing ? (
					<Icon icon="mdi:loading" width={16} className="animate-spin" />
				) : (
					<>
						{t('seating.continue')}
						<Icon icon="mdi:arrow-right" width={13} />
					</>
				)}
			</button>
		</div>
	);
}

function SumLine({
	group,
	currency,
	onRemove,
	readOnly,
	t,
}: {
	group: SelectedSeatGroup;
	currency: string;
	onRemove: (seatId: string) => void;
	readOnly?: boolean;
	t: TFn;
}) {
	const qty = group.items.length;
	const lineTotal = qty * group.price;
	return (
		<div className="text-[13px]">
			<div className="flex items-start justify-between gap-3">
				<div className="flex min-w-0 items-center gap-2">
					<span
						className="h-[7px] w-[7px] shrink-0 rounded-full"
						style={{ backgroundColor: group.color }}
						aria-hidden="true"
					/>
					<div className="flex min-w-0 flex-col leading-[1.3]">
						<span className="truncate text-[13px] font-[700] tracking-[-0.005em] text-[var(--ink)]">
							{qty}× {group.tierName}
						</span>
						<span className="text-[10.5px] tabular-nums text-[var(--ink-3)]">
							{group.price.toLocaleString()} {currency} / {t('seating.per_seat')}
						</span>
					</div>
				</div>
				<span className="shrink-0 text-[13px] font-[700] tabular-nums tracking-[-0.005em] text-[var(--ink)]">
					{lineTotal.toLocaleString()} {currency}
				</span>
			</div>
			<div className="ml-[15px] mt-1.5 flex flex-wrap gap-1.5">
				{group.items.map((it) => {
					const hyphen = it.label.indexOf('-');
					const rowStr = hyphen >= 0 ? it.label.slice(0, hyphen) : it.label;
					const locStr = hyphen >= 0 ? it.label.slice(hyphen + 1) : '';
					return (
						<span
							key={it.seatId}
							className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-2)] py-[3px] pl-2.5 pr-1 text-[10.5px] font-[700] tracking-[-0.005em] tabular-nums text-[var(--ink-2)]"
						>
							{locStr ? <>{t('seating.row')} {rowStr} · {t('seating.seat')} {locStr}</> : rowStr}
							{!readOnly && (
								<button
									type="button"
									onClick={() => onRemove(it.seatId)}
									className="inline-flex h-[14px] w-[14px] items-center justify-center rounded-full bg-[var(--bg-3)] text-[var(--ink-2)] transition-colors hover:bg-[var(--ink)] hover:text-white"
									aria-label={t('seating.remove_seat')}
								>
									<Icon icon="mdi:close" width={8} />
								</button>
							)}
						</span>
					);
				})}
			</div>
		</div>
	);
}

// ─── Navigation hint ───────────────────────────────────────────────────────
function NavHint({ t }: { t: TFn }) {
	return (
		<div className="hidden flex-col gap-1 rounded-[12px] bg-[var(--bg-2)] px-3.5 py-3 md:flex">
			<div className="flex items-center gap-2">
				<span className="text-[14px] leading-none" aria-hidden="true">✋</span>
				<span className="text-[12px] font-[700] text-[var(--ink)]">{t('seating.nav_hint_title')}</span>
			</div>
			<p className="m-0 text-[11.5px] leading-[1.5] text-[var(--ink-2)]">{t('seating.canvas_hint')}</p>
		</div>
	);
}
