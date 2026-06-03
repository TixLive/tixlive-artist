import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

import SeatSelection from '@/components/seating/SeatSelection';
import { fetchEvent } from '@/queries/events/useGetEvent';
import { fetchSeating } from '@/queries/seating/useGetSeating';
import { suggestSeats } from '@/queries/seating/useSuggestSeats';
import type { ICartItem, IAddonCartItem, ITicketAddon, ISeatingResponse } from '@/types';

interface SeatsState {
	slug: string;
	eventTitle: string;
	venueName: string;
	venueAddress: string;
	sessionId: number;
	sessionDate: string;
	sessionStart: string;
	maxPerOrder: number;
	seedCart: Array<{ ticket_package_id: number; quantity: number }>;
	addonCart: IAddonCartItem[];
	addons: ITicketAddon[];
	seating: ISeatingResponse;
	initialSelectedSeatIds: string[];
	initialShortfall: boolean;
	currency: string;
	autoAllocate: boolean;
	originalCart: ICartItem[];
	bundles: Array<{ bundle_id: number; quantity: number; name: string; price: number }>;
	bundleLines: Array<{ name: string; quantity: number; price: number; includedLabels: string[] }>;
	bundleAddonQty: Record<number, number>;
}

export default function SeatsPage() {
	const { t } = useTranslation('common');
	const router = useRouter();
	// Static export: router.query.slug is '_' (shell placeholder); read real slug from URL
	const [slug, setSlug] = useState<string | undefined>(undefined);
	const [state, setState] = useState<SeatsState | null>(null);
	const [notFound, setNotFound] = useState(false);

	useEffect(() => {
		const q = router.query.slug as string | undefined;
		if (q && q !== '_') { setSlug(q); return; }
		const parts = window.location.pathname.split('/').filter(Boolean);
		setSlug(parts[1] ? decodeURIComponent(parts[1]) : undefined); // /events/:slug/seats
	}, [router.query.slug]);

	useEffect(() => {
		if (!slug) return;

		const raw = sessionStorage.getItem('tixlive:seats');
		if (!raw) {
			router.replace(`/events/${slug}`);
			return;
		}

		let stored: Record<string, string>;
		try {
			stored = JSON.parse(raw);
		} catch {
			router.replace(`/events/${slug}`);
			return;
		}

		const sessionRaw = stored.session;
		let seedCart: Array<{ ticket_package_id: number; quantity: number }> = [];
		let originalCart: ICartItem[] = [];
		let addonCart: IAddonCartItem[] = [];
		let bundleSel: Array<{ bundle_id: number; quantity: number; name: string; price: number }> = [];
		let seedCurrency: string | undefined;

		try {
			const parsed: ICartItem[] = stored.cart ? JSON.parse(stored.cart) : [];
			originalCart = Array.isArray(parsed) ? parsed.filter((c) => c && c.quantity > 0) : [];
			seedCart = originalCart.map((c) => ({ ticket_package_id: c.ticket_type_id, quantity: c.quantity }));
			seedCurrency = originalCart[0]?.currency;
		} catch {
			seedCart = [];
		}

		if (stored.addons) {
			try { addonCart = JSON.parse(stored.addons); } catch { addonCart = []; }
		}
		if (stored.bundles) {
			try { const b = JSON.parse(stored.bundles); if (Array.isArray(b)) bundleSel = b; } catch { bundleSel = []; }
		}

		(async () => {
			try {
				const event = await fetchEvent(slug);
				if (!event || !event.is_seated || event.status !== 'open') {
					router.replace(`/events/${slug}`);
					return;
				}

				const matched = sessionRaw ? event.sessions?.find((s) => String(s.id) === sessionRaw) : undefined;
				const session = matched ?? event.sessions?.[0];
				if (!session) {
					router.replace(`/events/${slug}`);
					return;
				}

				const seating = await fetchSeating(slug, session.id);

				// For the seat PREVIEW, expand any selected bundles into their seated tiers
				// and merge with the category cart — so the auto-allocate preview covers both.
				// (The bundle is still purchased as a bundle at checkout.)
				const previewCart = [...seedCart];
				if (bundleSel.length > 0 && event.bundles?.length) {
					const bundleById = new Map(event.bundles.map((b) => [b.id, b]));
					const tierQty = new Map<number, number>();
					for (const sel of bundleSel) {
						const def = bundleById.get(sel.bundle_id);
						if (!def) continue;
						for (const it of def.items) {
							if (it.ticket_package_id == null) continue;
							tierQty.set(it.ticket_package_id, (tierQty.get(it.ticket_package_id) ?? 0) + it.quantity * sel.quantity);
						}
					}
					for (const [ticket_package_id, quantity] of tierQty) {
						const existing = previewCart.find((c) => c.ticket_package_id === ticket_package_id);
						if (existing) existing.quantity += quantity;
						else previewCart.push({ ticket_package_id, quantity });
					}
				}

				let initialSelectedSeatIds: string[] = [];
				let initialShortfall = false;
				if (previewCart.length > 0) {
					try {
						const suggestion = await suggestSeats(slug, session.id, previewCart);
						initialSelectedSeatIds = suggestion.items.flatMap((i) => i.seat_ids);
						initialShortfall = suggestion.shortfall;
					} catch {
						initialSelectedSeatIds = [];
						initialShortfall = false;
					}
				}

				// Resolve each selected bundle to its fixed price + included item labels
				// ("2× VIP", "1× Parking") so the seat page can price the bundle line and
				// surface its add-ons (which have no seat on the map).
				const nameById = new Map<string, string>();
				(event.ticket_types ?? []).forEach((tt) => nameById.set(`pkg:${tt.id}`, tt.name));
				(event.ticket_addons ?? []).forEach((a) => nameById.set(`addon:${a.id}`, a.name));
				const bundleLines = bundleSel.map((sel) => {
					const def = event.bundles?.find((b) => b.id === sel.bundle_id);
					const includedLabels = (def?.items ?? [])
						.map((it) => {
							const key =
								it.ticket_package_id != null
									? `pkg:${it.ticket_package_id}`
									: it.addon_id != null
										? `addon:${it.addon_id}`
										: null;
							const name = key ? nameById.get(key) : undefined;
							return name ? `${it.quantity * sel.quantity}× ${name}` : null;
						})
						.filter((l): l is string => l !== null);
					return { name: sel.name, quantity: sel.quantity, price: sel.price, includedLabels };
				});
				// Per-addon units covered by the selected bundle(s) — locked baseline for the
				// "Enhance Your Experience" steppers.
				const bundleAddonQty: Record<number, number> = {};
				for (const sel of bundleSel) {
					const def = event.bundles?.find((b) => b.id === sel.bundle_id);
					if (!def) continue;
					for (const it of def.items) {
						if (it.addon_id == null) continue;
						bundleAddonQty[it.addon_id] = (bundleAddonQty[it.addon_id] ?? 0) + it.quantity * sel.quantity;
					}
				}

				const currency = seedCurrency ?? event.currency ?? 'MDL';
				const maxPerOrder = event.ticket_types?.[0]?.max_tickets_per_user ?? 10;

				setState({
					slug,
					eventTitle: event.title,
					venueName: event.venue_name ?? '',
					venueAddress: event.venue_address ?? '',
					sessionId: session.id,
					sessionDate: session.label ?? '',
					sessionStart: session.date ?? event.date_start ?? '',
					maxPerOrder,
					seedCart: previewCart,
					addonCart,
					addons: event.ticket_addons ?? [],
					seating,
					initialSelectedSeatIds,
					initialShortfall,
					currency,
					autoAllocate: !!event.auto_allocate_seats,
					originalCart,
					bundles: bundleSel,
					bundleLines,
					bundleAddonQty,
				});
			} catch {
				setNotFound(true);
			}
		})();
	}, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

	if (notFound) return null;
	if (!state) return null;

	return (
		<>
			<Head>
				<title>{t('seating.page_title', { event: state.eventTitle })}</title>
				<meta name="robots" content="noindex" />
				<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
			</Head>
			<SeatSelection
				slug={state.slug}
				sessionId={state.sessionId}
				sessionDate={state.sessionDate}
				sessionStart={state.sessionStart}
				eventTitle={state.eventTitle}
				venueName={state.venueName}
				venueAddress={state.venueAddress}
				maxPerOrder={state.maxPerOrder}
				seedCart={state.seedCart}
				addonCart={state.addonCart}
				addons={state.addons}
				seating={state.seating}
				initialSelectedSeatIds={state.initialSelectedSeatIds}
				initialShortfall={state.initialShortfall}
				currency={state.currency}
				readOnly={state.autoAllocate}
				originalCart={state.originalCart}
				bundles={state.bundles}
				bundleLines={state.bundleLines}
				bundleAddonQty={state.bundleAddonQty}
			/>
		</>
	);
}

import { staticI18nProps } from '@/lib/staticI18n';

export async function getStaticPaths() {
	return { paths: [{ params: { slug: '_' } }], fallback: false };
}

export function getStaticProps() {
	return { props: staticI18nProps() };
}
