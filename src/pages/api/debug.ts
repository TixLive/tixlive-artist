import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	const out: Record<string, unknown> = {};
	out.BESTTIX_API_URL = process.env.BESTTIX_API_URL || 'NOT_SET';
	out.BESTTIX_API_KEY = process.env.BESTTIX_API_KEY ? `SET:${process.env.BESTTIX_API_KEY.slice(0, 12)}...` : 'NOT_SET';
	out.cwd = process.cwd();

	try {
		const base = process.env.BESTTIX_API_URL || 'http://localhost:3001';
		const key = process.env.BESTTIX_API_KEY || '';
		const r = await fetch(`${base}/api/public/site`, { headers: { 'x-api-key': key } });
		out.apiStatus = r.status;
		out.apiBody = (await r.text()).slice(0, 300);
	} catch (e) {
		out.apiError = e instanceof Error ? e.message : String(e);
	}

	try {
		const { serverSideTranslations } = await import('next-i18next/serverSideTranslations');
		const t = await serverSideTranslations('en', ['common']);
		out.i18nKeys = Object.keys(t);
	} catch (e) {
		out.i18nError = e instanceof Error ? `${e.message}\n${(e as Error).stack?.slice(0, 500)}` : String(e);
	}

	res.status(200).json(out);
}
