import { deleteCookie, setCookie } from 'cookies-next';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { IncomingMessage, ServerResponse } from 'http';

export const ACCESS_COOKIE = 'attendee_token';
export const REFRESH_COOKIE = 'attendee_refresh';
const DAY_SECONDS = 24 * 60 * 60;

type ReqLike = NextApiRequest | (IncomingMessage & { cookies?: Partial<Record<string, string>> });
type ResLike = NextApiResponse | ServerResponse;

export async function setAttendeeCookies(
	req: ReqLike,
	res: ResLike,
	accessToken: string,
	refreshToken: string,
	accessExpiresInDays: number,
	refreshExpiresInDays: number
): Promise<void> {
	const baseOpts = {
		req,
		res,
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax' as const,
		path: '/',
	};

	await setCookie(ACCESS_COOKIE, accessToken, {
		...baseOpts,
		maxAge: accessExpiresInDays * DAY_SECONDS,
	});
	await setCookie(REFRESH_COOKIE, refreshToken, {
		...baseOpts,
		maxAge: refreshExpiresInDays * DAY_SECONDS,
	});
}

export async function clearAttendeeCookies(req: ReqLike, res: ResLike): Promise<void> {
	await deleteCookie(ACCESS_COOKIE, { req, res, path: '/' });
	await deleteCookie(REFRESH_COOKIE, { req, res, path: '/' });
}
