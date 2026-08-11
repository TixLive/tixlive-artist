import { useMutation } from '@tanstack/react-query';
import ApiService from '@/services/Api.Service';
import type { ICheckoutSelection, ICheckoutSessionCreated } from '@/types';

export const useCreateCheckoutSession = () =>
	useMutation({
		mutationFn: async (body: ICheckoutSelection) =>
			ApiService.post<ICheckoutSessionCreated>('/api/public/checkout/session', body),
	});

/**
 * Parks the cart selection on besttix and returns the uuid `/checkout` is addressed by.
 *
 * `ApiService` already attaches the attendee Bearer when the visitor is logged in, so the
 * server records who the cart belongs to (abandoned-cart mail) without us passing any PII.
 * The body carries ids + quantities only — no price.
 *
 * A plain helper rather than a `useMutation` hook on purpose: it is called from
 * `useCheckoutHandoff`, whose callback must keep a stable identity across renders.
 */
export async function createCheckoutSession(body: ICheckoutSelection): Promise<ICheckoutSessionCreated> {
	return ApiService.post<ICheckoutSessionCreated>('/api/public/checkout/session', body);
}
