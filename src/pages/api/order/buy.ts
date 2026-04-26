import type { NextApiRequest, NextApiResponse } from 'next';
import { getAccessTokenFromCookies } from '@/middleware/Attendee.Middleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		const {
			session_id,
			payment_method_id,
			email,
			first_name,
			last_name,
			phone,
			cart,
			addons,
			promo_code,
			locale,
			idempotency_key,
		} = req.body;

		// Cart + payment + locale are always required (anonymous and authed both).
		if (
			session_id == null ||
			payment_method_id == null ||
			!Array.isArray(cart) ||
			cart.length === 0
		) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		const attendeeToken = getAccessTokenFromCookies(req);

		// Anonymous flow: client-supplied PII is required and forwarded as-is.
		// Authed flow:   client MUST NOT supply PII; besttix derives it from the JWT.
		// We strip the four PII fields from the forwarded body when a token is present
		// so a buggy / malicious client can't smuggle a different identity through us.
		const isAuthed = Boolean(attendeeToken);

		if (!isAuthed) {
			if (!email || !first_name || !last_name) {
				return res.status(400).json({ error: 'Missing required fields' });
			}
		}

		// Mock mode for local dev
		if (process.env.USE_MOCKS === 'true') {
			return res.status(200).json({
				payment_url: `/checkout/success?token=mock-token-abc123`,
				token: 'mock-token-abc123',
			});
		}

		const forwardedBody = isAuthed
			? {
					session_id,
					payment_method_id,
					cart,
					addons,
					promo_code,
					locale,
					idempotency_key,
					return_origin: `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`,
			  }
			: {
					session_id,
					payment_method_id,
					email,
					first_name,
					last_name,
					phone,
					cart,
					addons,
					promo_code,
					locale,
					idempotency_key,
					return_origin: `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`,
			  };

		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			'x-api-key': process.env.BESTTIX_API_KEY ?? '',
		};
		if (attendeeToken) {
			headers['Authorization'] = `Bearer ${attendeeToken}`;
		}

		const response = await fetch(`${process.env.BESTTIX_API_URL}/api/public/order/buy`, {
			method: 'POST',
			headers,
			body: JSON.stringify(forwardedBody),
		});

		const data = await response.json();

		if (!response.ok) {
			return res.status(response.status).json({
				error: data.message ?? data.error ?? 'Order failed',
				code: data.code ?? data.message,
			});
		}

		return res.status(200).json(data);
	} catch (error) {
		console.error('Order buy error:', error);
		return res.status(500).json({ error: 'Internal server error' });
	}
}
