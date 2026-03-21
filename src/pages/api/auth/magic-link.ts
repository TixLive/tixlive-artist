import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		const { email } = req.body;

		if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return res.status(400).json({ error: 'Invalid email address' });
		}

		// Mock mode for local dev
		if (process.env.USE_MOCKS === 'true') {
			return res.status(200).json({ success: true });
		}

		const response = await fetch(`${process.env.BESTTIX_API_URL}/api/public/auth/magic-link`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': process.env.BESTTIX_API_KEY ?? '',
			},
			body: JSON.stringify({ email }),
		});

		const data = await response.json();

		if (!response.ok) {
			return res.status(response.status).json(data);
		}

		return res.status(200).json({ success: true });
	} catch (error) {
		console.error('Magic link error:', error);
		return res.status(500).json({ error: 'Internal server error' });
	}
}
