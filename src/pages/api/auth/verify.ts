import type { NextApiRequest, NextApiResponse } from 'next';
import { setCookie } from 'cookies-next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'GET') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		const { t: token } = req.query;

		if (!token || typeof token !== 'string') {
			return res.status(400).json({ success: false, error: 'invalid' });
		}

		// Mock mode for local dev
		if (process.env.USE_MOCKS === 'true') {
			if (token === 'valid-mock-token') {
				const sessionValue = JSON.stringify({ email: 'test@example.com', organizer_id: 1 });

				setCookie('attendee_session', sessionValue, {
					req,
					res,
					httpOnly: true,
					secure: process.env.NODE_ENV === 'production',
					sameSite: 'lax',
					maxAge: 30 * 24 * 60 * 60,
					path: '/',
				});

				return res.status(200).json({ success: true, email: 'test@example.com' });
			}
			return res.status(400).json({ success: false, error: 'invalid' });
		}

		const response = await fetch(
			`${process.env.BESTTIX_API_URL}/api/public/auth/verify?t=${encodeURIComponent(token)}`,
			{
				headers: {
					'x-api-key': process.env.BESTTIX_API_KEY ?? '',
				},
			}
		);

		const data = await response.json();

		if (!response.ok || !data.success) {
			return res.status(response.status).json(data);
		}

		const sessionValue = JSON.stringify({ email: data.email, organizer_id: data.organizer_id });

		setCookie('attendee_session', sessionValue, {
			req,
			res,
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 30 * 24 * 60 * 60,
			path: '/',
		});

		return res.status(200).json({ success: true, email: data.email });
	} catch (error) {
		console.error('Verify error:', error);
		return res.status(500).json({ success: false, error: 'invalid' });
	}
}
