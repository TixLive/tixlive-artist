import { describe, it, expect } from 'vitest';

import { computeCheckoutFees, CheckoutFeeInput } from '@/lib/orderFees';
import { cases, expectedBuyerFees } from './fixtures/fee-parity.fixture';

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

	it('applies the provider percent + fixed fee (Netopia 1% + 0.30)', () => {
		// base 100: platform 3.5 + provider (1% = 1.00 + 0.30 fixed = 1.30) = 4.80
		expect(computeCheckoutFees(base({ providerFeePercent: 1, providerFeeFixed: 0.3 })).serviceFee).toBe(4.8);
		// organizer-absorbed provider fee → buyer only sees the platform fee
		expect(
			computeCheckoutFees(base({ providerFeePercent: 1, providerFeeFixed: 0.3, providerFeePayer: 'organizer' })).serviceFee
		).toBe(3.5);
	});

	it('is zero for a zero base', () => {
		expect(computeCheckoutFees(base({ afterDiscount: 0 })).serviceFee).toBe(0);
	});

	it('rounds each fee independently to 2 decimals', () => {
		// matches besttix: 33.33 @3.5% -> 1.17 ; @2% -> 0.67 ; total 1.84
		expect(computeCheckoutFees(base({ afterDiscount: 33.33, providerFeePercent: 2 })).serviceFee).toBe(1.84);
	});

	// Parity contract (white-label half) — the identical shared fixture backs a matching
	// assertion in besttix's fees.test.ts. If this repo's fee math drifts from the frozen
	// expectedBuyerFees this goes red here; if besttix's copy drifts it goes red there.
	// Both must stay green for the two repos to charge and display the same buyer fee.
	it('matches the besttix computeOrderFees buyerFee (parity contract)', () => {
		const buyerFees = cases.map(
			(c) =>
				computeCheckoutFees({
					afterDiscount: c.baseAfterDiscount,
					platformFeePercent: c.platformFeePercent,
					platformFeeFixed: c.platformFeeFixed,
					providerFeePercent: c.providerFeePercent,
					providerFeeFixed: c.providerFeeFixed,
					platformFeePayer: c.platformFeePayer,
					providerFeePayer: c.providerFeePayer,
				}).serviceFee
		);
		expect(buyerFees).toEqual(expectedBuyerFees);
	});
});
