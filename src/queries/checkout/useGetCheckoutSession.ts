import { useQuery } from '@tanstack/react-query';
import ApiService from '@/services/Api.Service';
import type { ICheckoutSessionPublic } from '@/types';

export const GetCheckoutSessionKey = 'checkout-session';

/**
 * Reads a parked cart selection back.
 *
 * Throws `ApiError` — 410 when the cart expired (offer to build it again), 404 when the link
 * never existed for this site.
 */
async function fetchCheckoutSession(id: string): Promise<ICheckoutSessionPublic> {
	const res = await ApiService.get<{ checkout_session: ICheckoutSessionPublic }>(
		`/api/public/checkout/session/${encodeURIComponent(id)}`,
	);
	return res.checkout_session;
}

export const useGetCheckoutSession = ({ id, enabled = true }: { id: string | null | undefined; enabled?: boolean }) =>
	useQuery({
		queryKey: [GetCheckoutSessionKey, id],
		queryFn: async () => fetchCheckoutSession(id!),
		enabled: !!id && enabled,
		retry: 0,
	});

// Used by the checkout page, which orchestrates this call with fetchEvent in one useEffect.
export { fetchCheckoutSession };
