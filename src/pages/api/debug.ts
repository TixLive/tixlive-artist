import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	const out: Record<string, unknown> = {};

	// Env vars
	out.BESTTIX_API_URL = process.env.BESTTIX_API_URL || 'NOT_SET';
	out.BESTTIX_API_KEY = process.env.BESTTIX_API_KEY
		? `SET:${process.env.BESTTIX_API_KEY.slice(0, 12)}...`
		: 'NOT_SET';

	// Test actual fetch to the API
	try {
		const BASE_URL = process.env.BESTTIX_API_URL || 'http://localhost:3001';
		const API_KEY = process.env.BESTTIX_API_KEY || '';
		const r = await fetch(`${BASE_URL}/api/public/site`, {
			headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
		});
		const body = await r.text();
		out.siteStatus = r.status;
		out.siteBody = body.slice(0, 300);
	} catch (e) {
		out.siteError = e instanceof Error ? e.message : String(e);
	}

	// Test i18n
	try {
		const { serverSideTranslations } = await import('next-i18next/serverSideTranslations');
		const nextI18NextConfig = (await import('@/i18n.config')).default;
		await serverSideTranslations('en', ['common'], nextI18NextConfig);
		out.i18nOk = true;
	} catch (e) {
		out.i18nError = e instanceof Error ? e.message : String(e);
	}

	res.status(200).json(out);
}
