import { describe, expect, it } from 'vitest';
import {
	eventShareImage,
	eventStructuredImages,
	phoneHeroShape,
	resolveEventArt,
} from '@/lib/eventArt';
import { eventLd } from '@/lib/seo';
import type { IEventDetail } from '@/types';

const WIDE = 'https://cdn.example/wide.jpg';
const SQUARE = 'https://cdn.example/square.jpg';
const PORTRAIT = 'https://cdn.example/portrait.jpg';

describe('resolveEventArt — the three shapes and their ladders', () => {
	it('returns each upload for its own shape when all three exist', () => {
		const art = resolveEventArt({ poster_url: WIDE, poster_variants: { '1:1': SQUARE, '9:16': PORTRAIT } });
		expect(art).toEqual({
			wide: WIDE,
			square: SQUARE,
			portrait: PORTRAIT,
			uploaded: { wide: WIDE, square: SQUARE, portrait: PORTRAIT },
		});
	});

	it('wide only: every shape borrows the 16:9, and uploaded says which are missing', () => {
		const art = resolveEventArt({ poster_url: WIDE });
		expect([art.wide, art.square, art.portrait]).toEqual([WIDE, WIDE, WIDE]);
		expect(art.uploaded).toEqual({ wide: WIDE, square: null, portrait: null });
	});

	it('portrait only: wide and square fall to the 9:16', () => {
		const art = resolveEventArt({ poster_url: null, poster_variants: { '9:16': PORTRAIT } });
		expect([art.wide, art.square, art.portrait]).toEqual([PORTRAIT, PORTRAIT, PORTRAIT]);
		expect(art.uploaded).toEqual({ wide: null, square: null, portrait: PORTRAIT });
	});

	it('prefers the nearest shape: wide borrows the square before the portrait, portrait borrows the square before the wide', () => {
		expect(resolveEventArt({ poster_variants: { '1:1': SQUARE, '9:16': PORTRAIT } }).wide).toBe(SQUARE);
		expect(resolveEventArt({ poster_url: WIDE, poster_variants: { '1:1': SQUARE } }).portrait).toBe(SQUARE);
		expect(resolveEventArt({ poster_url: WIDE, poster_variants: { '9:16': PORTRAIT } }).square).toBe(WIDE);
	});

	it('treats empty / whitespace URLs and a missing event as no upload', () => {
		expect(resolveEventArt({ poster_url: '  ', poster_variants: { '1:1': '' } }).wide).toBeNull();
		expect(resolveEventArt(null).uploaded).toEqual({ wide: null, square: null, portrait: null });
		expect(resolveEventArt(undefined).square).toBeNull();
	});
});

describe('phoneHeroShape', () => {
	it('is the 9:16 frame only when a 9:16 was actually uploaded', () => {
		expect(phoneHeroShape(resolveEventArt({ poster_url: WIDE, poster_variants: { '9:16': PORTRAIT } }))).toBe('portrait');
		expect(phoneHeroShape(resolveEventArt({ poster_url: WIDE, poster_variants: { '1:1': SQUARE } }))).toBe('square');
		// A portrait borrowed from the wide ladder must not open a 9:16 frame.
		expect(phoneHeroShape(resolveEventArt({ poster_url: WIDE }))).toBe('square');
	});
});

describe('share + structured-data images', () => {
	it('eventShareImage is the wide ladder', () => {
		expect(eventShareImage({ poster_url: WIDE, poster_variants: { '1:1': SQUARE } })).toBe(WIDE);
		expect(eventShareImage({ poster_variants: { '1:1': SQUARE } })).toBe(SQUARE);
		expect(eventShareImage({})).toBeNull();
	});

	it('eventStructuredImages lists every upload once, wide first', () => {
		expect(eventStructuredImages({ poster_url: WIDE, poster_variants: { '1:1': SQUARE, '9:16': PORTRAIT } })).toEqual([
			WIDE,
			SQUARE,
			PORTRAIT,
		]);
		expect(eventStructuredImages({ poster_url: WIDE, poster_variants: { '1:1': WIDE } })).toEqual([WIDE]);
		expect(eventStructuredImages({ poster_variants: { '9:16': PORTRAIT } })).toEqual([PORTRAIT]);
		expect(eventStructuredImages({})).toEqual([]);
	});

	it('eventLd carries the image array, or no image key at all', () => {
		const base = {
			id: 1,
			slug: 'gala',
			title: 'Gala',
			event_type: 'concert',
			status: 'open',
			venue_name: 'Arena',
			venue_address: 'Str. 1',
			date_start: '2026-10-01T18:00:00Z',
			price_from: 10,
			currency: 'RON',
			remaining_capacity: 5,
			description: '',
			google_place_id: null,
			sessions: [],
			ticket_types: [],
			available_payment_methods: [],
		} as unknown as IEventDetail;
		const withArt = eventLd({ ...base, poster_url: WIDE, poster_variants: { '1:1': SQUARE } }, 'https://x/events/gala');
		expect(withArt.image).toEqual([WIDE, SQUARE]);
		const bare = eventLd({ ...base, poster_url: null }, 'https://x/events/gala');
		expect('image' in bare).toBe(false);
	});
});
