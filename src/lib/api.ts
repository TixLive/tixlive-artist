import type {
	IOrganizer,
	IOrganizerPage,
	IEventListItem,
	IEventDetail,
	IPromoValidateResponse,
	IOrderBuyBody,
	IOrderBuyResponse,
	IOrderDetail,
	ITicket,
	IMe,
	IMeUpdate,
	ISeatingResponse,
	ISeatingSuggestResponse,
} from '@/types';

const BASE_URL = process.env.BESTTIX_API_URL || 'http://localhost:3001';
const API_KEY = process.env.BESTTIX_API_KEY || '';

interface ApiFetchOptions extends RequestInit {
	bearerToken?: string;
}

async function apiFetch<T>(path: string, options?: ApiFetchOptions): Promise<T> {
	const { bearerToken, headers: extraHeaders, ...rest } = options ?? {};
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		'x-api-key': API_KEY,
		...(extraHeaders as Record<string, string> | undefined),
	};
	if (bearerToken) {
		headers['Authorization'] = `Bearer ${bearerToken}`;
	}

	const res = await fetch(`${BASE_URL}${path}`, { ...rest, headers });

	if (!res.ok) {
		const body = await res.text();
		throw new Error(`API error ${res.status}: ${body}`);
	}

	return res.json() as Promise<T>;
}

export async function getSite(): Promise<IOrganizer> {
	return apiFetch<IOrganizer>('/api/public/site');
}

export async function getPage(pageType: string): Promise<IOrganizerPage> {
	return apiFetch<IOrganizerPage>(`/api/public/pages/${encodeURIComponent(pageType)}`);
}

export async function getEvents(offset?: number): Promise<{ events: IEventListItem[]; total: number }> {
	const query = offset ? `?offset=${offset}` : '';
	return apiFetch<{ events: IEventListItem[]; total: number }>(`/api/public/events${query}`);
}

export async function getEvent(slug: string): Promise<IEventDetail> {
	return apiFetch<IEventDetail>(`/api/public/event/${slug}`);
}

/**
 * Full hall payload for a seated event's seat-selection page. Server-side only
 * (uses the secret x-api-key). The browser reaches this through the
 * /api/seating/* proxy routes, never directly.
 */
export async function getSeating(slug: string, sessionId: number): Promise<ISeatingResponse> {
	return apiFetch<ISeatingResponse>(`/api/public/seating/${slug}?session_id=${sessionId}`);
}

/** Auto-pick nearby seats for the requested per-tier quantities. Server-side only. */
export async function suggestSeats(
	slug: string,
	sessionId: number,
	items: Array<{ ticket_package_id: number; quantity: number }>
): Promise<ISeatingSuggestResponse> {
	return apiFetch<ISeatingSuggestResponse>(`/api/public/seating/${slug}/suggest`, {
		method: 'POST',
		body: JSON.stringify({ session_id: sessionId, items }),
	});
}

export async function validatePromo(eventId: number, code: string): Promise<IPromoValidateResponse> {
	return apiFetch<IPromoValidateResponse>('/api/public/promo/validate', {
		method: 'POST',
		body: JSON.stringify({ event_id: eventId, code }),
	});
}

export async function createOrder(body: IOrderBuyBody): Promise<IOrderBuyResponse> {
	return apiFetch<IOrderBuyResponse>('/api/public/order/buy', {
		method: 'POST',
		body: JSON.stringify(body),
	});
}

export async function getOrder(orderId: string): Promise<IOrderDetail> {
	return apiFetch<IOrderDetail>(`/api/public/order/${orderId}`);
}

export async function getMyTickets(bearerToken: string): Promise<ITicket[]> {
	return apiFetch<ITicket[]>('/api/public/tickets', { bearerToken });
}

export async function getTicket(bearerToken: string, ticketId: string): Promise<ITicket> {
	return apiFetch<ITicket>(`/api/public/tickets/${ticketId}`, { bearerToken });
}

export async function getMyOrders(bearerToken: string): Promise<IOrderDetail[]> {
	return apiFetch<IOrderDetail[]>('/api/public/orders', { bearerToken });
}

export async function getMe(bearerToken: string): Promise<IMe> {
	return apiFetch<IMe>('/api/public/me', { bearerToken });
}

export async function updateMe(bearerToken: string, body: IMeUpdate): Promise<IMe> {
	return apiFetch<IMe>('/api/public/me', {
		bearerToken,
		method: 'PATCH',
		body: JSON.stringify(body),
	});
}
