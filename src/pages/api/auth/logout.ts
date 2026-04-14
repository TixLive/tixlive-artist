import type { NextApiRequest, NextApiResponse } from 'next';
import { clearAttendeeCookies } from '@/lib/cookies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	// JWTs are stateless — logout is purely client-side cookie clearing.
	// No need to call besttix; the tokens will expire on their own.
	await clearAttendeeCookies(req, res);
	return res.status(200).json({ success: true });
}
