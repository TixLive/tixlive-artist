'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
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
import { requestSuggest } from '@/lib/seatClient';
import SelectedSeatsList, { SelectedSeatItem } from '@/components/seating/SelectedSeatsList';
import type { IAddonCartItem, ISeatingResponse } from '@/types';

const SeatingViewer = dynamic(() => import('@/components/seating/SeatingViewer'), {
	ssr: false,
	loading: () => (
		<div className="flex h-full w-full items-center justify-center bg-[var(--theme-surface)]">
			<div className="flex flex-col items-center gap-3 text-[var(--theme-text-muted)]">
				<Icon icon="mdi:seat-outline" width={36} className="animate-pulse" />
				<span className="font-[family-name:var(--font-mono)] text-[0.75rem] uppercase tracking-[0.1em]">Se încarcă harta…</span>
			</div>
		</div>
	),
});

interface SeatSelectionProps {
	slug: string;
	sessionId: number;
	sessionDate: string;
	sessionStart: string;
	eventTitle: string;
	venueName: string;
	venueAddress: string;
	maxPerCategory: number;
	seedCart: Array<{ ticket_package_id: number; quantity: number }>;
	addonCart: IAddonCartItem[];
	seating: ISeatingResponse;
	initialSelectedSeatIds: string[];
	initialShortfall: boolean;
	currency: string;
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
	sessionDate,
	sessionStart,
	eventTitle,
	venueName,
	venueAddress,
	maxPerCategory,
	seedCart,
	addonCart,
	seating,
	initialSelectedSeatIds,
	initialShortfall,
	currency,
}: SeatSelectionProps) {
	const { t } = useTranslation('common');
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
		() => new Set(sanitizeSeats(initialSelectedSeatIds, seatTier, bookedSet, maxPerCategory))
	);
	const [shortfall, setShortfall] = useState(initialShortfall);
	const [repicking, setRepicking] = useState(false);
	const [continuing, setContinuing] = useState(false);
	const [highlightedPrice, setHighlightedPrice] = useState<number | null>(null);

	const { isOpen: autopickOpen, onClose: closeAutopick, onOpen: openAutopick } = useDisclosure({
		defaultOpen: !versionMismatch && initialSelectedSeatIds.length > 0,
	});
	const { isOpen: checkoutOpen, onOpen: openCheckout, onClose: closeCheckout } = useDisclosure();

	// ── Derived selection ─────────────────────────────────────────────────────
	const total = useMemo(() => selectionTotal(selected, seatTier, tiers), [selected, seatTier, tiers]);
	const complete = isSelectionValid(selected.size);

	const selectedItems: SelectedSeatItem[] = useMemo(() => {
		const withIdx = [...selected].map((seatId) => {
			const tierId = seatTier.get(seatId);
			const meta = tierId != null ? tierMeta.get(tierId) : undefined;
			const seat = seatById.get(seatId);
			const item: SelectedSeatItem = {
				seatId,
				tierName: meta?.name ?? '',
				label: seat ? formatSeatLabel(seat) : seatId,
				color: tierColorBySeatId.get(seatId) ?? 'var(--theme-text-muted)',
				price: priceBySeatId.get(seatId) ?? 0,
			};
			return { item, idx: meta?.index ?? 99 };
		});
		withIdx.sort((a, b) => a.idx - b.idx || a.item.label.localeCompare(b.item.label, undefined, { numeric: true }));
		return withIdx.map((x) => x.item);
	}, [selected, seatTier, tierMeta, seatById, tierColorBySeatId, priceBySeatId]);

	// One pill per unique price value (multiple tiers can share a price)
	const uniquePrices = useMemo(() => {
		const seen = new Map<number, { color: string }>();
		for (const tier of tiers) {
			if (!seen.has(tier.price)) {
				seen.set(tier.price, { color: colorByTierId.get(tier.ticket_package_id) ?? '#888' });
			}
		}
		return [...seen.entries()].map(([price, { color }]) => ({ price, color }));
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
		: t('seating.live_complete', { count: selected.size, total, currency });

	// ── Handlers ─────────────────────────────────────────────────────────────
	const handleSeatToggle = useCallback(
		(seat: Seat) => {
			const r = toggleSeat(seat.id, selected, seatTier, maxPerCategory);
			if (r.status === 'tier_max') {
				const meta = r.tierId != null ? tierMeta.get(r.tierId) : undefined;
				addToast({ title: t('seating.cap_reached', { max: maxPerCategory, tier: meta?.name ?? '' }), color: 'warning' });
				return;
			}
			if (r.status === 'added' || r.status === 'removed') setSelected(r.next);
		},
		[selected, seatTier, maxPerCategory, tierMeta, t]
	);

	const handleRemove = useCallback((seatId: string) => {
		setSelected((prev) => {
			const next = new Set(prev);
			next.delete(seatId);
			return next;
		});
	}, []);

	const handleClearAll = useCallback(() => setSelected(new Set()), []);

	const handleRepick = useCallback(async () => {
		if (seedCart.length === 0) return;
		setRepicking(true);
		try {
			const res = await requestSuggest(slug, sessionId, seedCart);
			setSelected(new Set(sanitizeSeats(res.items.flatMap((i) => i.seat_ids), seatTier, bookedSet, maxPerCategory)));
			setShortfall(res.shortfall);
			closeCheckout();
			openAutopick();
		} catch {
			addToast({ title: t('seating.repick_error'), color: 'danger' });
		} finally {
			setRepicking(false);
		}
	}, [seedCart, slug, sessionId, seatTier, bookedSet, maxPerCategory, openAutopick, closeCheckout, t]);

	const handleContinue = useCallback(() => {
		if (!complete || continuing) return;
		setContinuing(true);
		const derivedCart = deriveCart(selected, seatTier, tiers, currency);
		const seatLabels = selectedItems.map((it) => `${it.tierName} · ${it.label}`);

		const form = document.createElement('form');
		form.method = 'POST';
		form.action = '/checkout';
		form.style.display = 'none';

		const fields: Record<string, string> = {
			event: slug,
			session: String(sessionId),
			cart: JSON.stringify(derivedCart),
			selected_seats: JSON.stringify([...selected]),
			seat_labels: JSON.stringify(seatLabels),
			...(addonCart.length > 0 && { addons: JSON.stringify(addonCart) }),
		};
		for (const [key, value] of Object.entries(fields)) {
			const input = document.createElement('input');
			input.type = 'hidden';
			input.name = key;
			input.value = value;
			form.appendChild(input);
		}
		document.body.appendChild(form);
		form.submit();
	}, [complete, continuing, selected, seatTier, tiers, currency, selectedItems, slug, sessionId, addonCart]);

	const fmtDate = (d: string) => {
		const date = new Date(d);
		if (isNaN(date.getTime())) return sessionDate;
		return date.toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'long' });
	};
	const fmtTime = (d: string) => {
		const date = new Date(d);
		if (isNaN(date.getTime())) return '';
		return date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', hour12: false });
	};

	// Reset continuing when page is restored from bfcache (browser back button)
	useEffect(() => {
		const onPageShow = (e: PageTransitionEvent) => {
			if (e.persisted) {
				setContinuing(false);
				closeCheckout();
			}
		};
		window.addEventListener('pageshow', onPageShow);
		return () => window.removeEventListener('pageshow', onPageShow);
	}, [closeCheckout]);

	// ── Version mismatch guard ────────────────────────────────────────────────
	if (versionMismatch) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-[var(--theme-bg)] px-4">
				<div className="max-w-md text-center">
					<Icon icon="mdi:update" width={40} className="mx-auto mb-4 text-[var(--theme-text-muted)]" />
					<h2 className="mb-2 font-[family-name:var(--font-display)] text-[1.25rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)]">
						{t('seating.version_mismatch_title')}
					</h2>
					<p className="mb-6 text-[0.875rem] text-[var(--theme-text-muted)]">{t('seating.version_mismatch_body')}</p>
					<div className="flex justify-center gap-3">
						<Button
							onPress={() => window.location.reload()}
							className="rounded-full font-[family-name:var(--font-body)] font-[700] text-[var(--theme-bg)]"
							style={{ backgroundColor: 'var(--brand-primary)' }}
						>
							{t('seating.refresh')}
						</Button>
						<Button
							as={Link}
							href={`/events/${slug}`}
							variant="bordered"
							className="rounded-full border-[color-mix(in_srgb,var(--theme-text)_12%,transparent)] font-[family-name:var(--font-body)] font-[600] text-[var(--theme-text)]"
						>
							{t('seating.back_to_event')}
						</Button>
					</div>
				</div>
			</div>
		);
	}

	const dateStr = sessionStart ? `${fmtDate(sessionStart)}${fmtTime(sessionStart) ? ` · ${fmtTime(sessionStart)}` : ''}` : sessionDate;

	// ── Render ────────────────────────────────────────────────────────────────
	return (
		<div className="fixed inset-0 flex flex-col overflow-hidden bg-[var(--theme-bg)]">

			{/* ── Top bar ───────────────────────────────────────────────────── */}
			<header className="flex h-[52px] flex-shrink-0 items-center gap-3 border-b border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-bg)] px-4">
				<Link
					href={`/events/${slug}`}
					className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--theme-text)_12%,transparent)] text-[var(--theme-text-muted)] transition-colors hover:text-[var(--theme-text)]"
					aria-label={t('seating.back_to_event')}
				>
					<Icon icon="mdi:arrow-left" width={18} />
				</Link>

				<div className="min-w-0 flex-1">
					<p className="truncate font-[family-name:var(--font-display)] text-[0.9375rem] font-[700] leading-tight tracking-[-0.01em] text-[var(--theme-text)]">
						{eventTitle}
					</p>
				</div>

				{(dateStr || venueName) && (
					<div className="hidden shrink-0 items-center gap-1.5 sm:flex">
						{dateStr && (
							<span className="font-[family-name:var(--font-mono)] text-[0.6875rem] text-[var(--theme-text-muted)]">
								{dateStr}
							</span>
						)}
						{dateStr && venueName && (
							<span className="text-[var(--theme-text-muted)] opacity-30">·</span>
						)}
						{venueName && (
							<span className="font-[family-name:var(--font-mono)] text-[0.6875rem] text-[var(--theme-text-muted)]">
								{venueName}
							</span>
						)}
					</div>
				)}
			</header>

			{/* ── Price tags ────────────────────────────────────────────────── */}
			<div className="flex h-[44px] flex-shrink-0 items-center gap-2 overflow-x-auto border-b border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-bg)] px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
				{uniquePrices.map(({ price, color }) => {
					const isActive = highlightedPrice === price;
					return (
						<button
							key={price}
							type="button"
							onClick={() => setHighlightedPrice(isActive ? null : price)}
							className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 font-[family-name:var(--font-body)] text-[0.75rem] font-[600] transition-all duration-150 ${
								isActive
									? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--theme-bg)]'
									: 'border-[color-mix(in_srgb,var(--theme-text)_12%,transparent)] bg-[var(--theme-surface)] text-[var(--theme-text)] hover:border-[color-mix(in_srgb,var(--theme-text)_22%,transparent)]'
							}`}
						>
							<span
								className="h-2 w-2 shrink-0 rounded-full"
								style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.7)' : color }}
								aria-hidden="true"
							/>
							<span className="font-[family-name:var(--font-mono)]">
								{price} {currency}
							</span>
						</button>
					);
				})}
				{highlightedPrice !== null && (
					<button
						type="button"
						onClick={() => setHighlightedPrice(null)}
						className="shrink-0 font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.1em] text-[var(--theme-text-muted)] transition-colors hover:text-[var(--theme-text)]"
					>
						× Toate
					</button>
				)}
			</div>

			{/* ── Canvas ────────────────────────────────────────────────────── */}
			<div className="relative min-h-0 flex-1">
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

				{/* Available count overlay */}
				<div className="pointer-events-none absolute left-3 top-3">
					<span className="rounded-full bg-[var(--theme-bg)]/80 px-2.5 py-1 font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.1em] text-[var(--theme-text-muted)] backdrop-blur-sm">
						{availableCount} locuri disponibile
					</span>
				</div>
			</div>

			{/* Live region */}
			<div aria-live="polite" className="sr-only">{liveMessage}</div>

			{/* ── Bottom ───────────────────────────────────────────────────── */}
			{selected.size === 0 ? (
				<div
					className="flex-shrink-0 border-t border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-bg)]"
					style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
				>
					<div className="flex h-[40px] items-center justify-between px-4">
						<span className="font-[family-name:var(--font-mono)] text-[0.5625rem] uppercase tracking-[0.12em] text-[var(--theme-text-muted)]">
							{t('seating.no_seats_yet')}
						</span>
						<span className="font-[family-name:var(--font-mono)] text-[0.5625rem] uppercase tracking-[0.12em] text-[var(--theme-text-muted)] opacity-40">
							TixLive
						</span>
					</div>
				</div>
			) : (
				<div className="flex-shrink-0 bg-[var(--brand-primary)] text-[var(--theme-bg)]">
					{/* Seat cards — scrollable, one card per seat */}
					<div className="flex gap-2 overflow-x-auto px-4 pt-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
						{selectedItems.map((item) => {
							// "1-16" → row=1, seat=16
							const hyphen = item.label.indexOf('-');
							const rowStr = hyphen >= 0 ? item.label.slice(0, hyphen) : item.label;
							const locStr = hyphen >= 0 ? item.label.slice(hyphen + 1) : '';
							return (
								<div key={item.seatId} className="group relative shrink-0">
									{/* Card */}
									<div className="flex min-w-[112px] flex-col gap-0.5 rounded-2xl bg-white/15 px-3 py-2.5 backdrop-blur-sm">
										{/* Tier name + color dot */}
										<div className="flex items-center gap-1.5">
											<span
												className="h-2 w-2 shrink-0 rounded-full"
												style={{ backgroundColor: item.color }}
												aria-hidden="true"
											/>
											<span className="truncate font-[family-name:var(--font-display)] text-[0.6875rem] font-[700] leading-none">
												{item.tierName}
											</span>
										</div>
										{/* Row + Seat — spelled out */}
										<p className="font-[family-name:var(--font-mono)] text-[0.75rem] font-[700] leading-tight tabular-nums">
											{locStr
												? <>Rând {rowStr} · Loc {locStr}</>
												: rowStr}
										</p>
										{/* Price */}
										<p className="font-[family-name:var(--font-mono)] text-[0.6875rem] tabular-nums opacity-60">
											{item.price} {currency}
										</p>
									</div>
									{/* Hover X */}
									<button
										type="button"
										onClick={() => handleRemove(item.seatId)}
										className="absolute -right-1.5 -top-1.5 z-10 hidden h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm group-hover:flex"
										style={{ color: 'var(--brand-primary)' }}
										aria-label="Șterge"
									>
										<Icon icon="mdi:close" width={11} />
									</button>
								</div>
							);
						})}
					</div>

					{/* Total + CTA — safe-area padding goes here so button never hugs the edge */}
					<div
						className="flex items-center gap-4 px-4 pt-3"
						style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 14px)' }}
					>
						<button
							type="button"
							onClick={openCheckout}
							className="min-w-0 flex-1 text-left"
						>
							<p className="font-[family-name:var(--font-display)] text-[1.25rem] font-[800] leading-tight tracking-[-0.02em] tabular-nums">
								{total} <span className="text-[0.875rem] font-[700] opacity-60">{currency}</span>
							</p>
						</button>
						<Button
							size="lg"
							onPress={openCheckout}
							className="shrink-0 rounded-full font-[family-name:var(--font-body)] font-[700] text-white"
							style={{ backgroundColor: 'var(--brand-accent)' }}
						>
							{t('seating.continue')}
							<Icon icon="mdi:arrow-right" className="ml-1" width={20} />
						</Button>
					</div>
				</div>
			)}

			{/* ── Auto-pick arrival modal ───────────────────────────────────── */}
			<Modal isOpen={autopickOpen} onClose={closeAutopick} placement="center" backdrop="opaque" size="sm">
				<ModalContent>
					{() => (
						<>
							<ModalHeader className="font-[family-name:var(--font-display)] text-[1.125rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)]">
								{shortfall ? t('seating.autopick_partial_title') : t('seating.autopick_title')}
							</ModalHeader>
							<ModalBody>
								<p className="text-[0.875rem] text-[var(--theme-text-muted)]">
									{shortfall
										? t('seating.autopick_partial_body')
										: t('seating.autopick_body', { count: selected.size })}
								</p>
								<ul className="mt-2 space-y-1.5">
									{tiers.map((tier) => {
										const seatsForTier = selectedItems.filter((it) => seatTier.get(it.seatId) === tier.ticket_package_id);
										if (seatsForTier.length === 0) return null;
										return (
											<li key={tier.ticket_package_id} className="flex items-center gap-2 text-[0.8125rem]">
												<span
													className="h-2.5 w-2.5 shrink-0 rounded-full"
													style={{ backgroundColor: colorByTierId.get(tier.ticket_package_id) ?? 'var(--theme-text-muted)' }}
													aria-hidden="true"
												/>
												<span className="font-medium text-[var(--theme-text)]">{tier.name.split(' — ')[0].split(' (')[0].trim()}</span>
												<span className="font-[family-name:var(--font-data)] tabular-nums text-[var(--theme-text-muted)]">
													{seatsForTier.map((s) => s.label).join(', ')}
												</span>
											</li>
										);
									})}
								</ul>
								<p className="mt-2 text-[0.75rem] text-[var(--theme-text-muted)]">{t('seating.autopick_tap_hint')}</p>
							</ModalBody>
							<ModalFooter>
								{seedCart.length > 0 && (
									<Button
										variant="bordered"
										onPress={handleRepick}
										isLoading={repicking}
										className="rounded-full border-[color-mix(in_srgb,var(--theme-text)_12%,transparent)] font-[family-name:var(--font-body)] font-[600] text-[var(--theme-text)]"
									>
										{t('seating.pick_best')}
									</Button>
								)}
								<Button
									onPress={closeAutopick}
									className="rounded-full font-[family-name:var(--font-body)] font-[700] text-[var(--theme-bg)]"
									style={{ backgroundColor: 'var(--brand-primary)' }}
								>
									{t('seating.looks_good')}
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>

			{/* ── Checkout confirmation modal ───────────────────────────────── */}
			<Modal isOpen={checkoutOpen} onClose={closeCheckout} placement="center" backdrop="opaque" size="sm" scrollBehavior="inside">
				<ModalContent>
					{() => (
						<>
							<ModalHeader className="flex items-start justify-between gap-3">
								<div>
									<h2 className="font-[family-name:var(--font-display)] text-[1.125rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)]">
										Locurile tale
									</h2>
									<p className="mt-0.5 font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.1em] text-[var(--theme-text-muted)]">
										{selected.size === 1 ? '1 loc selectat' : `${selected.size} locuri selectate`}
									</p>
								</div>
								<button
									type="button"
									onClick={handleClearAll}
									className="shrink-0 font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.12em] text-[var(--theme-text-muted)] transition-colors hover:text-[var(--theme-text)]"
								>
									Golește
								</button>
							</ModalHeader>

							<ModalBody className="pb-1">
								<div className="space-y-3">
									{selectedItems.map((item) => (
										<div key={item.seatId} className="flex items-center gap-3">
											<span
												className="h-2.5 w-2.5 shrink-0 rounded-full"
												style={{ backgroundColor: item.color }}
												aria-hidden="true"
											/>
											<div className="min-w-0 flex-1">
												<p className="font-[family-name:var(--font-display)] text-[0.875rem] font-[700] text-[var(--theme-text)]">
													{item.tierName}
												</p>
												<p className="font-[family-name:var(--font-mono)] text-[0.6875rem] text-[var(--theme-text-muted)]">
													{item.label}
												</p>
											</div>
											<div className="flex shrink-0 items-center gap-2">
												<span className="font-[family-name:var(--font-data)] text-[0.875rem] tabular-nums text-[var(--theme-text)]">
													{item.price} {currency}
												</span>
												<button
													type="button"
													onClick={() => handleRemove(item.seatId)}
													className="text-[var(--theme-text-muted)] transition-colors hover:text-[var(--theme-text)]"
													aria-label="Șterge"
												>
													<Icon icon="mdi:close" width={14} />
												</button>
											</div>
										</div>
									))}
								</div>
							</ModalBody>

							<ModalFooter className="flex-col gap-3">
								{/* Total */}
								<div className="flex w-full items-baseline justify-between border-t border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] pt-3">
									<span className="font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[var(--theme-text-muted)]">
										Total
									</span>
									<span className="font-[family-name:var(--font-display)] text-[1.5rem] font-[800] leading-none tracking-[-0.02em] tabular-nums text-[var(--theme-text)]">
										{total} <span className="text-[0.9375rem] font-[700] opacity-50">{currency}</span>
									</span>
								</div>

								{/* Repick option */}
								{seedCart.length > 0 && (
									<Button
										variant="bordered"
										onPress={handleRepick}
										isLoading={repicking}
										className="w-full rounded-full border-[color-mix(in_srgb,var(--theme-text)_12%,transparent)] font-[family-name:var(--font-body)] font-[600] text-[var(--theme-text)]"
									>
										<Icon icon="mdi:auto-fix" width={16} className="mr-1" />
										{t('seating.pick_best')}
									</Button>
								)}

								{/* Confirm CTA */}
								<Button
									size="lg"
									isDisabled={!complete || continuing}
									isLoading={continuing}
									onPress={handleContinue}
									className="w-full rounded-full font-[family-name:var(--font-body)] font-[700] text-[var(--theme-bg)]"
									style={{ backgroundColor: 'var(--brand-primary)' }}
								>
									Confirmă & Plătește
									<Icon icon="mdi:arrow-right" className="ml-1" width={20} />
								</Button>

								<p className="flex items-center justify-center gap-1.5 font-[family-name:var(--font-mono)] text-[0.5625rem] uppercase tracking-[0.1em] text-[var(--theme-text-muted)]">
									<Icon icon="mdi:lock-outline" width={11} />
									{t('checkout.secure_payment_note')}
								</p>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</div>
	);
}
