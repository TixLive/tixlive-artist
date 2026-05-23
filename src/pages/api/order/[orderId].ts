import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId } = req.query;

    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ error: 'Missing order ID' });
    }

    const response = await fetch(`${process.env.BESTTIX_API_URL}/api/public/order/${orderId}`, {
      headers: {
        'x-api-key': process.env.BESTTIX_API_KEY ?? '',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Order detail error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
