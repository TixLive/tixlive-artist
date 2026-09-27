import { useEffect } from 'react';
import { clearBuyFlowStorage } from '@/lib/buyFlowStorage';

/**
 * Drops the pending buy-flow cart the first time `when` holds.
 *
 * The payment-return page's side of the double-charge guard: reaching it with a resolved order
 * means this cart has already become one, so leaving it in `sessionStorage` is what let a Back
 * gesture re-enter `/checkout` with the same tickets and buy them a second time. Safe to fire
 * on any resolved order, paid or not — a cart is only ever read to create an order, and this
 * one already has one.
 */
export function useClearBuyFlow(when: boolean): void {
	useEffect(() => {
		if (!when) return;
		clearBuyFlowStorage();
	}, [when]);
}
