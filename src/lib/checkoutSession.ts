/**
 * Checkout-session transport: the cart selection lives on besttix (one uuid), not in a
 * one-shot sessionStorage handoff, so `/checkout?session=<uuid>` survives a reload, a
 * magic-link round trip mid-checkout, and a link opened in a second tab.
 *
 * Everything here is display-side reconstruction: the parked row carries ids + quantities
 * only, so names, prices and seat labels are re-derived from the event the page fetches
 * anyway. Prices never travel through the session — besttix re-prices the whole order in
 * `order/buy` and stays the single price authority.
 */

import type {
	IAddonCartItem,
	ICartItem,
	ICheckoutSelection,
	IEventDetail,
} from '@/types';

export interface IBundleCartItem {
	bundle_id: number;
	quantity: number;
	name: string;
	price: number;
}

export interface IHydratedSelection {
	cart: ICartItem[];
	addonCart: IAddonCartItem[];
	bundleCart: IBundleCartItem[];
}

interface IBuildSelectionInput {
	sessionId: number;
	cart: ICartItem[];
	addons?: IAddonCartItem[];
	bundles?: Array<{ bundle_id: number; quantity: number }>;
	selectedSeats?: string[];
	promoCode?: string;
	locale?: string;
}

/**
 * Strip a display cart down to what besttix parks: ids + quantities. Empty collections are
 * omitted rather than sent as `[]`, except `cart`, which the server always expects as an
 * array (a bundles-only order legitimately parks an empty one).
 */
export function buildCheckoutSelection(input: IBuildSelectionInput): ICheckoutSelection {
	const cart = input.cart
		.filter((item) => item.quantity > 0)
		.map((item) => ({ ticket_package_id: item.ticket_type_id, quantity: item.quantity }));

	const addons = (input.addons ?? [])
		.filter((addon) => addon.quantity > 0)
		.map((addon) => ({ addon_id: addon.addon_id, quantity: addon.quantity }));

	const bundles = (input.bundles ?? [])
		.filter((bundle) => bundle.quantity > 0)
		.map((bundle) => ({ bundle_id: bundle.bundle_id, quantity: bundle.quantity }));

	const seats = (input.selectedSeats ?? []).filter((seat) => typeof seat === 'string' && seat.length > 0);

	return {
		session_id: input.sessionId,
		cart,
		...(addons.length > 0 && { addons }),
		...(bundles.length > 0 && { bundles }),
		...(seats.length > 0 && { selected_seats: seats }),
		...(input.promoCode && { promo_code: input.promoCode }),
		...(input.locale && { locale: input.locale }),
	};
}

/** The url `/checkout` is reached by once the selection is parked. */
export function checkoutSessionUrl(checkoutSessionId: string, eventSlug: string): string {
	return `/checkout?session=${encodeURIComponent(checkoutSessionId)}&event=${encodeURIComponent(eventSlug)}`;
}

/**
 * Read the checkout url params. Static export means `router.query` is empty on the first
 * render, so the page reads `window.location.search` directly (same convention the dynamic
 * routes use for their path params).
 */
export function readCheckoutParams(search: string): { sessionId: string | null; eventSlug: string | null } {
	const params = new URLSearchParams(search);
	const sessionId = params.get('session');
	const eventSlug = params.get('event');
	return {
		sessionId: sessionId && sessionId.length > 0 ? sessionId : null,
		eventSlug: eventSlug && eventSlug.length > 0 ? eventSlug : null,
	};
}

/**
 * Rebuild the display cart from a parked selection + the live event.
 *
 * Ids the event no longer offers (a tier pulled while the cart sat parked) are dropped: the
 * buyer sees what is still buyable, and besttix rejects the rest at order time anyway.
 *
 * `promo_code` is deliberately not applied: the cart is parked before the promo field exists
 * (it lives on the checkout page), and re-applying a code without re-validating it would show
 * a discount the server hasn't agreed to.
 */
export function hydrateCheckoutSelection(event: IEventDetail, selection: ICheckoutSelection): IHydratedSelection {
	const ticketById = new Map((event.ticket_types ?? []).map((tt) => [tt.id, tt]));
	const addonById = new Map((event.ticket_addons ?? []).map((a) => [a.id, a]));
	const bundleById = new Map((event.bundles ?? []).map((b) => [b.id, b]));
	const fallbackCurrency = event.currency ?? '';

	const cart: ICartItem[] = [];
	for (const item of selection.cart ?? []) {
		const tier = ticketById.get(item.ticket_package_id);
		if (!tier) continue;
		cart.push({
			ticket_type_id: tier.id,
			ticket_type_name: tier.name,
			price: tier.price,
			quantity: item.quantity,
			currency: tier.currency ?? fallbackCurrency,
		});
	}

	const addonCart: IAddonCartItem[] = [];
	for (const item of selection.addons ?? []) {
		const addon = addonById.get(item.addon_id);
		if (!addon) continue;
		addonCart.push({
			addon_id: addon.id,
			addon_name: addon.name,
			price: addon.price,
			quantity: item.quantity,
			per_ticket: addon.per_ticket,
			currency: cart[0]?.currency ?? fallbackCurrency,
		});
	}

	const bundleCart: IBundleCartItem[] = [];
	for (const item of selection.bundles ?? []) {
		const bundle = bundleById.get(item.bundle_id);
		if (!bundle) continue;
		bundleCart.push({
			bundle_id: bundle.id,
			quantity: item.quantity,
			name: bundle.name,
			price: bundle.price,
		});
	}

	return { cart, addonCart, bundleCart };
}

/**
 * Split a seat id into its parts. The id contract is `${section}-${row}-${num}`; a section
 * name may itself contain hyphens, so the split is anchored at the right.
 */
export function parseSeatId(seatId: string): { section: string; row: string; num: string } | null {
	const parts = seatId.split('-');
	if (parts.length < 3) return null;
	const num = parts[parts.length - 1];
	const row = parts[parts.length - 2];
	const section = parts.slice(0, parts.length - 2).join('-');
	if (!section || !row || !num) return null;
	return { section, row, num };
}

/**
 * Summary label for a seat resumed from a parked session, e.g. "Parter · Rând A, Loc 12".
 *
 * The picker builds its labels from the seating chart (tier name + seat label); a resumed
 * checkout has only the seat ids, so the section name in the id stands in for the tier. An
 * unparseable id is shown as-is rather than dropped — the buyer must still see what they get.
 */
export function formatSeatIdLabel(seatId: string, words: { row: string; seat: string }): string {
	const parts = parseSeatId(seatId);
	if (!parts) return seatId;
	return `${parts.section} · ${words.row} ${parts.row}, ${words.seat} ${parts.num}`;
}
