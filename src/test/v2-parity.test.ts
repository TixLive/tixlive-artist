import { describe, expect, it } from 'vitest';
import { computeAllSeats } from '@/lib/seatingGeometry';
import { isSmState, lowerSmStateToLegacy, SmState } from '@/lib/smLower';
import { v2ParityDoc, v2ParityExpected } from './fixtures/v2-parity.fixture';

// Cross-repo seat parity: the lowered v2 chart must reproduce the admin
// editor's seat ids and coordinates exactly (fixture generated there).
describe('v2 chart parity', () => {
	it('recognises the SmState document', () => {
		expect(isSmState(v2ParityDoc)).toBe(true);
	});

	it('lowers to the exact ids and coordinates of the admin geometry', () => {
		const lowered = lowerSmStateToLegacy(v2ParityDoc as unknown as SmState);
		const seats = computeAllSeats(lowered);
		expect(seats.length).toBe(v2ParityExpected.length);
		const byId = new Map(seats.map((s) => [s.id, s]));
		for (const exp of v2ParityExpected) {
			const got = byId.get(exp.id);
			expect(got, `seat ${exp.id} missing`).toBeTruthy();
			expect(Math.abs(got!.x - exp.x)).toBeLessThan(0.01);
			expect(Math.abs(got!.y - exp.y)).toBeLessThan(0.01);
		}
	});

	it('keeps GA zones as ga sections', () => {
		const lowered = lowerSmStateToLegacy(v2ParityDoc as unknown as SmState);
		const ga = lowered.filter((s) => s.type === 'ga');
		expect(ga.length).toBe(1);
	});
});
