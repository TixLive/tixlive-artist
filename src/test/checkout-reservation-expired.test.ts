import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * besttix T3525 answers POST /api/public/order/buy with 400 CHECKOUT_NO_LONGER_PAYABLE when the
 * cart's idempotency key resolves to an order that can no longer be paid — CANCELED (hold sweep)
 * or REFUNDED. checkout/index.tsx must map that code to its own message + a "start again" button
 * BEFORE the generic `status === 400` branch swallows it (the refusal is itself a 400), and must
 * mint a fresh idempotency key for the retry rather than resubmitting the same terminal order.
 */
const pageSource = readFileSync(join(__dirname, '../pages/checkout/index.tsx'), 'utf8');

describe('checkout CHECKOUT_NO_LONGER_PAYABLE handling', () => {
	it('maps the code before the generic 400 catch-all', () => {
		const codeBranch = pageSource.indexOf("code.includes('CHECKOUT_NO_LONGER_PAYABLE')");
		const genericBranch = pageSource.indexOf('status === 400');
		expect(codeBranch).toBeGreaterThan(-1);
		expect(genericBranch).toBeGreaterThan(-1);
		expect(codeBranch).toBeLessThan(genericBranch);
	});

	it('mints a fresh idempotency key instead of resubmitting the terminal order', () => {
		const codeBranch = pageSource.indexOf("code.includes('CHECKOUT_NO_LONGER_PAYABLE')");
		const nextBranch = pageSource.indexOf("} else if (status === 400)");
		const branchBody = pageSource.slice(codeBranch, nextBranch);
		expect(branchBody).toContain('idempotencyKeyRef.current = generateIdempotencyKey()');
		expect(branchBody).toContain("t('checkout.error_reservation_expired')");
		expect(branchBody).toContain('setReservationExpired(true)');
	});

	it('renders a retry button that starts a brand-new order', () => {
		expect(pageSource).toContain('{reservationExpired &&');
		expect(pageSource).toContain('onClick={retryPurchase}');
		expect(pageSource).toContain("t('checkout.retry_purchase')");
	});

	it('carries both strings in every locale', () => {
		for (const locale of ['en', 'ro', 'ru']) {
			const common = JSON.parse(
				readFileSync(join(__dirname, `../../public/locales/${locale}/common.json`), 'utf8'),
			);
			expect(common.checkout.error_reservation_expired, `checkout.error_reservation_expired (${locale})`).toBeTruthy();
			expect(common.checkout.retry_purchase, `checkout.retry_purchase (${locale})`).toBeTruthy();
		}
	});
});
