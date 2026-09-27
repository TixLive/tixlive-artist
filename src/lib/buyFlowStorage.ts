/**
 * The buy flow's `sessionStorage` records, and the two rules that must hold for them.
 *
 * A pending order travels event page → (seats) → checkout as a flat
 * `Record<string, string>` of JSON-encoded values, under `tixlive:seats` (before the seat
 * step) / `tixlive:checkout` (after). Each page reads and writes that record inline; this
 * module owns the keys, the cart's idempotency key, and the moment the cart stops existing.
 */

export const CHECKOUT_STORAGE_KEY = 'tixlive:checkout';
export const SEATS_STORAGE_KEY = 'tixlive:seats';

/** Field the pending cart's idempotency key is stored under inside the checkout record. */
export const IDEMPOTENCY_KEY_FIELD = 'idempotency_key';
/** Field holding the selection that key was minted for — see {@link resolveCheckoutIdempotencyKey}. */
export const IDEMPOTENCY_CART_FIELD = 'idempotency_cart';

/**
 * The record fields that shape the order `POST /api/public/order/buy` creates. The key is
 * bound to exactly these: a changed selection is a different purchase and must not
 * short-circuit onto the order the previous one created. Everything else in the record
 * (`seat_labels`) is read for display only and leaves the key alone.
 */
const ORDER_SHAPING_FIELDS = ['event', 'session', 'cart', 'addons', 'bundles', 'selected_seats', 'auto_allocate'] as const;

/** The pending checkout record, or `null` when there is none (or it is unreadable). */
export function readCheckoutRecord(): Record<string, string> | null {
	if (typeof window === 'undefined') return null;
	try {
		const raw = sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as unknown;
		return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : null;
	} catch {
		return null;
	}
}

function cartSignature(stored: Record<string, string>): string {
	return JSON.stringify(ORDER_SHAPING_FIELDS.map((field) => stored[field] ?? ''));
}

function mintIdempotencyKey(): string {
	return typeof crypto !== 'undefined' && 'randomUUID' in crypto
		? crypto.randomUUID()
		: `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * The idempotency key for the cart held in `sessionStorage` — stable for as long as that
 * cart is, minted next to it on first use.
 *
 * besttix keys the buy route's idempotency on this value, so a key re-minted per component
 * mount guards nothing against the one gesture that matters: Back out of the payment provider
 * — or out of `/checkout/success` — re-mounts checkout with the same cart, and a second "Pay"
 * then creates and charges a second real order for the same tickets. Persisted with the cart,
 * that second attempt lands on the first order instead of a new one.
 *
 * `null` means there is no pending cart — it already became an order (the payment-return page
 * calls {@link clearBuyFlowStorage}) or was never written. The caller must not buy: this is
 * also the only guard left when the browser restores checkout from its back-forward cache,
 * where no mount, and so no mount-time guard, runs.
 */
export function resolveCheckoutIdempotencyKey(): string | null {
	const stored = readCheckoutRecord();
	if (!stored) return null;

	const signature = cartSignature(stored);
	const existing = stored[IDEMPOTENCY_KEY_FIELD];
	if (existing && stored[IDEMPOTENCY_CART_FIELD] === signature) return existing;

	const key = mintIdempotencyKey();
	try {
		sessionStorage.setItem(
			CHECKOUT_STORAGE_KEY,
			JSON.stringify({ ...stored, [IDEMPOTENCY_KEY_FIELD]: key, [IDEMPOTENCY_CART_FIELD]: signature }),
		);
	} catch {
		// A key we could not persist still covers this attempt's own double-tap.
	}
	return key;
}

/**
 * Ends the pending buy flow: the cart has become an order, so nothing may re-enter checkout
 * with it. Called from the payment-return page — until then the cart was never removed at all,
 * on any path, which is what let a Back gesture after a paid order buy the same tickets twice.
 */
export function clearBuyFlowStorage(): void {
	if (typeof window === 'undefined') return;
	try {
		sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
		sessionStorage.removeItem(SEATS_STORAGE_KEY);
	} catch {
		// Storage denied (private mode / quota) — nothing to clean up.
	}
}
