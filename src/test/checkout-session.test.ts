import { describe, it, expect } from 'vitest';
import {
	buildCheckoutSelection,
	checkoutSessionUrl,
	formatSeatIdLabel,
	hydrateCheckoutSelection,
	parseSeatId,
	readCheckoutParams,
} from '@/lib/checkoutSession';
import type { ICartItem, IEventDetail } from '@/types';

const cart: ICartItem[] = [
	{ ticket_type_id: 7, ticket_type_name: 'VIP', price: 500, quantity: 2, currency: 'MDL' },
	{ ticket_type_id: 8, ticket_type_name: 'Standard', price: 200, quantity: 0, currency: 'MDL' },
];

const event = {
	id: 1,
	slug: 'concert',
	currency: 'MDL',
	ticket_types: [
		{ id: 7, name: 'VIP', description: null, price: 500, currency: 'MDL', remaining_capacity: null, max_tickets_per_user: 10 },
		{ id: 8, name: 'Standard', description: null, price: 200, currency: 'MDL', remaining_capacity: null, max_tickets_per_user: 10 },
	],
	ticket_addons: [
		{ id: 3, name: 'Parking', description: null, price: 50, max_quantity: null, per_ticket: false, color: null, sort_order: 0 },
	],
	bundles: [
		{ id: 5, name: 'Duo', description: null, price: 900, currency: 'MDL', remaining_capacity: null, items: [] },
	],
} as unknown as IEventDetail;

describe('buildCheckoutSelection', () => {
	it('parks ids + quantities only and drops empty lines', () => {
		const selection = buildCheckoutSelection({ sessionId: 42, cart, locale: 'ro' });
		expect(selection).toEqual({
			session_id: 42,
			cart: [{ ticket_package_id: 7, quantity: 2 }],
			locale: 'ro',
		});
	});

	it('never carries a price', () => {
		const selection = buildCheckoutSelection({
			sessionId: 42,
			cart,
			addons: [{ addon_id: 3, addon_name: 'Parking', price: 50, quantity: 1, per_ticket: false, currency: 'MDL' }],
			bundles: [{ bundle_id: 5, quantity: 1 }],
		});
		expect(JSON.stringify(selection)).not.toContain('price');
		expect(selection.addons).toEqual([{ addon_id: 3, quantity: 1 }]);
		expect(selection.bundles).toEqual([{ bundle_id: 5, quantity: 1 }]);
	});

	it('keeps an empty cart for a bundles-only order (the server requires the key)', () => {
		const selection = buildCheckoutSelection({ sessionId: 42, cart: [], bundles: [{ bundle_id: 5, quantity: 1 }] });
		expect(selection.cart).toEqual([]);
		expect(selection.bundles).toHaveLength(1);
	});

	it('omits empty seats/addons/bundles rather than sending empty arrays', () => {
		const selection = buildCheckoutSelection({ sessionId: 42, cart, addons: [], bundles: [], selectedSeats: [] });
		expect('addons' in selection).toBe(false);
		expect('bundles' in selection).toBe(false);
		expect('selected_seats' in selection).toBe(false);
	});

	it('parks the picked seats', () => {
		const selection = buildCheckoutSelection({ sessionId: 42, cart, selectedSeats: ['parter-A-1', 'parter-A-2'] });
		expect(selection.selected_seats).toEqual(['parter-A-1', 'parter-A-2']);
	});
});

describe('checkout url', () => {
	it('addresses checkout by session uuid + event slug', () => {
		expect(checkoutSessionUrl('11111111-2222-3333-4444-555555555555', 'my event')).toBe(
			'/checkout?session=11111111-2222-3333-4444-555555555555&event=my%20event',
		);
	});

	it('reads both params back, and null when absent', () => {
		expect(readCheckoutParams('?session=abc&event=concert')).toEqual({ sessionId: 'abc', eventSlug: 'concert' });
		expect(readCheckoutParams('')).toEqual({ sessionId: null, eventSlug: null });
		expect(readCheckoutParams('?session=')).toEqual({ sessionId: null, eventSlug: null });
	});
});

describe('hydrateCheckoutSelection', () => {
	it('rebuilds names + prices from the live event', () => {
		const hydrated = hydrateCheckoutSelection(event, {
			session_id: 42,
			cart: [{ ticket_package_id: 7, quantity: 2 }],
			addons: [{ addon_id: 3, quantity: 1 }],
			bundles: [{ bundle_id: 5, quantity: 1 }],
		});
		expect(hydrated.cart).toEqual([
			{ ticket_type_id: 7, ticket_type_name: 'VIP', price: 500, quantity: 2, currency: 'MDL' },
		]);
		expect(hydrated.addonCart).toEqual([
			{ addon_id: 3, addon_name: 'Parking', price: 50, quantity: 1, per_ticket: false, currency: 'MDL' },
		]);
		expect(hydrated.bundleCart).toEqual([{ bundle_id: 5, quantity: 1, name: 'Duo', price: 900 }]);
	});

	it('drops ids the event no longer offers instead of rendering a phantom line', () => {
		const hydrated = hydrateCheckoutSelection(event, {
			session_id: 42,
			cart: [{ ticket_package_id: 999, quantity: 1 }],
			addons: [{ addon_id: 999, quantity: 1 }],
			bundles: [{ bundle_id: 999, quantity: 1 }],
		});
		expect(hydrated.cart).toEqual([]);
		expect(hydrated.addonCart).toEqual([]);
		expect(hydrated.bundleCart).toEqual([]);
	});

	it('takes the price from the event, never from the parked row', () => {
		// A tier repriced while the cart sat parked must resume at the current price.
		const repriced = { ...event, ticket_types: [{ ...event.ticket_types[0], price: 650 }] } as IEventDetail;
		const hydrated = hydrateCheckoutSelection(repriced, { session_id: 42, cart: [{ ticket_package_id: 7, quantity: 1 }] });
		expect(hydrated.cart[0].price).toBe(650);
	});
});

describe('seat ids', () => {
	it('splits section-row-num from the right, so hyphenated sections survive', () => {
		expect(parseSeatId('parter-A-12')).toEqual({ section: 'parter', row: 'A', num: '12' });
		expect(parseSeatId('loja-vip-B-3')).toEqual({ section: 'loja-vip', row: 'B', num: '3' });
		expect(parseSeatId('bad-id')).toBeNull();
	});

	it('labels a resumed seat, and falls back to the raw id when unparseable', () => {
		expect(formatSeatIdLabel('parter-A-12', { row: 'Row', seat: 'Seat' })).toBe('parter · Row A, Seat 12');
		expect(formatSeatIdLabel('weird', { row: 'Row', seat: 'Seat' })).toBe('weird');
	});
});
