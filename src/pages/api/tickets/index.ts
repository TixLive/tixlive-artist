import type { NextApiRequest, NextApiResponse } from 'next';
import { getAccessTokenFromCookies } from '@/middleware/Attendee.Middleware';

export const runtime = 'edge';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
	const token = getAccessTokenFromCookies(req);
	if (!token) return res.status(401).json({ error: true, message: 'not_authenticated' });
	try {
		const upstream = await fetch(`${process.env.BESTTIX_API_URL}/api/public/tickets`, {
			headers: {
				'x-site-domain': (req.headers.host ?? '').split(':')[0],
				Authorization: `Bearer ${token}`,
			},
		});
		return res.status(upstream.status).json(await upstream.json().catch(() => ({})));
	} catch {
		return res.status(502).json({ error: true, message: 'upstream_unavailable' });
	}
}
