import { describe, it, expect, afterEach } from 'vitest';
import { getFbCookies, captureFbclid, track, isPixelReady } from '@/lib/fbpixel';

// node test env: no real DOM. We stub `document` / `window` to exercise the cookie parser and
// the fbclid fallback, which feed fbp/fbc into the besttix CAPI match — a wrong regex or a
// malformed _fbc would silently break attribution.

type WindowStub = { location: { search: string }; localStorage: Storage };

function stubWindow(search = ''): { store: Map<string, string> } {
	const store = new Map<string, string>();
	const localStorage = {
		getItem: (k: string) => store.get(k) ?? null,
		setItem: (k: string, v: string) => void store.set(k, v),
		removeItem: (k: string) => void store.delete(k),
		clear: () => store.clear(),
		key: () => null,
		length: 0,
	} as unknown as Storage;
	(globalThis as { window?: WindowStub }).window = { location: { search }, localStorage };
	return { store };
}

afterEach(() => {
	delete (globalThis as { document?: unknown }).document;
	delete (globalThis as { window?: unknown }).window;
});

describe('getFbCookies', () => {
	it('extracts _fbp and _fbc from the cookie string', () => {
		(globalThis as { document?: { cookie: string } }).document = {
			cookie: 'NEXT_LOCALE=ro; _fbp=fb.1.1700000000.123; _fbc=fb.1.1700000000.abc123; other=x',
		};
		expect(getFbCookies()).toEqual({ fbp: 'fb.1.1700000000.123', fbc: 'fb.1.1700000000.abc123' });
	});

	it('returns undefined for a missing cookie (not the next cookie value)', () => {
		(globalThis as { document?: { cookie: string } }).document = { cookie: '_fbp=onlyfbp.1.2.3' };
		expect(getFbCookies()).toEqual({ fbp: 'onlyfbp.1.2.3', fbc: undefined });
	});

	it('returns {} when there is no document (SSR / node)', () => {
		expect(getFbCookies()).toEqual({});
	});

	it('falls back to a stored fbclid for _fbc when the cookie is absent', () => {
		const { store } = stubWindow();
		store.set('tixlive_fbclid', JSON.stringify({ value: 'CLICKID', ts: 1700000000000 }));
		(globalThis as { document?: { cookie: string } }).document = { cookie: '_fbp=fb.1.2.3' };
		expect(getFbCookies()).toEqual({ fbp: 'fb.1.2.3', fbc: 'fb.1.1700000000000.CLICKID' });
	});

	it('prefers the real _fbc cookie over the stored fbclid', () => {
		const { store } = stubWindow();
		store.set('tixlive_fbclid', JSON.stringify({ value: 'CLICKID', ts: 1700000000000 }));
		(globalThis as { document?: { cookie: string } }).document = { cookie: '_fbc=fb.1.9.real' };
		expect(getFbCookies().fbc).toBe('fb.1.9.real');
	});
});

describe('captureFbclid', () => {
	it('persists fbclid from the URL with a click timestamp', () => {
		const { store } = stubWindow('?utm=x&fbclid=ABC123');
		captureFbclid();
		const raw = store.get('tixlive_fbclid');
		expect(raw).toBeTruthy();
		const parsed = JSON.parse(raw as string) as { value: string; ts: number };
		expect(parsed.value).toBe('ABC123');
		expect(typeof parsed.ts).toBe('number');
	});

	it('does nothing when the URL has no fbclid', () => {
		const { store } = stubWindow('?utm=x');
		captureFbclid();
		expect(store.has('tixlive_fbclid')).toBe(false);
	});
});

describe('track guard', () => {
	it('no-ops (no throw) before any pixel is initialized', () => {
		expect(isPixelReady()).toBe(false);
		expect(() => track('Purchase', { value: 10, currency: 'RON' }, 'order-1')).not.toThrow();
	});
});
