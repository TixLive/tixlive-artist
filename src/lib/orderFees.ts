// Buyer-facing fee math for checkout. This MUST stay in lockstep with the besttix
// server util src/utils/fees.ts (computeOrderFees): the server charges amount_paid =
// afterDiscount + serviceFee, so the total shown here must equal what is charged.
// Cross-repo parity contract — change both sides together and keep the parity tests green.

export type FeePayer = 'buyer' | 'organizer';

export interface CheckoutFeeInput {
	afterDiscount: number;
	platformFeePayer?: FeePayer;
	providerFeePayer?: FeePayer;
	platformFeePercent?: number;
	platformFeeFixed?: number;
	providerFeePercent?: number;
}

export interface CheckoutFees {
	/** Buyer-paid platform portion (0 when the organizer absorbs it). */
	platformFee: number;
	/** Buyer-paid provider portion (0 when the organizer absorbs it). */
	providerFee: number;
	/** platformFee + providerFee — added to the order total. */
	serviceFee: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeCheckoutFees(i: CheckoutFeeInput): CheckoutFees {
	const base = i.afterDiscount;
	const platformFee =
		i.platformFeePayer === 'buyer' && base > 0
			? round2((base * (i.platformFeePercent ?? 0)) / 100 + (i.platformFeeFixed ?? 0))
			: 0;
	const providerFee =
		i.providerFeePayer === 'buyer' ? round2((base * (i.providerFeePercent ?? 0)) / 100) : 0;
	return { platformFee, providerFee, serviceFee: round2(platformFee + providerFee) };
}
