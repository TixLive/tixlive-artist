import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { event_id, code } = req.body;

    // Mock mode for local dev
    if (process.env.USE_MOCKS === 'true') {
      if (code === 'SUMMER10') {
        return res.status(200).json({ valid: true, discount_percent: 10 });
      }
      return res.status(200).json({ valid: false, error: 'Invalid promo code' });
    }

    const response = await fetch(`${process.env.BESTTIX_API_URL}/api/public/promo/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.BESTTIX_API_KEY ?? '',
      },
      body: JSON.stringify({ event_id, code }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Promo validate error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
