import type { NextApiRequest, NextApiResponse } from 'next';
import { clearAttendeeCookies } from '@/lib/cookies';

export const runtime = 'edge';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	await clearAttendeeCookies(req, res);
	return res.status(200).json({ success: true });
}
