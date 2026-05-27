/**
 * Browser-direct authed calls to the besttix backend. No SSR proxy — tokens
 * live in JS-readable cookies and are sent as `Authorization: Bearer`.
 *
 * Org identity:
 *   - `x-site-domain` in production (current hostname must be in besttix's `domain` table)
 *   - `x-org-id` from `NEXT_PUBLIC_ORG_ID` as dev-local fallback when host is localhost
 *
 * Refresh: when an authed call returns 401 with TOKEN_EXPIRED, the wrapper
 * transparently calls `/api/public/auth/refresh`, stores new tokens, and
 * retries the original request once.
 */

import { getCookie, setCookie, deleteCookie } from 'cookies-next/client';
import type {
	IMe,
	IMeUpdate,
	IOrderBuyBody,
	IOrderBuyResponse,
	IOrderDetail,
	ITicket,
} from '@/types';

const BASE = process.env.NEXT_PUBLIC_BESTTIX_API_URL ?? '';
const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? '';

const ACCESS_COOKIE = 'attendee_token';
const REFRESH_COOKIE = 'attendee_refresh';
const DAY_SECONDS = 24 * 60 * 60;

function isLocalHostname(host: string): boolean {
	return (
		host === 'localhost' ||
		host === '127.0.0.1' ||
		host.endsWith('.local') ||
		/^\d+\.\d+\.\d+\.\d+$/.test(host)
	);
}

function orgHeaders(): Record<string, string> {
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	const host = typeof window !== 'undefined' ? window.location.hostname : '';
	if (host && !isLocalHostname(host)) {
		headers['x-site-domain'] = host;
	} else if (ORG_ID) {
		headers['x-org-id'] = ORG_ID;
	}
	return headers;
}

export function getAccessToken(): string | null {
	const v = getCookie(ACCESS_COOKIE);
	return typeof v === 'string' && v.length > 0 ? v : null;
}

export function getRefreshToken(): string | null {
	const v = getCookie(REFRESH_COOKIE);
	return typeof v === 'string' && v.length > 0 ? v : null;
}

function isHttps(): boolean {
	return typeof window !== 'undefined' && window.location.protocol === 'https:';
}

export function setTokens(
	accessToken: string,
	refreshToken: string,
	accessExpiresInDays: number,
	refreshExpiresInDays: number
): void {
	const baseOpts = {
		path: '/',
		sameSite: 'lax' as const,
		secure: isHttps(),
	};
	setCookie(ACCESS_COOKIE, accessToken, { ...baseOpts, maxAge: accessExpiresInDays * DAY_SECONDS });
	setCookie(REFRESH_COOKIE, refreshToken, { ...baseOpts, maxAge: refreshExpiresInDays * DAY_SECONDS });
}

export function clearTokens(): void {
	deleteCookie(ACCESS_COOKIE, { path: '/' });
	deleteCookie(REFRESH_COOKIE, { path: '/' });
}

interface RefreshResponse {
	success?: boolean;
	accessToken?: string;
	refreshToken?: string;
	accessExpiresInDays?: number;
	refreshExpiresInDays?: number;
}

async function tryRefresh(): Promise<string | null> {
	const refresh = getRefreshToken();
	if (!refresh) return null;
	try {
		const res = await fetch(`${BASE}/api/public/auth/refresh`, {
			method: 'POST',
			headers: orgHeaders(),
			body: JSON.stringify({ refreshToken: refresh }),
		});
		if (!res.ok) return null;
		const data = (await res.json().catch(() => ({}))) as RefreshResponse;
		if (
			typeof data.accessToken !== 'string' ||
			typeof data.refreshToken !== 'string' ||
			typeof data.accessExpiresInDays !== 'number' ||
			typeof data.refreshExpiresInDays !== 'number'
		) {
			return null;
		}
		setTokens(data.accessToken, data.refreshToken, data.accessExpiresInDays, data.refreshExpiresInDays);
		return data.accessToken;
	} catch {
		return null;
	}
}

interface AuthedFetchOptions extends Omit<RequestInit, 'headers'> {
	headers?: Record<string, string>;
	requireAuth?: boolean;
}

async function authedFetch<T>(path: string, options: AuthedFetchOptions = {}): Promise<T> {
	const { requireAuth = true, headers: extraHeaders, ...rest } = options;
	let token = getAccessToken();

	if (!token && requireAuth) {
		token = await tryRefresh();
		if (!token) throw new Error('not_authenticated');
	}

	const buildHeaders = (t: string | null): Record<string, string> => ({
		...orgHeaders(),
		...(t ? { Authorization: `Bearer ${t}` } : {}),
		...extraHeaders,
	});

	let res = await fetch(`${BASE}${path}`, { ...rest, headers: buildHeaders(token) });

	if (res.status === 401 && getRefreshToken()) {
		const newToken = await tryRefresh();
		if (newToken) {
			res = await fetch(`${BASE}${path}`, { ...rest, headers: buildHeaders(newToken) });
		} else if (requireAuth) {
			clearTokens();
			throw new Error('not_authenticated');
		}
	}

	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		const err = new Error(body?.message ?? `${res.status}`);
		(err as Error & { status?: number; code?: string }).status = res.status;
		(err as Error & { status?: number; code?: string }).code = typeof body?.code === 'string' ? body.code : undefined;
		throw err;
	}

	return res.json() as Promise<T>;
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Auth flow                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

interface EmailCodeResponse {
	success?: boolean;
	resendTime?: number;
}

export async function requestLoginCode(email: string): Promise<EmailCodeResponse> {
	const res = await fetch(`${BASE}/api/public/auth/email-code`, {
		method: 'POST',
		headers: orgHeaders(),
		body: JSON.stringify({ email }),
	});
	const data = (await res.json().catch(() => ({}))) as EmailCodeResponse;
	if (!res.ok) throw new Error(typeof (data as { message?: string }).message === 'string' ? (data as { message?: string }).message! : 'request_failed');
	return data;
}

export async function resendLoginCode(email: string): Promise<EmailCodeResponse> {
	const res = await fetch(`${BASE}/api/public/auth/email-code`, {
		method: 'POST',
		headers: orgHeaders(),
		body: JSON.stringify({ email, resend: true }),
	});
	const data = (await res.json().catch(() => ({}))) as EmailCodeResponse;
	if (!res.ok) throw new Error('resend_failed');
	return data;
}

interface ValidateResponse {
	success?: boolean;
	accessToken?: string;
	refreshToken?: string;
	accessExpiresInDays?: number;
	refreshExpiresInDays?: number;
	email?: string;
	organizer_id?: number;
}

export async function validateLoginCode(email: string, code: string): Promise<{ email: string; organizer_id: number }> {
	const res = await fetch(`${BASE}/api/public/auth/email-code/validate`, {
		method: 'POST',
		headers: orgHeaders(),
		body: JSON.stringify({ email, code }),
	});
	const data = (await res.json().catch(() => ({}))) as ValidateResponse;
	if (
		!res.ok ||
		typeof data.accessToken !== 'string' ||
		typeof data.refreshToken !== 'string' ||
		typeof data.accessExpiresInDays !== 'number' ||
		typeof data.refreshExpiresInDays !== 'number'
	) {
		throw new Error('invalid_code');
	}
	setTokens(data.accessToken, data.refreshToken, data.accessExpiresInDays, data.refreshExpiresInDays);
	return { email: data.email ?? email, organizer_id: data.organizer_id ?? 0 };
}

export function logout(): void {
	clearTokens();
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Authenticated endpoints                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

export async function getMe(): Promise<IMe> {
	return authedFetch<IMe>('/api/public/me');
}

export async function updateMe(body: IMeUpdate): Promise<IMe> {
	return authedFetch<IMe>('/api/public/me', {
		method: 'PATCH',
		body: JSON.stringify(body),
	});
}

export async function getMyOrders(): Promise<IOrderDetail[]> {
	return authedFetch<IOrderDetail[]>('/api/public/orders');
}

export async function getMyTickets(): Promise<ITicket[]> {
	return authedFetch<ITicket[]>('/api/public/tickets');
}

export async function getMyTicket(ticketId: string): Promise<ITicket> {
	return authedFetch<ITicket>(`/api/public/tickets/${encodeURIComponent(ticketId)}`);
}

export async function createOrder(body: IOrderBuyBody): Promise<IOrderBuyResponse> {
	// Order/buy is special: works for both authed and anonymous. When anonymous,
	// the body must include guest fields (email, first_name, last_name); when
	// authed, the JWT provides identity.
	return authedFetch<IOrderBuyResponse>('/api/public/order/buy', {
		method: 'POST',
		body: JSON.stringify(body),
		requireAuth: false,
	});
}
