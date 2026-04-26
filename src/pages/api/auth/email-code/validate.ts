import type { NextApiRequest, NextApiResponse } from 'next';
import { setAttendeeCookies } from '@/lib/cookies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		const upstream = await fetch(`${process.env.BESTTIX_API_URL}/api/public/auth/email-code/validate`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': process.env.BESTTIX_API_KEY ?? '',
			},
			body: JSON.stringify(req.body ?? {}),
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

			return res.status(200).json({
				success: true,
				email: data.email,
				organizer_id: data.organizer_id,
			});
		}

		return res.status(upstream.status || 500).json(data);
	} catch {
		return res.status(502).json({ error: true, message: 'upstream_unavailable' });
	}
}
