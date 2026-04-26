import type {
	IOrganizer,
	IEventListItem,
	IEventDetail,
	IPromoValidateResponse,
	IOrderBuyBody,
	IOrderBuyResponse,
	IOrderDetail,
	ITicket,
	IMe,
	IMeUpdate,
} from '@/types';

const USE_MOCKS = process.env.USE_MOCKS === 'true';
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
	if (USE_MOCKS) {
		const { mockOrganizer } = await import('@/mocks/data');
		return mockOrganizer;
	}
	return apiFetch<IOrganizer>('/api/public/site');
}

export async function getEvents(offset?: number): Promise<{ events: IEventListItem[]; total: number }> {
	if (USE_MOCKS) {
		const { mockEvents } = await import('@/mocks/data');
		return { events: mockEvents, total: mockEvents.length };
	}
	const query = offset ? `?offset=${offset}` : '';
	return apiFetch<{ events: IEventListItem[]; total: number }>(`/api/public/events${query}`);
}

export async function getEvent(slug: string): Promise<IEventDetail> {
	if (USE_MOCKS) {
		const { mockEventDetail } = await import('@/mocks/data');
		return mockEventDetail;
	}
	return apiFetch<IEventDetail>(`/api/public/event/${slug}`);
}

export async function validatePromo(eventId: number, code: string): Promise<IPromoValidateResponse> {
	if (USE_MOCKS) {
		const { mockPromoValid, mockPromoInvalid } = await import('@/mocks/data');
		return code === 'SUMMER10' ? mockPromoValid : mockPromoInvalid;
	}
	return apiFetch<IPromoValidateResponse>('/api/public/promo/validate', {
		method: 'POST',
		body: JSON.stringify({ event_id: eventId, code }),
	});
}

export async function createOrder(body: IOrderBuyBody): Promise<IOrderBuyResponse> {
	if (USE_MOCKS) {
		const { mockOrderResponse } = await import('@/mocks/data');
		return mockOrderResponse;
	}
	return apiFetch<IOrderBuyResponse>('/api/public/order/buy', {
		method: 'POST',
		body: JSON.stringify(body),
	});
}

export async function getOrder(orderId: string): Promise<IOrderDetail> {
	if (USE_MOCKS) {
		const { mockOrderDetail } = await import('@/mocks/data');
		return mockOrderDetail;
	}
	return apiFetch<IOrderDetail>(`/api/public/order/${orderId}`);
}

export async function getMyTickets(bearerToken: string): Promise<ITicket[]> {
	if (USE_MOCKS) {
		const { mockTickets } = await import('@/mocks/data');
		return mockTickets;
	}
	return apiFetch<ITicket[]>('/api/public/tickets', { bearerToken });
}

export async function getTicket(bearerToken: string, ticketId: string): Promise<ITicket> {
	if (USE_MOCKS) {
		const { mockTickets } = await import('@/mocks/data');
		return mockTickets.find((t) => t.id === ticketId) || mockTickets[0];
	}
	return apiFetch<ITicket>(`/api/public/tickets/${ticketId}`, { bearerToken });
}

export async function getMyOrders(bearerToken: string): Promise<IOrderDetail[]> {
	if (USE_MOCKS) {
		const { mockOrderDetail } = await import('@/mocks/data');
		return [mockOrderDetail];
	}
	return apiFetch<IOrderDetail[]>('/api/public/orders', { bearerToken });
}

export async function getMe(bearerToken: string): Promise<IMe> {
	if (USE_MOCKS) {
		return {
			email: 'test@example.com',
			first_name: 'Test',
			last_name: 'User',
			phone: '',
		};
	}
	return apiFetch<IMe>('/api/public/me', { bearerToken });
}

export async function updateMe(bearerToken: string, body: IMeUpdate): Promise<IMe> {
	if (USE_MOCKS) {
		return {
			email: 'test@example.com',
			first_name: body.first_name,
			last_name: body.last_name,
			phone: body.phone ?? '',
		};
	}
	return apiFetch<IMe>('/api/public/me', {
		bearerToken,
		method: 'PATCH',
		body: JSON.stringify(body),
	});
}
