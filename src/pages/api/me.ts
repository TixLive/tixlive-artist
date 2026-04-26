import type { NextApiRequest, NextApiResponse } from 'next';
import { getAccessTokenFromCookies } from '@/middleware/Attendee.Middleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'GET' && req.method !== 'PATCH') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const token = getAccessTokenFromCookies(req);
	if (!token) {
		return res.status(401).json({ error: true, message: 'not_authenticated' });
	}

	try {
		const upstream = await fetch(`${process.env.BESTTIX_API_URL}/api/public/me`, {
			method: req.method,
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': process.env.BESTTIX_API_KEY ?? '',
				Authorization: `Bearer ${token}`,
			},
			body: req.method === 'PATCH' ? JSON.stringify(req.body ?? {}) : undefined,
		});

		const data = await upstream.json().catch(() => ({}));
		return res.status(upstream.status).json(data);
	} catch {
		return res.status(502).json({ error: true, message: 'upstream_unavailable' });
	}
}
