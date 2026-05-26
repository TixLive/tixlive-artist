/**
 * Browser-direct calls to the besttix backend. Used for read-only public
 * endpoints that don't need an API key — the x-org-id header scopes requests
 * to the correct organizer without revealing the server-side API key.
 *
 * Requires env vars:
 *   NEXT_PUBLIC_BESTTIX_API_URL — base URL of the besttix backend
 *   NEXT_PUBLIC_ORG_ID          — organizer ID for this white-label deployment
 */

import type { IPromoValidateResponse, ISeatingSuggestResponse, IOrderDetail } from '@/types';

const BASE = process.env.NEXT_PUBLIC_BESTTIX_API_URL ?? '';
const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? '';

function orgHeaders(): Record<string, string> {
	return { 'Content-Type': 'application/json', 'x-org-id': ORG_ID };
}

export async function directValidatePromo(
	eventId: number,
	code: string
): Promise<IPromoValidateResponse> {
	const res = await fetch(`${BASE}/api/public/promo/validate`, {
		method: 'POST',
		headers: orgHeaders(),
		body: JSON.stringify({ event_id: eventId, code }),
	});
	if (!res.ok) {
		const body = await res.json().catch(() => ({})) as Record<string, unknown>;
		return { valid: false, error: (body.message as string) ?? 'Invalid promo code' };
	}
	return res.json() as Promise<IPromoValidateResponse>;
}

export async function directSuggestSeats(
	slug: string,
	sessionId: number,
	items: Array<{ ticket_package_id: number; quantity: number }>
): Promise<ISeatingSuggestResponse> {
	const res = await fetch(`${BASE}/api/public/seating/${encodeURIComponent(slug)}/suggest`, {
		method: 'POST',
		headers: orgHeaders(),
		body: JSON.stringify({ session_id: sessionId, items }),
	});
	if (!res.ok) throw new Error(`suggest failed: ${res.status}`);
	return res.json() as Promise<ISeatingSuggestResponse>;
}

export async function directGetOrder(orderId: string): Promise<IOrderDetail> {
	const res = await fetch(`${BASE}/api/public/order/${encodeURIComponent(orderId)}`, {
		headers: orgHeaders(),
	});
	if (!res.ok) throw new Error(`order fetch failed: ${res.status}`);
	const body = await res.json() as Record<string, unknown>;
	return body as unknown as IOrderDetail;
}
