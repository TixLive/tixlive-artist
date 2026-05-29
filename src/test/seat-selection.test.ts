import { describe, it, expect } from 'vitest';
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
import type { ISeatingTier } from '@/types';

const VIP: ISeatingTier = { ticket_package_id: 1, name: 'VIP', price: 500, color: '#a', seat_ids: ['parter-A-1', 'parter-A-2', 'parter-A-3', 'parter-A-4', 'parter-A-5'] };
const STD: ISeatingTier = { ticket_package_id: 2, name: 'Standard', price: 200, color: '#b', seat_ids: ['balcon-B-1', 'balcon-B-2', 'balcon-B-3'] };
const tiers = [VIP, STD];
const seatTier = buildSeatTierMap(tiers);
const MAX = 4; // max_tickets_per_user, total per order

describe('seatSelection (seat-first, per-order cap)', () => {
	it('maps every priced seat to its tier and leaves unpriced seats unmapped', () => {
		expect(seatTier.get('parter-A-1')).toBe(1);
		expect(seatTier.get('balcon-B-2')).toBe(2);
		expect(seatTier.get('ga-x-1')).toBeUndefined();
	});

	it('adds a free seat when the order is under the cap', () => {
		const r = toggleSeat('parter-A-1', new Set(), seatTier, MAX);
		expect(r.status).toBe('added');
		expect([...r.next]).toEqual(['parter-A-1']);
	});

	it('removes an already-selected seat', () => {
		const r = toggleSeat('parter-A-1', new Set(['parter-A-1']), seatTier, MAX);
		expect(r.status).toBe('removed');
		expect(r.next.size).toBe(0);
	});

	it('rejects adding past the per-order cap (order_max)', () => {
		const sel = new Set(['parter-A-1', 'parter-A-2', 'parter-A-3', 'parter-A-4']); // 4 total = cap
		const r = toggleSeat('parter-A-5', sel, seatTier, MAX);
		expect(r.status).toBe('order_max');
		expect(r.next.size).toBe(4); // unchanged
	});

	it('rejects a different tier too once the order total hits the cap (per-order, not per-category)', () => {
		const sel = new Set(['parter-A-1', 'parter-A-2', 'parter-A-3', 'parter-A-4']); // 4 total = cap
		const r = toggleSeat('balcon-B-1', sel, seatTier, MAX);
		expect(r.status).toBe('order_max'); // total cap applies across tiers
		expect(r.next.size).toBe(4);
	});

	it('allows mixing tiers while the order total is under the cap', () => {
		const sel = new Set(['parter-A-1', 'parter-A-2']); // 2 total, under cap=4
		const r = toggleSeat('balcon-B-1', sel, seatTier, MAX);
		expect(r.status).toBe('added');
		expect(r.next.size).toBe(3);
	});

	it('ignores taps on unpriced seats', () => {
		const r = toggleSeat('ga-x-1', new Set(), seatTier, MAX);
		expect(r.status).toBe('unknown');
		expect(r.tierId).toBeNull();
	});

	it('selection is valid with >= 1 seat', () => {
		expect(isSelectionValid(0)).toBe(false);
		expect(isSelectionValid(1)).toBe(true);
		expect(isSelectionValid(7)).toBe(true);
	});

	it('selectionCounts tallies per tier', () => {
		const c = selectionCounts(['parter-A-1', 'parter-A-2', 'balcon-B-1'], seatTier);
		expect(c.get(1)).toBe(2);
		expect(c.get(2)).toBe(1);
	});

	it('deriveCart groups seats by tier into cart lines (tier order), with name/price/currency', () => {
		const cart = deriveCart(new Set(['balcon-B-1', 'parter-A-1', 'parter-A-2']), seatTier, tiers, 'MDL');
		expect(cart).toEqual([
			{ ticket_type_id: 1, ticket_type_name: 'VIP', price: 500, quantity: 2, currency: 'MDL' },
			{ ticket_type_id: 2, ticket_type_name: 'Standard', price: 200, quantity: 1, currency: 'MDL' },
		]);
	});

	it('deriveCart on empty selection → []', () => {
		expect(deriveCart(new Set(), seatTier, tiers, 'MDL')).toEqual([]);
	});

	it('selectionTotal sums tier price × count', () => {
		expect(selectionTotal(new Set(['parter-A-1', 'parter-A-2', 'balcon-B-1']), seatTier, tiers)).toBe(1200);
	});

	describe('sanitizeSeats (no cart-membership filter under seat-first)', () => {
		it('keeps priced, unbooked seats from ANY tier, capped at the per-order total', () => {
			const ids = ['parter-A-1', 'parter-A-2', 'parter-A-3', 'parter-A-4', 'parter-A-5', 'balcon-B-1'];
			const out = sanitizeSeats(ids, seatTier, new Set(), MAX);
			// Total capped at 4 across all tiers — only the first 4 kept
			expect(out).toEqual(['parter-A-1', 'parter-A-2', 'parter-A-3', 'parter-A-4']);
		});

		it('drops booked seats', () => {
			const out = sanitizeSeats(['parter-A-1', 'parter-A-2'], seatTier, new Set(['parter-A-1']), MAX);
			expect(out).toEqual(['parter-A-2']);
		});

		it('drops unpriced seats but keeps tiers regardless of any "cart"', () => {
			const out = sanitizeSeats(['ga-x-1', 'balcon-B-1', 'parter-A-1'], seatTier, new Set(), MAX);
			expect(out).toEqual(['balcon-B-1', 'parter-A-1']); // ga unpriced dropped; both tiers kept
		});
	});

	it('formats a seat label', () => {
		expect(formatSeatLabel({ row: 'A', num: 12 })).toBe('A-12');
	});
});
