interface Env {
	BESTTIX_API_URL?: string;
}

interface Ctx {
	request: Request;
	env: Env;
	params: Record<string, string | string[]>;
}

const BESTTIX_DEFAULT = 'https://tix.live';
const ACCESS_COOKIE = 'attendee_token';
const REFRESH_COOKIE = 'attendee_refresh';
const DAY_SECS = 24 * 60 * 60;

function parseCookies(header: string): Record<string, string> {
	const out: Record<string, string> = {};
	for (const part of header.split(';')) {
		const eq = part.indexOf('=');
		if (eq < 1) continue;
		const k = part.slice(0, eq).trim();
		const v = part.slice(eq + 1).trim();
		try { out[k] = decodeURIComponent(v); } catch { out[k] = v; }
	}
	return out;
}

function cookieSet(name: string, value: string, maxAge: number, secure: boolean): string {
	return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

function cookieClear(name: string): string {
	return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

function jsonResp(data: unknown, status = 200, extra?: Record<string, string>): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json', ...extra },
	});
}

export async function onRequest({ request, env }: Ctx): Promise<Response> {
	const url = new URL(request.url);
	const method = request.method;
	const host = url.hostname;
	const secure = url.protocol === 'https:';
	const BESTTIX = (env.BESTTIX_API_URL ?? BESTTIX_DEFAULT).replace(/\/$/, '');

	if (method === 'OPTIONS') return new Response(null, { status: 204 });

	// Strip /api/ prefix
	const sub = url.pathname.replace(/^\/api\//, '').replace(/\/$/, '');
	const cookies = parseCookies(request.headers.get('cookie') ?? '');
	const accessToken = cookies[ACCESS_COOKIE];
	const refreshToken = cookies[REFRESH_COOKIE];

	// logout — clear cookies, no upstream call
	if (sub === 'auth/logout') {
		if (method !== 'POST') return jsonResp({ error: 'Method not allowed' }, 405);
		const h = new Headers({ 'Content-Type': 'application/json' });
		h.append('Set-Cookie', cookieClear(ACCESS_COOKIE));
		h.append('Set-Cookie', cookieClear(REFRESH_COOKIE));
		return new Response(JSON.stringify({ success: true }), { status: 200, headers: h });
	}

	// refresh
	if (sub === 'auth/refresh') {
		if (method !== 'POST') return jsonResp({ error: 'Method not allowed' }, 405);
		if (!refreshToken) {
			const h = new Headers({ 'Content-Type': 'application/json' });
			h.append('Set-Cookie', cookieClear(ACCESS_COOKIE));
			h.append('Set-Cookie', cookieClear(REFRESH_COOKIE));
			return new Response(JSON.stringify({ error: true, message: 'not_authenticated' }), { status: 401, headers: h });
		}
		try {
			const up = await fetch(`${BESTTIX}/api/public/auth/refresh`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'x-site-domain': host },
				body: JSON.stringify({ refreshToken }),
			});
			const data = await up.json().catch(() => ({})) as Record<string, unknown>;
			const h = new Headers({ 'Content-Type': 'application/json' });
			if (up.ok && typeof data.accessToken === 'string' && typeof data.refreshToken === 'string') {
				h.append('Set-Cookie', cookieSet(ACCESS_COOKIE, data.accessToken as string, (data.accessExpiresInDays as number) * DAY_SECS, secure));
				h.append('Set-Cookie', cookieSet(REFRESH_COOKIE, data.refreshToken as string, (data.refreshExpiresInDays as number) * DAY_SECS, secure));
				return new Response(JSON.stringify({ success: true }), { status: 200, headers: h });
			}
			h.append('Set-Cookie', cookieClear(ACCESS_COOKIE));
			h.append('Set-Cookie', cookieClear(REFRESH_COOKIE));
			return new Response(JSON.stringify(data), { status: up.status || 401, headers: h });
		} catch {
			return jsonResp({ error: true, message: 'upstream_unavailable' }, 502);
		}
	}

	// validate OTP — sets auth cookies
	if (sub === 'auth/email-code/validate') {
		if (method !== 'POST') return jsonResp({ error: 'Method not allowed' }, 405);
		try {
			const body = await request.text();
			const up = await fetch(`${BESTTIX}/api/public/auth/email-code/validate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'x-site-domain': host },
				body,
			});
			const data = await up.json().catch(() => ({})) as Record<string, unknown>;
			if (up.ok && typeof data.accessToken === 'string' && typeof data.refreshToken === 'string') {
				const h = new Headers({ 'Content-Type': 'application/json' });
				h.append('Set-Cookie', cookieSet(ACCESS_COOKIE, data.accessToken as string, (data.accessExpiresInDays as number) * DAY_SECS, secure));
				h.append('Set-Cookie', cookieSet(REFRESH_COOKIE, data.refreshToken as string, (data.refreshExpiresInDays as number) * DAY_SECS, secure));
				return new Response(JSON.stringify({ success: true, email: data.email, organizer_id: data.organizer_id }), { status: 200, headers: h });
			}
			return jsonResp(data, up.status || 500);
		} catch {
			return jsonResp({ error: true, message: 'upstream_unavailable' }, 502);
		}
	}

	// send OTP
	if (sub === 'auth/email-code') {
		if (method !== 'POST') return jsonResp({ error: 'Method not allowed' }, 405);
		try {
			const body = await request.text();
			const up = await fetch(`${BESTTIX}/api/public/auth/email-code`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'x-site-domain': host },
				body,
			});
			return jsonResp(await up.json().catch(() => ({})), up.status);
		} catch {
			return jsonResp({ error: true, message: 'upstream_unavailable' }, 502);
		}
	}

	// me (GET profile / PATCH update)
	if (sub === 'me') {
		if (method !== 'GET' && method !== 'PATCH') return jsonResp({ error: 'Method not allowed' }, 405);
		if (!accessToken) return jsonResp({ error: true, message: 'not_authenticated' }, 401);
		try {
			const up = await fetch(`${BESTTIX}/api/public/me`, {
				method,
				headers: {
					'Content-Type': 'application/json',
					'x-site-domain': host,
					Authorization: `Bearer ${accessToken}`,
				},
				body: method === 'PATCH' ? await request.text() : undefined,
			});
			return jsonResp(await up.json().catch(() => ({})), up.status);
		} catch {
			return jsonResp({ error: true, message: 'upstream_unavailable' }, 502);
		}
	}

	// order buy
	if (sub === 'order/buy') {
		if (method !== 'POST') return jsonResp({ error: 'Method not allowed' }, 405);
		try {
			const rawBody = await request.text();
			let parsed: Record<string, unknown>;
			try { parsed = JSON.parse(rawBody); } catch { return jsonResp({ error: 'Invalid JSON' }, 400); }

			const { session_id, payment_method_id, cart, addons, promo_code, locale, idempotency_key, selected_seats, email, first_name, last_name, phone } = parsed;

			if (session_id == null || payment_method_id == null || !Array.isArray(cart) || (cart as unknown[]).length === 0) {
				return jsonResp({ error: 'Missing required fields' }, 400);
			}
			const isAuthed = Boolean(accessToken);
			if (!isAuthed && (!email || !first_name || !last_name)) {
				return jsonResp({ error: 'Missing required fields' }, 400);
			}

			const seatField = Array.isArray(selected_seats) && (selected_seats as unknown[]).length > 0 ? { selected_seats } : {};
			const returnOrigin = `${url.protocol}//${url.host}`;
			const forwardBody = isAuthed
				? { session_id, payment_method_id, cart, addons, promo_code, locale, idempotency_key, ...seatField, return_origin: returnOrigin }
				: { session_id, payment_method_id, email, first_name, last_name, phone, cart, addons, promo_code, locale, idempotency_key, ...seatField, return_origin: returnOrigin };

			const reqHeaders: Record<string, string> = { 'Content-Type': 'application/json', 'x-site-domain': host };
			if (accessToken) reqHeaders.Authorization = `Bearer ${accessToken}`;

			const up = await fetch(`${BESTTIX}/api/public/order/buy`, {
				method: 'POST',
				headers: reqHeaders,
				body: JSON.stringify(forwardBody),
			});
			const data = await up.json().catch(() => ({})) as Record<string, unknown>;
			if (!up.ok) return jsonResp({ error: data.message ?? 'Order failed', code: data.code ?? data.message }, up.status);
			return jsonResp(data);
		} catch {
			return jsonResp({ error: 'Internal server error' }, 500);
		}
	}

	// orders list
	if (sub === 'orders') {
		if (method !== 'GET') return jsonResp({ error: 'Method not allowed' }, 405);
		if (!accessToken) return jsonResp({ error: true, message: 'not_authenticated' }, 401);
		try {
			const up = await fetch(`${BESTTIX}/api/public/orders`, {
				headers: { 'x-site-domain': host, Authorization: `Bearer ${accessToken}` },
			});
			return jsonResp(await up.json().catch(() => ({})), up.status);
		} catch {
			return jsonResp({ error: true, message: 'upstream_unavailable' }, 502);
		}
	}

	// tickets list
	if (sub === 'tickets') {
		if (method !== 'GET') return jsonResp({ error: 'Method not allowed' }, 405);
		if (!accessToken) return jsonResp({ error: true, message: 'not_authenticated' }, 401);
		try {
			const up = await fetch(`${BESTTIX}/api/public/tickets`, {
				headers: { 'x-site-domain': host, Authorization: `Bearer ${accessToken}` },
			});
			return jsonResp(await up.json().catch(() => ({})), up.status);
		} catch {
			return jsonResp({ error: true, message: 'upstream_unavailable' }, 502);
		}
	}

	// ticket detail
	if (sub.startsWith('tickets/')) {
		if (method !== 'GET') return jsonResp({ error: 'Method not allowed' }, 405);
		if (!accessToken) return jsonResp({ error: true, message: 'not_authenticated' }, 401);
		const ticketId = sub.slice('tickets/'.length);
		if (!ticketId) return jsonResp({ error: 'Missing ticketId' }, 400);
		try {
			const up = await fetch(`${BESTTIX}/api/public/tickets/${ticketId}`, {
				headers: { 'x-site-domain': host, Authorization: `Bearer ${accessToken}` },
			});
			return jsonResp(await up.json().catch(() => ({})), up.status);
		} catch {
			return jsonResp({ error: true, message: 'upstream_unavailable' }, 502);
		}
	}

	return jsonResp({ error: 'Not found' }, 404);
}
