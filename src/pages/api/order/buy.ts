import type { NextApiRequest, NextApiResponse } from 'next';
import { getAccessTokenFromCookies } from '@/middleware/Attendee.Middleware';

export const runtime = 'edge';

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
			selected_seats,
		} = req.body;

		if (session_id == null || payment_method_id == null || !Array.isArray(cart) || cart.length === 0) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		const attendeeToken = getAccessTokenFromCookies(req);
		const isAuthed = Boolean(attendeeToken);

		if (!isAuthed && (!email || !first_name || !last_name)) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		const seatField = Array.isArray(selected_seats) && selected_seats.length > 0 ? { selected_seats } : {};
		const returnOrigin = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
		const siteDomain = (req.headers.host ?? '').split(':')[0];

		const forwardedBody = isAuthed
			? { session_id, payment_method_id, cart, addons, promo_code, locale, idempotency_key, ...seatField, return_origin: returnOrigin }
			: { session_id, payment_method_id, email, first_name, last_name, phone, cart, addons, promo_code, locale, idempotency_key, ...seatField, return_origin: returnOrigin };

		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			'x-site-domain': siteDomain,
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
