import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { session_id, payment_method_id, email, first_name, last_name, phone, cart, addons, promo_code, locale } = req.body;

    if (session_id == null || payment_method_id == null || !email || !first_name || !last_name || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Mock mode for local dev
    if (process.env.USE_MOCKS === 'true') {
      return res.status(200).json({
        payment_url: `/checkout/success?order_id=mock-order-123`,
        order_id: 'mock-order-123',
      });
    }

    const response = await fetch(`${process.env.BESTTIX_API_URL}/api/public/order/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.BESTTIX_API_KEY ?? '',
      },
      body: JSON.stringify({
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
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message ?? data.error ?? 'Order failed',
        code: data.message ?? data.code,
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Order buy error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
