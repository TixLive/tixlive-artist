import { useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

import { createCheckoutSession } from '@/queries/checkout/useCreateCheckoutSession';
import { buildCheckoutSelection, checkoutSessionUrl } from '@/lib/checkoutSession';
import { normalizeLocale } from '@/lib/staticI18n';
import type { IAddonCartItem, ICartItem } from '@/types';

interface ICheckoutHandoff {
	eventSlug: string;
	sessionId: number;
	cart: ICartItem[];
	addons?: IAddonCartItem[];
	bundles?: Array<{ bundle_id: number; quantity: number }>;
	selectedSeats?: string[];
	/**
	 * The pre-session `tixlive:checkout` payload. Still written on every handoff so a buyer
	 * whose park call didn't land (offline, besttix 5xx) reaches checkout anyway — the page
	 * falls back to it when the url carries no `?session=`.
	 */
	legacyPayload: Record<string, string>;
}

/**
 * Hands the buyer over to `/checkout`.
 *
 * The selection is parked on besttix and the page is addressed by its uuid
 * (`/checkout?session=<uuid>&event=<slug>`), so checkout survives a reload, a magic-link
 * round trip, or the link being reopened later — the one-shot sessionStorage handoff did not.
 * Ids and quantities only: besttix re-prices the order at buy time.
 *
 * `goToCheckout` must keep a stable identity: the event page feeds it into the memoized
 * header-cart object, which drives a context effect. That's why this calls the plain
 * `createCheckoutSession` helper rather than a `useMutation` object (new on every render).
 */
export function useCheckoutHandoff() {
	const router = useRouter();
	const { i18n } = useTranslation('common');
	// A second tap must not park a second cart while the first request is in flight.
	const inFlightRef = useRef(false);

	const goToCheckout = useCallback(
		async (input: ICheckoutHandoff) => {
			if (inFlightRef.current) return;
			inFlightRef.current = true;

			try {
				sessionStorage.setItem('tixlive:checkout', JSON.stringify(input.legacyPayload));
			} catch {
				/* private mode / quota — the parked session is the real transport anyway */
			}

			let target = '/checkout';
			try {
				const parked = await createCheckoutSession(
					buildCheckoutSelection({
						sessionId: input.sessionId,
						cart: input.cart,
						addons: input.addons,
						bundles: input.bundles,
						selectedSeats: input.selectedSeats,
						locale: normalizeLocale(i18n.language),
					}),
				);
				target = checkoutSessionUrl(parked.checkout_session_id, input.eventSlug);
			} catch {
				// Parking is an upgrade, never a gate: fall back to the one-shot handoff so a
				// backend hiccup can't block a purchase.
			}

			inFlightRef.current = false;
			router.push(target);
		},
		[i18n.language, router],
	);

	return { goToCheckout };
}
