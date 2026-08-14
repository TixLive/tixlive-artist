// ─── Fee-math parity contract (shared fixture) ───────────────────────────────
//
// This file is meant to be duplicated byte-for-byte in BOTH repos:
//   • besttix          src/__tests__/fixtures/fee-parity.fixture.ts
//   • tixlive-artist   src/test/fixtures/fee-parity.fixture.ts
//
// `fees.test.ts` in besttix asserts that the LOCAL `computeOrderFees().buyerFee`
// equals `expectedBuyerFees` (in order) for `cases`. The whitelabel repo's
// PriceBreakdown parity test asserts the same for its LOCAL serviceFee math
// against these same frozen numbers. Neither side re-derives the other's
// formula — both are graded against one shared, versioned contract. If either
// repo's fee math drifts, that repo's parity test goes red instead of both
// silently agreeing with each other while diverging from the real charge.
//
// `cases` deliberately exercises: percent-only, percent+fixed, zero-base,
// payer=organizer (fee recorded but not charged to buyer) for both platform
// and provider fees, and independent per-fee rounding.

// Self-contained shape (not imported from either repo's fee module) so this file can
// be copied byte-for-byte — besttix's FeeInput and tixlive-artist's CheckoutFeeInput
// use different field names (`baseAfterDiscount` vs `afterDiscount`), but both accept
// this shape structurally once each side's test adapts the field name it needs.
export interface FeeParityCase {
	baseAfterDiscount: number;
	platformFeePercent: number;
	platformFeeFixed: number;
	providerFeePercent: number;
	providerFeeFixed: number;
	platformFeePayer: 'buyer' | 'organizer';
	providerFeePayer: 'buyer' | 'organizer';
}

const base = (over: Partial<FeeParityCase> = {}): FeeParityCase => ({
	baseAfterDiscount: 100,
	platformFeePercent: 3.5,
	platformFeeFixed: 0,
	providerFeePercent: 0,
	providerFeeFixed: 0,
	platformFeePayer: 'buyer',
	providerFeePayer: 'buyer',
	...over,
});

export const cases: FeeParityCase[] = [
	base(),
	base({ baseAfterDiscount: 250.75, providerFeePercent: 1.5 }),
	base({ platformFeePayer: 'organizer', providerFeePercent: 2 }),
	base({ providerFeePayer: 'organizer', platformFeeFixed: 3 }),
	base({ baseAfterDiscount: 0 }),
	base({ baseAfterDiscount: 9999.99, platformFeePercent: 4.25, providerFeePercent: 2.75 }),
	base({ baseAfterDiscount: 149, providerFeePercent: 1, providerFeeFixed: 0.3 }),
	base({ baseAfterDiscount: 33.33, providerFeePercent: 2 }),
];

// Frozen contract — regenerated only alongside an intentional, cross-repo-
// coordinated change to the fee formula. Values are `computeOrderFees(cases[i]).buyerFee`.
export const expectedBuyerFees: number[] = [3.5, 12.54, 2, 6.5, 0, 700, 7.01, 1.84];
