// The buy flow's double-charge guard (T3541 — the tixlive-whitelabel T3511 hole, in this repo).
//
// The cart lived in sessionStorage and was never removed — not at success, not when the buyer
// was handed to the payment provider — while the idempotency key besttix keys `order/buy` on
// was re-minted on every mount of the checkout page. Back out of the provider (or out of
// /checkout/success) therefore re-entered checkout with the same tickets and a NEW key, which
// created and charged a second real order for them.
//
// Two rules close it, and this file pins both: the key is stable for as long as the cart it
// belongs to, and a resolved order ends that cart's life.
import { describe, expect, it, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
	CHECKOUT_STORAGE_KEY,
	SEATS_STORAGE_KEY,
	IDEMPOTENCY_KEY_FIELD,
	clearBuyFlowStorage,
	readCheckoutRecord,
	resolveCheckoutIdempotencyKey,
} from '@/lib/buyFlowStorage';

const SRC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readSrc = (rel: string) => fs.readFileSync(path.join(SRC_DIR, rel), 'utf8');

/** A minimal sessionStorage, the only browser API these helpers touch. */
function stubStorage(initial: Record<string, string> = {}) {
	const store = new Map(Object.entries(initial));
	vi.stubGlobal('window', {});
	vi.stubGlobal('sessionStorage', {
		getItem: (k: string) => store.get(k) ?? null,
		setItem: (k: string, v: string) => void store.set(k, v),
		removeItem: (k: string) => void store.delete(k),
	});
	return store;
}

const cart = (over: Record<string, string> = {}) => ({
	event: 'concert-1',
	session: '7',
	cart: JSON.stringify([{ ticket_type_id: 5, quantity: 2 }]),
	...over,
});

const write = (record: Record<string, string>) => ({ [CHECKOUT_STORAGE_KEY]: JSON.stringify(record) });

describe('resolveCheckoutIdempotencyKey', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('mints a key on first use and persists it next to the cart', () => {
		const store = stubStorage(write(cart()));
		const key = resolveCheckoutIdempotencyKey();
		expect(key).toBeTruthy();
		const stored = JSON.parse(store.get(CHECKOUT_STORAGE_KEY) as string);
		expect(stored[IDEMPOTENCY_KEY_FIELD]).toBe(key);
		// The cart itself is untouched.
		expect(stored.cart).toBe(cart().cart);
	});

	it('returns the same key on a later mount — this is what stops the second charge', () => {
		const store = stubStorage(write(cart()));
		const first = resolveCheckoutIdempotencyKey();
		// A Back gesture re-mounts the page: same cart in storage, fresh component state.
		const second = resolveCheckoutIdempotencyKey();
		expect(second).toBe(first);
		expect(JSON.parse(store.get(CHECKOUT_STORAGE_KEY) as string)[IDEMPOTENCY_KEY_FIELD]).toBe(first);
	});

	it.each(['cart', 'addons', 'bundles', 'selected_seats', 'auto_allocate', 'session', 'event'])(
		'rotates the key when %s changes — a different cart is a different purchase',
		(field) => {
			stubStorage(write({ ...cart(), [field]: 'before' }));
			const first = resolveCheckoutIdempotencyKey();
			const stored = JSON.parse(globalThis.sessionStorage.getItem(CHECKOUT_STORAGE_KEY) as string);
			globalThis.sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify({ ...stored, [field]: 'after' }));
			expect(resolveCheckoutIdempotencyKey()).not.toBe(first);
		},
	);

	it('keeps the key when only display-only fields move', () => {
		stubStorage(write(cart()));
		const first = resolveCheckoutIdempotencyKey();
		const stored = JSON.parse(globalThis.sessionStorage.getItem(CHECKOUT_STORAGE_KEY) as string);
		// Seat labels are a preview for the checkout summary; the order is unchanged.
		globalThis.sessionStorage.setItem(
			CHECKOUT_STORAGE_KEY,
			JSON.stringify({ ...stored, seat_labels: JSON.stringify(['A 1']) }),
		);
		expect(resolveCheckoutIdempotencyKey()).toBe(first);
	});

	it('answers null when there is no pending cart, so nothing can be bought', () => {
		stubStorage();
		expect(resolveCheckoutIdempotencyKey()).toBeNull();
	});

	it('answers null on an unreadable record rather than minting a key for it', () => {
		stubStorage({ [CHECKOUT_STORAGE_KEY]: 'not json' });
		expect(resolveCheckoutIdempotencyKey()).toBeNull();
		expect(readCheckoutRecord()).toBeNull();
	});

	it('answers null server-side (no window) instead of throwing', () => {
		vi.stubGlobal('window', undefined);
		expect(resolveCheckoutIdempotencyKey()).toBeNull();
	});
});

describe('clearBuyFlowStorage', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('drops both buy-flow records, so checkout cannot be re-entered with the cart', () => {
		const store = stubStorage({
			...write(cart()),
			[SEATS_STORAGE_KEY]: JSON.stringify({ event: 'concert-1' }),
		});
		clearBuyFlowStorage();
		expect(store.has(CHECKOUT_STORAGE_KEY)).toBe(false);
		expect(store.has(SEATS_STORAGE_KEY)).toBe(false);
		expect(resolveCheckoutIdempotencyKey()).toBeNull();
	});

	it('is a no-op server-side', () => {
		vi.stubGlobal('window', undefined);
		expect(() => clearBuyFlowStorage()).not.toThrow();
	});
});

// The behaviour above only protects a buyer if the pages are wired to it. There is no DOM
// testing library in this repo (vitest runs in `node`), so the wiring is checked in the
// sources — the same approach the seating parity suites take.
describe('the checkout pages are wired to the guard', () => {
	it('checkout resolves the cart key instead of minting one per mount', () => {
		const src = readSrc('pages/checkout/index.tsx');
		expect(src).toMatch(/const idempotencyKey = resolveCheckoutIdempotencyKey\(\);/);
		expect(src).toMatch(/idempotency_key: idempotencyKey,/);
		// No key is minted on this page any more — that is the whole bug.
		expect(src).not.toMatch(/randomUUID/);
		expect(src).not.toMatch(/idempotencyKeyRef/);
	});

	it('checkout refuses to buy once the cart is gone', () => {
		const src = readSrc('pages/checkout/index.tsx');
		expect(src).toMatch(/if \(!idempotencyKey\) \{\s*router\.replace\('\/'\);/);
		// bfcache restores the page with no mount, so the guard is re-checked on pageshow.
		expect(src).toMatch(/e\.persisted && !sessionStorage\.getItem\(CHECKOUT_STORAGE_KEY\)/);
	});

	it('the success page ends the cart', () => {
		const src = readSrc('pages/checkout/success.tsx');
		expect(src).toMatch(/useClearBuyFlow\(!!order\);/);
		expect(src).toMatch(/from '@\/hooks\/useClearBuyFlow'/);
	});

	// The pages that WRITE the records still spell the keys inline. Clearing a key that does
	// not match what was written would leave the cart behind and re-open this hole silently,
	// so every spelling in the tree has to be one of the two constants.
	it('every sessionStorage key in the tree is one of the buy-flow constants', () => {
		const files: string[] = [];
		const walk = (dir: string) => {
			for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
				const full = path.join(dir, entry.name);
				if (entry.isDirectory()) walk(full);
				else if (/\.tsx?$/.test(entry.name)) files.push(full);
			}
		};
		walk(SRC_DIR);

		const spellings = new Set<string>();
		for (const file of files) {
			for (const m of fs.readFileSync(file, 'utf8').matchAll(/sessionStorage\.(?:get|set|remove)Item\('([^']+)'/g)) {
				spellings.add(m[1]);
			}
		}
		expect(spellings.size).toBeGreaterThan(0);
		expect([...spellings].sort()).toEqual([CHECKOUT_STORAGE_KEY, SEATS_STORAGE_KEY].sort());
	});
});
