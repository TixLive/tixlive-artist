/**
 * Browser-direct calls to the besttix backend. Used for all public read
 * endpoints — no API key needed, x-org-id header scopes to the organizer.
 *
 * Env vars (set per Vercel deployment):
 *   NEXT_PUBLIC_BESTTIX_API_URL — base URL of the besttix backend
 *   NEXT_PUBLIC_ORG_ID          — organizer ID for this white-label deployment
 */

import type {
	IOrganizer,
	IOrganizerPage,
	IEventListItem,
	IEventDetail,
	IPromoValidateResponse,
	IOrderDetail,
	ISeatingResponse,
	ISeatingSuggestResponse,
} from '@/types';

const BASE = process.env.NEXT_PUBLIC_BESTTIX_API_URL ?? '';
const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? '';

function orgHeaders(): Record<string, string> {
	return { 'Content-Type': 'application/json', 'x-org-id': ORG_ID };
}

async function get<T>(path: string): Promise<T> {
	const res = await fetch(`${BASE}${path}`, { headers: orgHeaders() });
	if (!res.ok) throw new Error(`${res.status} ${path}`);
	return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
	const res = await fetch(`${BASE}${path}`, {
		method: 'POST',
		headers: orgHeaders(),
		body: JSON.stringify(body),
	});
	if (!res.ok) throw new Error(`${res.status} ${path}`);
	return res.json() as Promise<T>;
}

export async function directGetSite(): Promise<IOrganizer> {
	return get<IOrganizer>('/api/public/site');
}

export async function directGetEvents(offset = 0): Promise<{ events: IEventListItem[]; total: number }> {
	return get<{ events: IEventListItem[]; total: number }>(`/api/public/events${offset ? `?offset=${offset}` : ''}`);
}

export async function directGetEvent(slug: string): Promise<IEventDetail | null> {
	try {
		return await get<IEventDetail>(`/api/public/event/${encodeURIComponent(slug)}`);
	} catch {
		return null;
	}
}

export async function directGetPage(pageType: string): Promise<IOrganizerPage | null> {
	try {
		return await get<IOrganizerPage>(`/api/public/pages/${encodeURIComponent(pageType)}`);
	} catch {
		return null;
	}
}

export async function directGetSeating(slug: string, sessionId: number): Promise<ISeatingResponse> {
	return get<ISeatingResponse>(`/api/public/seating/${encodeURIComponent(slug)}?session_id=${sessionId}`);
}

export async function directValidatePromo(
	eventId: number,
	code: string
): Promise<IPromoValidateResponse> {
	try {
		return await post<IPromoValidateResponse>('/api/public/promo/validate', { event_id: eventId, code });
	} catch {
		return { valid: false, error: 'Invalid promo code' };
	}
}

export async function directSuggestSeats(
	slug: string,
	sessionId: number,
	items: Array<{ ticket_package_id: number; quantity: number }>
): Promise<ISeatingSuggestResponse> {
	return post<ISeatingSuggestResponse>(`/api/public/seating/${encodeURIComponent(slug)}/suggest`, {
		session_id: sessionId,
		items,
	});
}

export async function directGetOrder(orderId: string): Promise<IOrderDetail> {
	const body = await get<Record<string, unknown>>(`/api/public/order/${encodeURIComponent(orderId)}`);
	return body as unknown as IOrderDetail;
}
