// Pure seat-selection rules for the SEAT-FIRST buy flow.
//
// No DOM, no React — so the cap/validation logic is unit-tested cheaply and the
// SeatSelection orchestrator stays a thin view layer. The buyer picks seats freely
// on the map across ANY sector; the TOTAL selection is capped at `maxPerOrder`
// (= event.max_tickets_per_user, an event-level scalar applied per order — see
// besttix PublicEvent.Service.ts). The order CART is DERIVED from the chosen
// seats (group by tier → quantity), so it always agrees with `selected_seats`
// (besttix validates selected_seats.length === Σ cart quantity).

import type { Seat } from '@/lib/seatingGeometry';
import type { ICartItem, ISeatingTier } from '@/types';

/** seat ID → owning tier (ticket_package_id). Seats not in any tier are unpriced. */
export function buildSeatTierMap(tiers: ISeatingTier[]): Map<string, number> {
	const m = new Map<string, number>();
	for (const t of tiers) {
		for (const id of t.seat_ids) m.set(id, t.ticket_package_id);
	}
	return m;
}

/** How many selected seats currently belong to each tier. */
export function selectionCounts(selected: Iterable<string>, seatTier: Map<string, number>): Map<number, number> {
	const counts = new Map<number, number>();
	for (const id of selected) {
		const tierId = seatTier.get(id);
		if (tierId == null) continue;
		counts.set(tierId, (counts.get(tierId) ?? 0) + 1);
	}
	return counts;
}

export type ToggleStatus = 'added' | 'removed' | 'order_max' | 'unknown';

export interface ToggleResult {
	next: Set<string>;
	status: ToggleStatus;
	tierId: number | null;
}

/**
 * Tapping a seat:
 *  • already selected         → remove it
 *  • free + order under cap   → add it
 *  • free + order at the cap  → reject ('order_max'; UI shows "Max N per order")
 *  • not a priced seat        → 'unknown' (no-op)
 */
export function toggleSeat(
	seatId: string,
	selected: Set<string>,
	seatTier: Map<string, number>,
	maxPerOrder: number
): ToggleResult {
	const tierId = seatTier.get(seatId);
	if (tierId == null) return { next: selected, status: 'unknown', tierId: null };

	if (selected.has(seatId)) {
		const next = new Set(selected);
		next.delete(seatId);
		return { next, status: 'removed', tierId };
	}

	if (selected.size >= maxPerOrder) return { next: selected, status: 'order_max', tierId };

	const next = new Set(selected);
	next.add(seatId);
	return { next, status: 'added', tierId };
}

/** Valid to continue: at least one seat chosen. (Per-order cap is enforced at toggle time.) */
export function isSelectionValid(count: number): boolean {
	return count >= 1;
}

/**
 * Derive the order cart from the chosen seats: group selected seats by tier →
 * quantity, in tier order. `currency` is event-wide (tiers carry no currency).
 */
export function deriveCart(
	selected: Set<string>,
	seatTier: Map<string, number>,
	tiers: ISeatingTier[],
	currency: string
): ICartItem[] {
	const counts = selectionCounts(selected, seatTier);
	const cart: ICartItem[] = [];
	for (const tier of tiers) {
		const quantity = counts.get(tier.ticket_package_id) ?? 0;
		if (quantity === 0) continue;
		cart.push({
			ticket_type_id: tier.ticket_package_id,
			ticket_type_name: tier.name,
			price: tier.price,
			quantity,
			currency,
		});
	}
	return cart;
}

/** Total price of the current selection (Σ tier.price × selected count). */
export function selectionTotal(
	selected: Set<string>,
	seatTier: Map<string, number>,
	tiers: ISeatingTier[]
): number {
	const counts = selectionCounts(selected, seatTier);
	const priceById = new Map(tiers.map((t) => [t.ticket_package_id, t.price]));
	let total = 0;
	for (const [tierId, n] of counts) total += (priceById.get(tierId) ?? 0) * n;
	return total;
}

/**
 * Sanitize a raw id list (besttix /suggest output or a forwarded initial seed):
 * keep priced seats, drop booked, cap the TOTAL kept at `maxPerOrder`. Order is
 * preserved. NOTE: there is deliberately NO cart-tier-membership filter — under
 * seat-first every priced tier is selectable, so a seed (or suggestion) may span
 * any tier. This is defense-in-depth so the on-screen selection always matches
 * what the canvas allows, even if the suggest contract drifts or the booked
 * snapshot and the suggest call disagree.
 */
export function sanitizeSeats(
	ids: Iterable<string>,
	seatTier: Map<string, number>,
	booked: Set<string>,
	maxPerOrder: number
): string[] {
	const out: string[] = [];
	for (const id of ids) {
		if (out.length >= maxPerOrder) break;
		if (booked.has(id)) continue;
		const tierId = seatTier.get(id);
		if (tierId == null) continue;
		out.push(id);
	}
	return out;
}

/** Human label for a seat, e.g. "A-12". */
export function formatSeatLabel(seat: Pick<Seat, 'row' | 'num'>): string {
	return `${seat.row}-${seat.num}`;
}
