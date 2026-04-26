import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		const upstream = await fetch(`${process.env.BESTTIX_API_URL}/api/public/auth/email-code`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': process.env.BESTTIX_API_KEY ?? '',
			},
			body: JSON.stringify(req.body ?? {}),
		});

		const data = await upstream.json().catch(() => ({}));
		return res.status(upstream.status).json(data);
	} catch {
		return res.status(502).json({ error: true, message: 'upstream_unavailable' });
	}
}
