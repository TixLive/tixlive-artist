import type {
	IOrganizer,
	IEventListItem,
	IEventDetail,
	IPromoValidateResponse,
	IOrderBuyBody,
	IOrderBuyResponse,
	IOrderDetail,
	ITicket,
} from '@/types';

const USE_MOCKS = process.env.USE_MOCKS === 'true';
const BASE_URL = process.env.BESTTIX_API_URL || 'http://localhost:3001';
const API_KEY = process.env.BESTTIX_API_KEY || '';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
	const res = await fetch(`${BASE_URL}${path}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': API_KEY,
			...options?.headers,
		},
	});

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

export async function requestMagicLink(email: string): Promise<{ success: boolean }> {
	if (USE_MOCKS) {
		return { success: true };
	}
	return apiFetch<{ success: boolean }>('/api/public/auth/magic-link', {
		method: 'POST',
		body: JSON.stringify({ email }),
	});
}

export async function verifyMagicLink(token: string): Promise<{ success: boolean; email: string }> {
	if (USE_MOCKS) {
		if (token === 'test-expired') throw new Error('This magic link has expired.');
		if (token === 'test-used') throw new Error('This magic link has already been used.');
		return { success: true, email: 'test@example.com' };
	}
	return apiFetch<{ success: boolean; email: string }>(`/api/public/auth/verify?t=${encodeURIComponent(token)}`);
}

export async function getMyTickets(email: string, organizerId: number): Promise<ITicket[]> {
	if (USE_MOCKS) {
		const { mockTickets } = await import('@/mocks/data');
		return mockTickets;
	}
	return apiFetch<ITicket[]>(`/api/public/tickets?email=${encodeURIComponent(email)}&organizer_id=${organizerId}`);
}

export async function getTicket(email: string, organizerId: number, ticketId: string): Promise<ITicket> {
	if (USE_MOCKS) {
		const { mockTickets } = await import('@/mocks/data');
		return mockTickets.find((t) => t.id === ticketId) || mockTickets[0];
	}
	return apiFetch<ITicket>(`/api/public/tickets/${ticketId}?email=${encodeURIComponent(email)}&organizer_id=${organizerId}`);
}
