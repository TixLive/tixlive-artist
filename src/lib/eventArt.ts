import type { PosterVariantRatio } from '@/types';

/**
 * Event artwork — the three shapes besttix publishes and the rules every surface picks by.
 *
 * | shape    | ratio | wire field               | shown in                                          |
 * |----------|-------|--------------------------|---------------------------------------------------|
 * | wide     | 16:9  | `poster_url`             | landscape frames: the event hero from tablet up,  |
 * |          |       |                          | event cards, past-event and archive thumbs, the   |
 * |          |       |                          | order summary, `og:image` / `twitter:image`       |
 * | square   | 1:1   | `poster_variants['1:1']` | the phone hero frame when no 9:16 was uploaded    |
 * | portrait | 9:16  | `poster_variants['9:16']`| the landing split hero's poster column and the    |
 * |          |       |                          | phone hero                                        |
 *
 * Nothing else is published: the 2:3 `poster_portrait_url` and the 32:9 / 3:2 variants are
 * retired, and besttix no longer sends them. Never read the poster fields by hand — go
 * through `resolveEventArt()` so a partial upload degrades the same way everywhere.
 *
 * Fallback ladders, nearest shape first (frames use `object-fit: cover`, so a borrowed
 * shape is centre-cropped, never letterboxed):
 *
 *   wide      16:9 → 1:1 → 9:16
 *   square    1:1 → 16:9 → 9:16
 *   portrait  9:16 → 1:1 → 16:9
 *
 * A frame that changes its own shape to match the upload (the split hero, the phone hero)
 * reads `uploaded.*`, which is null when that exact shape is missing.
 *
 * This is a cross-repo contract: it is a verbatim port of tixlive-whitelabel's
 * `packages/core/src/lib/eventArt.ts`, and the edge OG injection
 * (`functions/events/[slug].ts`) mirrors `eventShareImage()` / `eventStructuredImages()` by
 * hand because a Pages Function cannot import from src. Change all three together.
 */

export type EventArtShape = 'wide' | 'square' | 'portrait';

/** The poster fields, as they appear on both the list item and the full detail. */
export interface EventArtSource {
	poster_url?: string | null;
	poster_variants?: Partial<Record<PosterVariantRatio, string>> | null;
}

export interface EventArt {
	/** 16:9, falling back to 1:1 then 9:16. */
	wide: string | null;
	/** 1:1, falling back to 16:9 then 9:16. */
	square: string | null;
	/** 9:16, falling back to 1:1 then 16:9. */
	portrait: string | null;
	/** The exact uploads, no fallback — null when that shape is missing. */
	uploaded: Record<EventArtShape, string | null>;
}

const clean = (url: string | null | undefined): string | null => (url && url.trim() ? url : null);

export function resolveEventArt(event: EventArtSource | null | undefined): EventArt {
	const wide = clean(event?.poster_url);
	const square = clean(event?.poster_variants?.['1:1']);
	const portrait = clean(event?.poster_variants?.['9:16']);
	return {
		wide: wide ?? square ?? portrait,
		square: square ?? wide ?? portrait,
		portrait: portrait ?? square ?? wide,
		uploaded: { wide, square, portrait },
	};
}

/**
 * Shape of a phone hero frame: the 9:16 when it was uploaded, otherwise a 1:1 frame fed the
 * square ladder. Never 16:9 — a phone-width 16:9 is too short to carry the hero's text and
 * CTA, and it is exactly the shape the 9:16 upload exists to replace.
 */
export function phoneHeroShape(art: EventArt): 'portrait' | 'square' {
	return art.uploaded.portrait ? 'portrait' : 'square';
}

/** Social share image (`og:image`, `twitter:image`): link cards are landscape, so the wide ladder. */
export function eventShareImage(event: EventArtSource | null | undefined): string | null {
	return resolveEventArt(event).wide;
}

/**
 * schema.org `Event.image`: every uploaded shape, wide first, no duplicates. Google asks for
 * the same picture in several aspect ratios and picks the one that fits the surface.
 */
export function eventStructuredImages(event: EventArtSource | null | undefined): string[] {
	const { uploaded } = resolveEventArt(event);
	const out: string[] = [];
	for (const url of [uploaded.wide, uploaded.square, uploaded.portrait]) {
		if (url && !out.includes(url)) out.push(url);
	}
	return out;
}
