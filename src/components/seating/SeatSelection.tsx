'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
	addToast,
	Button,
	Drawer,
	DrawerBody,
	DrawerContent,
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
		<div className="flex h-full w-full items-center justify-center rounded-[22px] border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] shadow-[0_1px_2px_rgba(20,19,18,0.04),0_8px_24px_rgba(20,19,18,0.06)]">
			<div className="flex flex-col items-center gap-3 text-[var(--theme-text-muted)]">
				<Icon icon="mdi:seat-outline" width={32} className="animate-pulse" />
				<span className="text-[0.8125rem]">Loading hall…</span>
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
	/** Per-category cap (event.max_tickets_per_user). Applies to EACH tier independently. */
	maxPerCategory: number;
	/** Quantities the buyer pre-picked on the event page — only used to SEED the auto-pick. */
	seedCart: Array<{ ticket_package_id: number; quantity: number }>;
	addonCart: IAddonCartItem[];
	seating: ISeatingResponse;
	initialSelectedSeatIds: string[];
	initialShortfall: boolean;
	currency: string;
}

function useReducedMotion(): boolean {
	// Lazy initial read (SSR-safe) so we never setState synchronously inside the
	// effect; the effect only subscribes to later changes. The viewer is ssr:false,
	// so there's no hydration mismatch from the client-only initial value.
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

	// ── Derived, stable maps ─────────────────────────────────────────────────────
	const tiers = seating.tiers;
	const seatTier = useMemo(() => buildSeatTierMap(tiers), [tiers]);
	const colorByTierId = useMemo(() => buildTierColorById(tiers), [tiers]);
	// Seat-first: ALL priced tiers are coloured + selectable (no cart-tier filter).
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
		tiers.forEach((tier, index) => m.set(tier.ticket_package_id, { name: tier.name, index }));
		return m;
	}, [tiers]);
	const availableCount = useMemo(() => {
		let n = 0;
		for (const id of seatTier.keys()) if (!bookedSet.has(id)) n++;
		return n;
	}, [seatTier, bookedSet]);

	// ── State ────────────────────────────────────────────────────────────────────
	// Sanitize the server-suggested seed against what's selectable (priced, not
	// booked, within the per-category cap). No cart-tier filter — any tier is fair game.
	const [selected, setSelected] = useState<Set<string>>(
		() => new Set(sanitizeSeats(initialSelectedSeatIds, seatTier, bookedSet, maxPerCategory))
	);
	const [shortfall, setShortfall] = useState(initialShortfall);
	const [repicking, setRepicking] = useState(false);
	const [continuing, setContinuing] = useState(false);

	const { isOpen: modalOpen, onClose: closeModal, onOpen: openModal } = useDisclosure({
		defaultOpen: !versionMismatch && initialSelectedSeatIds.length > 0,
	});
	const { isOpen: sheetOpen, onOpen: openSheet, onOpenChange: onSheetOpenChange } = useDisclosure();

	// ── Derived selection views ──────────────────────────────────────────────────
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

	const liveMessage = selected.size === 0
		? t('seating.no_seats_yet')
		: t('seating.live_complete', { count: selected.size, total, currency });

	// ── Handlers ─────────────────────────────────────────────────────────────────
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
		if (seedCart.length === 0) return; // nothing to auto-pick from
		setRepicking(true);
		try {
			const res = await requestSuggest(slug, sessionId, seedCart);
			setSelected(new Set(sanitizeSeats(res.items.flatMap((i) => i.seat_ids), seatTier, bookedSet, maxPerCategory)));
			setShortfall(res.shortfall);
			openModal();
		} catch {
			addToast({ title: t('seating.repick_error'), color: 'danger' });
		} finally {
			setRepicking(false);
		}
	}, [seedCart, slug, sessionId, seatTier, bookedSet, maxPerCategory, openModal, t]);

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

	// ── Geometry version guard (deploy-skew, D12) ────────────────────────────────
	if (versionMismatch) {
		return (
			<div className="mx-auto max-w-md py-20 text-center">
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
		);
	}

	// ── Cart panel (shared by desktop sidebar + mobile drawer) ───────────────────
	const cartPanel = (
		<div className="flex flex-col overflow-hidden rounded-[22px] border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] shadow-[0_1px_2px_rgba(20,19,18,0.04),0_8px_24px_rgba(20,19,18,0.06)]">
			{/* Header — cart title + clear all */}
			<div className="flex items-start justify-between gap-3 border-b border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] px-6 pb-4 pt-5">
				<div className="min-w-0">
					<h2 className="font-[family-name:var(--font-display)] text-[1.25rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)]">
						{t('seating.your_seats')}
					</h2>
					{selected.size > 0 && (
						<p className="mt-1 font-[family-name:var(--font-mono)] text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--theme-text-muted)]">
							{t('seating.seats_count', { count: selected.size })}
						</p>
					)}
				</div>
				{selected.size > 0 && (
					<button
						type="button"
						onClick={handleClearAll}
						className="shrink-0 font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.12em] text-[var(--theme-text-muted)] transition-colors hover:text-[var(--theme-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
					>
						Golește
					</button>
				)}
			</div>

			{/* Body */}
			<div className="max-h-[42vh] space-y-4 overflow-y-auto px-6 py-5 md:max-h-none">
				<SelectedSeatsList items={selectedItems} currency={currency} onRemove={handleRemove} />

				{seedCart.length > 0 && (
					<button
						type="button"
						onClick={handleRepick}
						disabled={repicking}
						className="flex w-full items-center justify-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--theme-text)_12%,transparent)] py-2.5 font-[family-name:var(--font-body)] text-[0.8125rem] font-[600] text-[var(--theme-text)] transition-colors hover:bg-[color-mix(in_srgb,var(--theme-text)_4%,transparent)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
					>
						<Icon icon={repicking ? 'mdi:loading' : 'mdi:auto-fix'} width={16} className={repicking ? 'animate-spin' : ''} />
						{t('seating.pick_best')}
					</button>
				)}
			</div>

			{/* Subtotal */}
			{selected.size > 0 && (
				<div className="border-t border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] px-6 py-4">
					<div className="flex items-baseline justify-between">
						<span className="text-[0.8125rem] text-[var(--theme-text-muted)]">Subtotal</span>
						<span className="font-[family-name:var(--font-data)] text-[0.875rem] tabular-nums text-[var(--theme-text)]">
							{total} {currency}
						</span>
					</div>
					<p className="mt-1 font-[family-name:var(--font-mono)] text-[0.5625rem] uppercase tracking-[0.1em] text-[var(--theme-text-muted)]">
						Comisioane calculate la plată
					</p>
				</div>
			)}

			{/* Total + CTA — dark brand surface */}
			<div className="bg-[var(--brand-primary)] px-6 py-5 text-[var(--theme-bg)]">
				<div className="mb-3 flex items-baseline justify-between">
					<span className="font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] opacity-60">
						{t('seating.total')}
					</span>
					<span className="font-[family-name:var(--font-display)] text-[1.75rem] font-[800] leading-none tracking-[-0.02em] tabular-nums">
						{total} <span className="text-[0.875rem] font-[700] opacity-60">{currency}</span>
					</span>
				</div>
				<Button
					size="lg"
					isDisabled={!complete || continuing}
					isLoading={continuing}
					onPress={handleContinue}
					className="w-full rounded-full font-[family-name:var(--font-body)] font-[700] text-white disabled:opacity-45"
					style={{ backgroundColor: 'var(--brand-accent)' }}
				>
					{t('seating.continue')}
					<Icon icon="mdi:arrow-right" className="ml-1" width={20} />
				</Button>
				{!complete ? (
					<p className="mt-2.5 text-center font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.1em] opacity-60">
						{t('seating.continue_hint')}
					</p>
				) : (
					<p className="mt-2.5 flex items-center justify-center gap-1.5 text-center font-[family-name:var(--font-mono)] text-[0.5625rem] uppercase tracking-[0.1em] opacity-60">
						<Icon icon="mdi:lock-outline" width={11} />
						{t('checkout.secure_payment_note')}
					</p>
				)}
			</div>
		</div>
	);

	const trustChips = (
		<div className="space-y-2.5 rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-4">
			{[
				{ icon: 'mdi:shield-check-outline', label: 'Plată securizată' },
				{ icon: 'mdi:flash-outline', label: 'Bilet instant' },
				{ icon: 'mdi:check-decagram-outline', label: 'Garanție 100%' },
			].map((c) => (
				<div key={c.label} className="flex items-center gap-2.5 text-[0.8125rem] text-[var(--theme-text-muted)]">
					<Icon icon={c.icon} width={18} className="shrink-0 text-[var(--theme-text-muted)]" />
					{c.label}
				</div>
			))}
		</div>
	);

	return (
		<div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 md:py-8">
			{/* Event strip — back link + big title + meta tiles */}
			<div className="mb-6">
				<Link
					href={`/events/${slug}`}
					className="mb-3 inline-flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[var(--theme-text-muted)] transition-colors hover:text-[var(--theme-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
				>
					<Icon icon="mdi:arrow-left" width={14} />
					{t('seating.back_to_event')}
				</Link>
				<div className="flex flex-wrap items-end justify-between gap-4">
					<h1 className="font-[family-name:var(--font-display)] text-[2rem] font-[800] leading-[1] tracking-[-0.03em] text-[var(--theme-text)] sm:text-[3rem]">
						{eventTitle}
					</h1>
					{(sessionStart || venueName) && (
						<div className="hidden gap-2.5 sm:flex">
							{sessionStart && (
								<MetaTile label="Data" value={fmtDate(sessionStart)} sub={fmtTime(sessionStart) ? `Porți ${fmtTime(sessionStart)}` : sessionDate} />
							)}
							{venueName && <MetaTile label="Locul" value={venueName} sub={venueAddress} />}
						</div>
					)}
				</div>
				{/* Mobile meta pills */}
				{(sessionStart || venueName) && (
					<div className="mt-3 flex gap-2 overflow-x-auto sm:hidden">
						{sessionStart && <MobileMetaPill label={`${fmtDate(sessionStart)}${fmtTime(sessionStart) ? ` · ${fmtTime(sessionStart)}` : ''}`} />}
						{venueName && <MobileMetaPill label={venueName} />}
					</div>
				)}
			</div>

			{/* Live region for assistive tech */}
			<div aria-live="polite" className="sr-only">
				{liveMessage}
			</div>

			<div className="md:flex md:gap-6">
				{/* Canvas */}
				<div className="min-w-0 flex-1">
					{/* Toolbar */}
					<div className="mb-3 flex flex-wrap items-center gap-2.5">
						<h2 className="font-[family-name:var(--font-display)] text-[1.25rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)] sm:text-[1.5rem]">
							Alege locul
						</h2>
						<span className="font-[family-name:var(--font-mono)] text-[0.6875rem] tracking-[0.03em] text-[var(--theme-text-muted)]">
							· {availableCount} locuri disponibile
						</span>
					</div>

					<div className="h-[56vh] w-full md:h-[calc(100vh-15rem)]">
						<SeatingViewer
							sections={seating.sections}
							canvasW={seating.canvas_w}
							canvasH={seating.canvas_h}
							bookedSeatIds={bookedSet}
							selectedSeatIds={selected}
							tierColorBySeatId={tierColorBySeatId}
							priceBySeatId={priceBySeatId}
							currency={currency}
							onSeatToggle={handleSeatToggle}
							reducedMotion={reducedMotion}
						/>
					</div>

					{/* Compact tier color legend — color-dot pills */}
					<div className="mt-4 flex flex-wrap gap-2">
						{tiers.map((tier) => (
							<div
								key={tier.ticket_package_id}
								className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] py-1.5 pl-2.5 pr-3"
							>
								<span
									className="h-2.5 w-2.5 shrink-0 rounded-full"
									style={{ backgroundColor: colorByTierId.get(tier.ticket_package_id) ?? 'var(--theme-text-muted)' }}
									aria-hidden="true"
								/>
								<span className="font-[family-name:var(--font-body)] text-[0.75rem] font-[600] text-[var(--theme-text)]">{tier.name}</span>
								<span className="font-[family-name:var(--font-mono)] text-[0.6875rem] tracking-[0.03em] text-[var(--theme-text-muted)]">
									{tier.price} {currency}
								</span>
							</div>
						))}
					</div>

					<p className="mt-3 hidden text-center font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.1em] text-[var(--theme-text-muted)] md:block">
						{t('seating.canvas_hint')}
					</p>
				</div>

				{/* Sidebar — desktop sticky */}
				<aside className="hidden w-[360px] flex-shrink-0 md:block">
					<div className="sticky top-32 space-y-3">
						{cartPanel}
						{trustChips}
					</div>
				</aside>
			</div>

			{/* Bottom padding so the mobile sticky bar never covers the content */}
			<div className="h-24 md:hidden" />

			{/* Mobile sticky bar — tap left to open the cart drawer */}
			<div
				className="fixed inset-x-0 bottom-0 z-40 bg-[var(--brand-primary)] px-4 py-3 text-[var(--theme-bg)] shadow-[0_-24px_60px_rgba(20,19,18,0.35)] md:hidden"
				style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
			>
				<div className="flex items-center justify-between gap-3">
					<button
						type="button"
						onClick={openSheet}
						disabled={selected.size === 0}
						className="flex min-w-0 items-center gap-2 text-left disabled:opacity-80"
					>
						<div className="min-w-0">
							<p className="font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] opacity-60">
								{selected.size > 0 ? t('seating.seats_count', { count: selected.size }) : t('seating.no_seats_yet')}
							</p>
							<p className="font-[family-name:var(--font-display)] text-[1.25rem] font-[800] leading-tight tracking-[-0.02em] tabular-nums">
								{total} <span className="text-[0.8125rem] font-[700] opacity-60">{currency}</span>
							</p>
						</div>
						{selected.size > 0 && <Icon icon="mdi:chevron-up" width={18} className="shrink-0 opacity-60" />}
					</button>
					<Button
						size="lg"
						isDisabled={!complete || continuing}
						isLoading={continuing}
						onPress={handleContinue}
						className="rounded-full font-[family-name:var(--font-body)] font-[700] text-white disabled:opacity-45"
						style={{ backgroundColor: 'var(--brand-accent)' }}
					>
						{t('seating.continue')}
						<Icon icon="mdi:arrow-right" className="ml-1" width={20} />
					</Button>
				</div>
			</div>

			{/* Mobile cart drawer (bottom sheet) */}
			<Drawer isOpen={sheetOpen} onOpenChange={onSheetOpenChange} placement="bottom" size="lg" className="md:hidden">
				<DrawerContent className="bg-transparent shadow-none">
					{() => (
						<DrawerBody className="p-4">
							{cartPanel}
						</DrawerBody>
					)}
				</DrawerContent>
			</Drawer>

			{/* Auto-pick arrival modal */}
			<Modal isOpen={modalOpen} onClose={closeModal} placement="center" backdrop="opaque" size="sm">
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
												<span className="font-medium text-[var(--theme-text)]">{tier.name}</span>
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
									onPress={closeModal}
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
		</div>
	);
}

function MetaTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
	return (
		<div className="min-w-[140px] rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] px-3.5 py-2.5">
			<div className="font-[family-name:var(--font-mono)] text-[0.5625rem] uppercase tracking-[0.15em] text-[var(--theme-text-muted)]">{label}</div>
			<div className="mt-1 truncate font-[family-name:var(--font-display)] text-[0.875rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)]">{value}</div>
			{sub && <div className="truncate text-[0.6875rem] text-[var(--theme-text-muted)]">{sub}</div>}
		</div>
	);
}

function MobileMetaPill({ label }: { label: string }) {
	return (
		<div className="shrink-0 whitespace-nowrap rounded-full border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] px-3.5 py-2 font-[family-name:var(--font-mono)] text-[0.6875rem] tracking-[0.03em] text-[var(--theme-text)]">
			{label}
		</div>
	);
}
