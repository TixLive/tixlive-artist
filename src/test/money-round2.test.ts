import { describe, it, expect } from 'vitest';

import { round2 } from '@/lib/money';

/**
 * Parity contract with the besttix server (src/utils/money.ts round2, pinned there by
 * src/__tests__/money.round2.test.ts). The cases below are the same cases, deliberately:
 * the server charges the cent this function prints, so the two suites must agree value for
 * value. Keep them identical.
 */
describe('round2 (white-label) — half-cent ties, parity with besttix', () => {
	it('rounds an exact half-cent up, whichever way the float happens to fall', () => {
		// Each of these is stored as a double strictly BELOW the tie, which is why the
		// naive Math.round(n * 100) / 100 used to print the cent in the comment.
		expect(round2(0.145)).toBe(0.15); // was 0.14
		expect(round2(1.005)).toBe(1.01); // was 1.00
		expect(round2(4.515)).toBe(4.52); // was 4.51
		expect(round2(8.165)).toBe(8.17); // was 8.16
		expect(round2(1234567.005)).toBe(1234567.01); // was 1234567.00
		// …and the ones that already fell above it keep their answer.
		expect(round2(6.195)).toBe(6.2);
		expect(round2(2.675)).toBe(2.68);
		expect(round2(10.705)).toBe(10.71);
	});

	it('rounds every half-cent in a sweep up, not just the sampled ones', () => {
		for (let cents = 0; cents < 5000; cents++) {
			expect(round2((cents + 0.5) / 100)).toBe(round2((cents + 1) / 100));
		}
	});

	it('leaves non-ties on the cent they already had', () => {
		expect(round2(0.144999)).toBe(0.14);
		expect(round2(0.1451)).toBe(0.15);
		expect(round2(10.994)).toBe(10.99);
		expect(round2(10.996)).toBe(11);
		expect(round2(0)).toBe(0);
		expect(round2(1e-7)).toBe(0);
		expect(round2(0.1 + 0.2)).toBe(0.3);
		// A percentage discount lands one ULP BELOW the half — genuinely below the
		// boundary, not a misrepresented tie. besttix reproduces this same double and
		// rounds it down too; "fixing" it here would re-open the cent gap.
		expect(round2(15.014999999999999)).toBe(15.01);
		expect(round2(0.10499999999999998)).toBe(0.1);
	});

	it('keeps Math.round direction on negative halves and passes non-finite through', () => {
		expect(round2(-0.145)).toBe(-0.14);
		expect(round2(-0.146)).toBe(-0.15);
		expect(round2(Infinity)).toBe(Infinity);
		expect(round2(NaN)).toBeNaN();
	});

	it('prints the full timbru on the RO half-cent stamps the server charges', () => {
		// Crucea Roșie 1% on 14.50 RON, monument 2% on 7.25, muzical/teatral 5% on 2.90 —
		// all three are 0.145, and the storefront used to show 0.14 of them.
		expect(round2((14.5 * 1) / 100)).toBe(0.15);
		expect(round2((7.25 * 2) / 100)).toBe(0.15);
		expect(round2((2.9 * 5) / 100)).toBe(0.15);
	});
});
