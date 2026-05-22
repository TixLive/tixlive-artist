import { describe, it, expect } from 'vitest';
import { computeAllSeats, GEOMETRY_VERSION } from '@/lib/seatingGeometry';
import { sections, expectedSeatIds, geometryVersion } from './fixtures/seating-parity.fixture';

// Seat-ID parity contract (tixlive-artist half). The identical test + fixture
// lives in besttix. If the white-label geometry copy drifts from the frozen
// contract this goes red here; if besttix geometry drifts it goes red there. Both
// must stay green for the two repos to compute the same seat IDs — which is what
// lets the storefront render a seat map that the backend can reserve against.
describe('seating geometry parity contract', () => {
	it('GEOMETRY_VERSION matches the fixture version', () => {
		expect(GEOMETRY_VERSION).toBe(geometryVersion);
	});

	it('computeAllSeats produces the frozen seat IDs in order', () => {
		const ids = computeAllSeats(sections).map((s) => s.id);
		expect(ids).toEqual(expectedSeatIds);
	});

	it('every seat ID is unique', () => {
		const ids = computeAllSeats(sections).map((s) => s.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});
