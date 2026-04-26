import type { NextApiRequest, NextApiResponse } from 'next';
import { clearAttendeeCookies, REFRESH_COOKIE, setAttendeeCookies } from '@/lib/cookies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const refreshToken = req.cookies[REFRESH_COOKIE];
	if (!refreshToken) {
		await clearAttendeeCookies(req, res);
		return res.status(401).json({ error: true, message: 'not_authenticated' });
	}

	try {
		const upstream = await fetch(`${process.env.BESTTIX_API_URL}/api/public/auth/refresh`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': process.env.BESTTIX_API_KEY ?? '',
			},
			body: JSON.stringify({ refreshToken }),
		});

		const data = await upstream.json().catch(() => ({}));

		if (
			upstream.ok &&
			typeof data?.accessToken === 'string' &&
			typeof data?.refreshToken === 'string' &&
			typeof data?.accessExpiresInDays === 'number' &&
			typeof data?.refreshExpiresInDays === 'number'
		) {
			await setAttendeeCookies(
				req,
				res,
				data.accessToken,
				data.refreshToken,
				data.accessExpiresInDays,
				data.refreshExpiresInDays
			);
			return res.status(200).json({ success: true });
		}

		// Upstream rejected — clear stale cookies
		await clearAttendeeCookies(req, res);
		return res.status(upstream.status || 401).json(data);
	} catch {
		return res.status(502).json({ error: true, message: 'upstream_unavailable' });
	}
}
