import type { NextApiRequest, NextApiResponse } from 'next';

// Browser-facing proxy → besttix POST /api/public/seating/[slug]/suggest.
// Keeps the secret x-api-key server-side (same pattern as /api/order/buy). The
// seat page calls this for the "pick best seats again" / re-pick action; the
// initial suggestion is computed in getServerSideProps.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		const slug = req.query.slug as string;
		const { session_id, items } = req.body ?? {};

		if (!slug || session_id == null || !Array.isArray(items)) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		const response = await fetch(`${process.env.BESTTIX_API_URL}/api/public/seating/${slug}/suggest`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': process.env.BESTTIX_API_KEY ?? '',
			},
			body: JSON.stringify({ session_id, items }),
		});

		const data = await response.json();
		if (!response.ok) {
			return res.status(response.status).json({ error: data.message ?? data.error ?? 'Suggest failed' });
		}
		return res.status(200).json(data);
	} catch (error) {
		console.error('Seating suggest proxy error:', error);
		return res.status(500).json({ error: 'Internal server error' });
	}
}
