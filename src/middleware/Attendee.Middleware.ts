import type {
	GetServerSideProps,
	GetServerSidePropsContext,
	GetServerSidePropsResult,
	NextApiRequest,
	NextApiResponse,
} from 'next';
import type { IncomingMessage, ServerResponse } from 'http';
import jwt from 'jsonwebtoken';
import {
	ACCESS_COOKIE,
	REFRESH_COOKIE,
	clearAttendeeCookies,
	setAttendeeCookies,
} from '@/lib/cookies';

export interface Attendee {
	email: string;
	organizer_id: number;
}

interface AttendeeTokenPayload {
	sub: string;
	organizer_id: number;
	typ: 'attendee';
	exp?: number;
	iat?: number;
}

interface RefreshResponse {
	success?: boolean;
	accessToken?: string;
	refreshToken?: string;
	accessExpiresInDays?: number;
	refreshExpiresInDays?: number;
	email?: string;
	organizer_id?: number;
}

const ACCESS_SECRET = process.env.JWT_ATTENDEE_ACCESS_SECRET || '';

function verifyAccessToken(token: string): Attendee | null {
	if (!ACCESS_SECRET) return null;
	try {
		const decoded = jwt.verify(token, ACCESS_SECRET, { algorithms: ['HS256'] }) as AttendeeTokenPayload;
		if (decoded.typ !== 'attendee' || !decoded.sub || !decoded.organizer_id) return null;
		return { email: decoded.sub, organizer_id: Number(decoded.organizer_id) };
	} catch {
		return null;
	}
}

function parseCookieHeader(header: string | undefined): Record<string, string> {
	if (!header) return {};
	const out: Record<string, string> = {};
	for (const part of header.split(';')) {
		const idx = part.indexOf('=');
		if (idx === -1) continue;
		const k = part.slice(0, idx).trim();
		const v = part.slice(idx + 1).trim();
		if (k) out[k] = decodeURIComponent(v);
	}
	return out;
}

type ReqLike = NextApiRequest | (IncomingMessage & { cookies?: Partial<Record<string, string>> });
type ResLike = NextApiResponse | ServerResponse;

/**
 * Resolve the attendee for a request by checking the access cookie, then
 * falling back to a refresh cookie rotation via the besttix API. On successful
 * refresh, new cookies are written onto `res` before returning.
 *
 * Mirrors besttix's `TokenManagement` + `UserPreMiddleware` in
 * `src/middleware/User.Middleware.ts` — single helper the API and page HOCs
 * share so cookie resolution behavior is identical across entry points.
 */
async function resolveAttendee(req: ReqLike, res: ResLike): Promise<Attendee | null> {
	const cookies =
		(req as NextApiRequest).cookies && typeof (req as NextApiRequest).cookies === 'object'
			? ((req as NextApiRequest).cookies as Record<string, string>)
			: parseCookieHeader(req.headers?.cookie);

	const access = cookies[ACCESS_COOKIE];
	const refresh = cookies[REFRESH_COOKIE];

	if (access) {
		const attendee = verifyAccessToken(access);
		if (attendee) return attendee;
	}

	if (!refresh) return null;

	try {
		const resp = await fetch(`${process.env.BESTTIX_API_URL}/api/public/auth/refresh`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': process.env.BESTTIX_API_KEY || '',
			},
			body: JSON.stringify({ refreshToken: refresh }),
		});

		if (!resp.ok) return null;

		const data = (await resp.json().catch(() => ({}))) as RefreshResponse;
		if (
			typeof data.accessToken !== 'string' ||
			typeof data.refreshToken !== 'string' ||
			typeof data.accessExpiresInDays !== 'number' ||
			typeof data.refreshExpiresInDays !== 'number'
		) {
			return null;
		}

		await setAttendeeCookies(
			req,
			res,
			data.accessToken,
			data.refreshToken,
			data.accessExpiresInDays,
			data.refreshExpiresInDays
		);
		return verifyAccessToken(data.accessToken);
	} catch {
		return null;
	}
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Page-level middleware (getServerSideProps)                                */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Attempt to resolve the attendee inside a `getServerSideProps` without
 * redirecting. Returns `null` if not authenticated. Mirrors besttix's
 * `UserPageMiddleware`.
 */
export async function AttendeePageMiddleware(
	ctx: GetServerSidePropsContext
): Promise<Attendee | null> {
	return resolveAttendee(ctx.req, ctx.res);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AttendeeGSSP<P extends { [key: string]: any } = { [key: string]: any }> = (
	ctx: GetServerSidePropsContext,
	attendee: Attendee
) => Promise<GetServerSidePropsResult<P>>;

/**
 * Wrap a `getServerSideProps` such that the inner function only runs when
 * an authenticated attendee is present. On failure, clears stale cookies
 * and redirects to `/login?next=<original path>`.
 *
 * This is the strict-auth equivalent used by `/my-tickets/*`. Prefer
 * `AttendeePageMiddleware` for pages that want optional-auth behavior.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withAttendeeAuth<P extends { [key: string]: any }>(
	inner: AttendeeGSSP<P>
): GetServerSideProps<P> {
	return async (ctx) => {
		const attendee = await resolveAttendee(ctx.req, ctx.res);

		if (!attendee) {
			await clearAttendeeCookies(ctx.req, ctx.res);
			const nextPath = ctx.resolvedUrl || '/my-tickets';
			return {
				redirect: {
					destination: `/login?next=${encodeURIComponent(nextPath)}`,
					permanent: false,
				},
			};
		}

		return inner(ctx, attendee);
	};
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  API-level middleware                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IHandlerAttendee<T = any> = (
	req: NextApiRequest,
	res: NextApiResponse<T>,
	attendee: Attendee
) => Promise<void | T> | void | T;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IHandlerAttendeeNoRequire<T = any> = (
	req: NextApiRequest,
	res: NextApiResponse<T>,
	attendee: Attendee | null
) => Promise<void | T> | void | T;

/**
 * API-route HOC that requires an authenticated attendee. Responds with
 * 401 `{error:'not_authenticated'}` when the cookies are missing, stale,
 * or refresh fails. Mirrors besttix's `UserAPIMiddleware`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AttendeeAPIMiddleware<T = any>(handler: IHandlerAttendee<T>) {
	return async (req: NextApiRequest, res: NextApiResponse<T>) => {
		const attendee = await resolveAttendee(req, res);
		if (!attendee) {
			await clearAttendeeCookies(req, res);
			return res.status(401).json({ error: 'not_authenticated' } as unknown as T);
		}
		return handler(req, res, attendee);
	};
}

/**
 * API-route HOC that does NOT require authentication. The attendee is
 * passed as `null` when resolution fails. Mirrors besttix's
 * `UserAPIMiddlewareNoRequire`. Useful for endpoints that serve both
 * authed and anonymous callers with different response shapes.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AttendeeAPIMiddlewareNoRequire<T = any>(handler: IHandlerAttendeeNoRequire<T>) {
	return async (req: NextApiRequest, res: NextApiResponse<T>) => {
		const attendee = await resolveAttendee(req, res);
		return handler(req, res, attendee);
	};
}
