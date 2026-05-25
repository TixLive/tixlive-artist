/**
 * Parse a raw seat id like "parter-A-1" → { row: "A", seat: "1" }.
 *
 * Takes the last two hyphen segments so a sector key that itself contains
 * hyphens (e.g. "ring-a-A-1") still resolves row/seat correctly. Returns null
 * for GA-style ids (fewer than two segments) or empty/missing input — callers
 * treat null as "no seat" and render nothing.
 *
 * Mirrors the seat-id layout produced by seatingGeometry.ts (`${sector}-${row}-${num}`)
 * and the parseSeatId in besttix's Ticket.Adapter, so the QR/PDF, ticket views,
 * and order views all read seats the same way.
 */
export function parseSeatId(seatId?: string | null): { row: string; seat: string } | null {
	if (!seatId) return null;
	const parts = seatId.split('-');
	if (parts.length < 2) return null;
	const seat = parts[parts.length - 1];
	const row = parts[parts.length - 2];
	return row && seat ? { row, seat } : null;
}
