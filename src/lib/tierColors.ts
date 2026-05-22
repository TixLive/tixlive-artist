// Tier colour resolution — keeps the canvas, the legend, and the YOUR SEATS list
// using the same swatch per price tier. Organizer-set `tier.color` wins; tiers
// without one get a deterministic fallback from a warm-editorial-friendly palette
// (legible on the warm canvas, distinct from each other).
import type { ISeatingTier } from '@/types';

const FALLBACK_TIER_COLORS = [
	'#8B6914', // aged gold
	'#3F6F52', // forest
	'#9C4A3C', // terracotta
	'#41618C', // dusk blue
	'#7A5C3E', // walnut
	'#6B5B7B', // muted plum
	'#2F6E6A', // teal
	'#A36A1F', // amber
];

export function tierColor(tier: ISeatingTier, index: number): string {
	return tier.color || FALLBACK_TIER_COLORS[index % FALLBACK_TIER_COLORS.length];
}

/**
 * tier id → resolved hex colour, keyed off each tier's index in the FULL tier
 * list so the fallback colour for a given tier is stable everywhere (legend,
 * canvas, selected list) regardless of which subset is in the cart.
 */
export function buildTierColorById(tiers: ISeatingTier[]): Map<number, string> {
	const m = new Map<number, string>();
	tiers.forEach((tier, i) => m.set(tier.ticket_package_id, tierColor(tier, i)));
	return m;
}

/**
 * seat ID → resolved hex colour. Pass `includeTierIds` to colour only the tiers
 * the buyer is actually purchasing (the cart) — seats of other priced tiers are
 * left out of the map so the viewer renders them hollow + non-selectable.
 */
export function buildTierColorBySeatId(
	tiers: ISeatingTier[],
	colorByTierId: Map<number, string>,
	includeTierIds?: Set<number>
): Map<string, string> {
	const m = new Map<string, string>();
	for (const tier of tiers) {
		if (includeTierIds && !includeTierIds.has(tier.ticket_package_id)) continue;
		const color = colorByTierId.get(tier.ticket_package_id);
		if (!color) continue;
		for (const id of tier.seat_ids) m.set(id, color);
	}
	return m;
}
