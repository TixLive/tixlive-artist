'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { addToast, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';

import { computeAllSeats, GEOMETRY_VERSION, Seat } from '@/lib/seatingGeometry';
import {
	buildSeatTierMap,
	selectionCounts,
	toggleSeat,
	isSelectionValid,
	deriveCart,
	selectionTotal,
	sanitizeSeats,
	formatSeatLabel,
} from '@/lib/seatSelection';
import { buildTierColorById, buildTierColorBySeatId } from '@/lib/tierColors';
import { requestSuggest } from '@/lib/seatClient';
import SeatLegend from '@/components/seating/SeatLegend';
import SelectedSeatsList, { SelectedSeatItem } from '@/components/seating/SelectedSeatsList';
import type { IAddonCartItem, ISeatingResponse } from '@/types';

const SeatingViewer = dynamic(() => import('@/components/seating/SeatingViewer'), {
	ssr: false,
	loading: () => (
		<div className="flex h-full w-full items-center justify-center rounded-[20px] border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)]">
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
	eventTitle: string;
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
	eventTitle,
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

	// ── State ────────────────────────────────────────────────────────────────────
	// Sanitize the server-suggested seed against what's selectable (priced, not
	// booked, within the per-category cap). No cart-tier filter — any tier is fair game.
	const [selected, setSelected] = useState<Set<string>>(
		() => new Set(sanitizeSeats(initialSelectedSeatIds, seatTier, bookedSet, maxPerCategory))
	);
	const [shortfall, setShortfall] = useState(initialShortfall);
	const [repicking, setRepicking] = useState(false);

	const { isOpen: modalOpen, onClose: closeModal, onOpen: openModal } = useDisclosure({
		defaultOpen: !versionMismatch && initialSelectedSeatIds.length > 0,
	});

	// ── Derived selection views ──────────────────────────────────────────────────
	const counts = useMemo(() => selectionCounts(selected, seatTier), [selected, seatTier]);
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
			};
			return { item, idx: meta?.index ?? 99 };
		});
		withIdx.sort((a, b) => a.idx - b.idx || a.item.label.localeCompare(b.item.label, undefined, { numeric: true }));
		return withIdx.map((x) => x.item);
	}, [selected, seatTier, tierMeta, seatById, tierColorBySeatId]);

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
		if (!complete) return;
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
	}, [complete, selected, seatTier, tiers, currency, selectedItems, slug, sessionId, addonCart]);

	// ── Geometry version guard (deploy-skew, D12) ────────────────────────────────
	if (versionMismatch) {
		return (
			<div className="mx-auto max-w-md py-20 text-center">
				<Icon icon="mdi:update" width={40} className="mx-auto mb-4 text-[var(--theme-text-muted)]" />
				<h2 className="mb-2 font-[family-name:var(--font-display)] text-[1.25rem] font-[700] text-[var(--theme-text)]">
					{t('seating.version_mismatch_title')}
				</h2>
				<p className="mb-6 text-[0.875rem] text-[var(--theme-text-muted)]">{t('seating.version_mismatch_body')}</p>
				<div className="flex justify-center gap-3">
					<Button
						onPress={() => window.location.reload()}
						className="rounded-xl font-[family-name:var(--font-display)] font-[700] text-[var(--theme-bg)]"
						style={{ backgroundColor: 'var(--brand-primary)' }}
					>
						{t('seating.refresh')}
					</Button>
					<Button as={Link} href={`/events/${slug}`} variant="ghost" className="rounded-xl">
						{t('seating.back_to_event')}
					</Button>
				</div>
			</div>
		);
	}

	const sidebar = (
		<div className="space-y-5 rounded-[20px] border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-6">
			<SeatLegend tiers={tiers} counts={counts} colorByTierId={colorByTierId} currency={currency} />
			<div className="border-t border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)]" />
			<SelectedSeatsList items={selectedItems} onRemove={handleRemove} />

			{seedCart.length > 0 && (
				<button
					type="button"
					onClick={handleRepick}
					disabled={repicking}
					className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-[color-mix(in_srgb,var(--theme-text)_10%,transparent)] py-2.5 text-[0.8125rem] font-medium text-[var(--theme-text-muted)] transition-colors hover:text-[var(--theme-text)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
				>
					<Icon icon={repicking ? 'mdi:loading' : 'mdi:auto-fix'} width={16} className={repicking ? 'animate-spin' : ''} />
					{t('seating.pick_best')}
				</button>
			)}

			<div className="border-t border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] pt-4">
				<div className="mb-4 flex items-center justify-between">
					<span className="font-[family-name:var(--font-display)] font-[700] text-[var(--theme-text)]">
						{t('seating.total')}
					</span>
					<span className="font-[family-name:var(--font-data)] text-[1.125rem] font-bold tabular-nums text-[var(--theme-text)]">
						{total} {currency}
					</span>
				</div>
				<Button
					size="lg"
					isDisabled={!complete}
					onPress={handleContinue}
					className="w-full rounded-xl font-[family-name:var(--font-display)] font-[700] text-[var(--theme-bg)] disabled:opacity-45"
					style={{ backgroundColor: 'var(--brand-primary)' }}
				>
					{t('seating.continue')}
					<Icon icon="mdi:arrow-right" className="ml-1" width={20} />
				</Button>
				{!complete && (
					<p className="mt-2 text-center text-[0.75rem] text-[var(--theme-text-muted)]">
						{t('seating.continue_hint')}
					</p>
				)}
			</div>
		</div>
	);

	return (
		<div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
			{/* Header */}
			<div className="mb-4 flex items-center justify-between gap-4">
				<div className="min-w-0">
					<Link
						href={`/events/${slug}`}
						className="mb-1 inline-flex items-center gap-1 text-[0.8125rem] text-[var(--theme-text-muted)] transition-colors hover:text-[var(--theme-text)]"
					>
						<Icon icon="mdi:arrow-left" width={16} />
						{t('seating.back_to_event')}
					</Link>
					<h1 className="truncate font-[family-name:var(--font-display)] text-[1.5rem] font-[800] leading-tight tracking-[-0.01em] text-[var(--theme-text)]">
						{eventTitle}
					</h1>
					{sessionDate && (
						<p className="font-[family-name:var(--font-data)] text-[0.8125rem] text-[var(--theme-text-muted)]">
							{sessionDate}
						</p>
					)}
				</div>
			</div>

			{/* Live region for assistive tech */}
			<div aria-live="polite" className="sr-only">
				{liveMessage}
			</div>

			<div className="md:flex md:gap-8">
				{/* Canvas */}
				<div className="min-w-0 flex-1">
					<div className="h-[58vh] w-full md:h-[calc(100vh-12rem)]">
						<SeatingViewer
							sections={seating.sections}
							canvasW={seating.canvas_w}
							canvasH={seating.canvas_h}
							bookedSeatIds={bookedSet}
							selectedSeatIds={selected}
							tierColorBySeatId={tierColorBySeatId}
							onSeatToggle={handleSeatToggle}
							reducedMotion={reducedMotion}
						/>
					</div>
					<p className="mt-2 hidden text-center text-[0.75rem] text-[var(--theme-text-muted)] md:block">
						{t('seating.canvas_hint')}
					</p>
				</div>

				{/* Sidebar — desktop sticky */}
				<aside className="mt-5 w-full md:mt-0 md:w-[360px] md:flex-shrink-0">
					<div className="md:sticky md:top-24">{sidebar}</div>
				</aside>
			</div>

			{/* Bottom padding so the mobile sticky bar never covers the sidebar */}
			<div className="h-24 md:hidden" />

			{/* Mobile sticky continue bar */}
			<div
				className="fixed inset-x-0 bottom-0 z-40 border-t border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-bg)]/95 px-4 py-3 shadow-[0_-4px_20px_rgba(20,19,18,0.06)] backdrop-blur-xl md:hidden"
				style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
			>
				<div className="flex items-center justify-between gap-3">
					<div>
						<p className="text-[0.75rem] text-[var(--theme-text-muted)]">
							{t('seating.seats_count', { count: selected.size })}
						</p>
						<p className="font-[family-name:var(--font-data)] text-[1.125rem] font-bold tabular-nums text-[var(--theme-text)]">
							{total} {currency}
						</p>
					</div>
					<Button
						size="lg"
						isDisabled={!complete}
						onPress={handleContinue}
						className="rounded-xl font-[family-name:var(--font-display)] font-[700] text-[var(--theme-bg)] disabled:opacity-45"
						style={{ backgroundColor: 'var(--brand-primary)' }}
					>
						{t('seating.continue')}
						<Icon icon="mdi:arrow-right" className="ml-1" width={20} />
					</Button>
				</div>
			</div>

			{/* Auto-pick arrival modal */}
			<Modal isOpen={modalOpen} onClose={closeModal} placement="center" backdrop="opaque" size="sm">
				<ModalContent>
					{() => (
						<>
							<ModalHeader className="font-[family-name:var(--font-display)] text-[1.125rem] font-[800] text-[var(--theme-text)]">
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
									<Button variant="ghost" onPress={handleRepick} isLoading={repicking} className="rounded-xl">
										{t('seating.pick_best')}
									</Button>
								)}
								<Button
									onPress={closeModal}
									className="rounded-xl font-[family-name:var(--font-display)] font-[700] text-[var(--theme-bg)]"
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
