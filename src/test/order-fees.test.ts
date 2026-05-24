import { describe, it, expect } from 'vitest';

import { computeCheckoutFees, CheckoutFeeInput } from '@/lib/orderFees';

/**
 * Parity contract with the besttix server (src/utils/fees.ts computeOrderFees).
 * The expected numbers here MUST equal the besttix fees.test.ts expectations — the
 * server charges amount_paid = afterDiscount + serviceFee, so if these two suites ever
 * disagree, the buyer would be charged a different number than shown. Keep them identical.
 */
const base = (over: Partial<CheckoutFeeInput> = {}): CheckoutFeeInput => ({
	afterDiscount: 100,
	platformFeePercent: 3.5,
	platformFeeFixed: 0,
	providerFeePercent: 0,
	platformFeePayer: 'buyer',
	providerFeePayer: 'buyer',
	...over,
});

describe('computeCheckoutFees (white-label) — parity with besttix', () => {
	it('charges the platform fee only when the buyer pays it', () => {
		expect(computeCheckoutFees(base()).serviceFee).toBe(3.5);
		expect(computeCheckoutFees(base({ platformFeePayer: 'organizer' })).serviceFee).toBe(0);
	});

	it('adds provider fee when buyer pays it', () => {
		expect(computeCheckoutFees(base({ providerFeePercent: 2 })).serviceFee).toBe(5.5);
		expect(computeCheckoutFees(base({ providerFeePercent: 2, providerFeePayer: 'organizer' })).serviceFee).toBe(3.5);
	});

	it('applies the platform fixed fee', () => {
		expect(computeCheckoutFees(base({ platformFeePercent: 0, platformFeeFixed: 5 })).serviceFee).toBe(5);
	});

	it('is zero for a zero base', () => {
		expect(computeCheckoutFees(base({ afterDiscount: 0 })).serviceFee).toBe(0);
	});

	it('rounds each fee independently to 2 decimals', () => {
		// matches besttix: 33.33 @3.5% -> 1.17 ; @2% -> 0.67 ; total 1.84
		expect(computeCheckoutFees(base({ afterDiscount: 33.33, providerFeePercent: 2 })).serviceFee).toBe(1.84);
	});
});
