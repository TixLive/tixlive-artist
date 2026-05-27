/**
 * Browser-direct HTTP client for the besttix backend.
 *
 * Identity:
 *   - Production: `x-site-domain: <hostname>` (besttix maps domain → org).
 *   - Local dev:  `x-org-id: <NEXT_PUBLIC_ORG_ID>` (localhost isn't a registered domain).
 *
 * Auth:
 *   - Access + refresh tokens live in JS-readable cookies (`attendee_token`,
 *     `attendee_refresh`). When an access token is present, requests carry
 *     `Authorization: Bearer <token>`.
 *   - On any 401 (or missing-access-but-present-refresh) the client transparently
 *     calls `/api/public/auth/refresh`, swaps in the new tokens, and retries the
 *     original request **once**. If refresh fails, tokens are cleared and an
 *     `ApiError` with code `NOT_AUTHENTICATED` is thrown.
 */

import { getCookie, setCookie, deleteCookie } from 'cookies-next/client';

const BASE = process.env.NEXT_PUBLIC_BESTTIX_API_URL ?? '';
const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? '';

const ACCESS_COOKIE = 'attendee_token';
const REFRESH_COOKIE = 'attendee_refresh';
const DAY_SECONDS = 24 * 60 * 60;

export class ApiError extends Error {
	status: number;
	code?: string;
	constructor(message: string, status: number, code?: string) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.code = code;
	}
}

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

function isHttps(): boolean {
	return typeof window !== 'undefined' && window.location.protocol === 'https:';
}

export function getAccessToken(): string | null {
	const v = getCookie(ACCESS_COOKIE);
	return typeof v === 'string' && v.length > 0 ? v : null;
}

export function getRefreshToken(): string | null {
	const v = getCookie(REFRESH_COOKIE);
	return typeof v === 'string' && v.length > 0 ? v : null;
}

export function setTokens(
	accessToken: string,
	refreshToken: string,
	accessExpiresInDays: number,
	refreshExpiresInDays: number
): void {
	const baseOpts = { path: '/', sameSite: 'lax' as const, secure: isHttps() };
	setCookie(ACCESS_COOKIE, accessToken, { ...baseOpts, maxAge: accessExpiresInDays * DAY_SECONDS });
	setCookie(REFRESH_COOKIE, refreshToken, { ...baseOpts, maxAge: refreshExpiresInDays * DAY_SECONDS });
}

export function clearTokens(): void {
	deleteCookie(ACCESS_COOKIE, { path: '/' });
	deleteCookie(REFRESH_COOKIE, { path: '/' });
}

interface RefreshResponse {
	accessToken?: string;
	refreshToken?: string;
	accessExpiresInDays?: number;
	refreshExpiresInDays?: number;
}

let inflightRefresh: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
	if (inflightRefresh) return inflightRefresh;
	const refresh = getRefreshToken();
	if (!refresh) return null;

	inflightRefresh = (async () => {
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
		} finally {
			inflightRefresh = null;
		}
	})();

	return inflightRefresh;
}

interface RequestOptions {
	headers?: Record<string, string>;
}

async function request<T>(path: string, init: RequestInit, options: RequestOptions = {}): Promise<T> {
	const buildHeaders = (token: string | null): Record<string, string> => ({
		...orgHeaders(),
		...(token ? { Authorization: `Bearer ${token}` } : {}),
		...options.headers,
	});

	let token = getAccessToken();
	if (!token && getRefreshToken()) {
		token = await tryRefresh();
	}

	let res = await fetch(`${BASE}${path}`, { ...init, headers: buildHeaders(token) });

	if (res.status === 401 && getRefreshToken()) {
		const newToken = await tryRefresh();
		if (newToken) {
			res = await fetch(`${BASE}${path}`, { ...init, headers: buildHeaders(newToken) });
		} else {
			clearTokens();
			throw new ApiError('not_authenticated', 401, 'NOT_AUTHENTICATED');
		}
	}

	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		const message =
			typeof (body as { message?: string }).message === 'string'
				? (body as { message: string }).message
				: `${res.status}`;
		const code = typeof (body as { code?: string }).code === 'string' ? (body as { code: string }).code : undefined;
		throw new ApiError(message, res.status, code);
	}

	// Empty body (204) → return undefined cast as T
	if (res.status === 204) return undefined as T;
	return res.json() as Promise<T>;
}

const ApiService = {
	get<T>(path: string, options?: RequestOptions): Promise<T> {
		return request<T>(path, { method: 'GET' }, options);
	},
	post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
		return request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }, options);
	},
	patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
		return request<T>(path, { method: 'PATCH', body: body === undefined ? undefined : JSON.stringify(body) }, options);
	},
	put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
		return request<T>(path, { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body) }, options);
	},
	delete<T>(path: string, options?: RequestOptions): Promise<T> {
		return request<T>(path, { method: 'DELETE' }, options);
	},
};

export default ApiService;
