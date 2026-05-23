import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	const out: Record<string, unknown> = {};

	out.BESTTIX_API_URL = process.env.BESTTIX_API_URL || 'NOT_SET';
	out.BESTTIX_API_KEY = process.env.BESTTIX_API_KEY
		? `SET:${process.env.BESTTIX_API_KEY.slice(0, 12)}...`
		: 'NOT_SET';
	out.NODE_ENV = process.env.NODE_ENV;
	out.cwd = process.cwd();

	// Test API connectivity
	try {
		const base = process.env.BESTTIX_API_URL || 'http://localhost:3001';
		const key = process.env.BESTTIX_API_KEY || '';
		const r = await fetch(`${base}/api/public/site`, { headers: { 'x-api-key': key } });
		const body = await r.text();
		out.apiStatus = r.status;
		out.apiBodySnippet = body.slice(0, 300);
	} catch (e) {
		out.apiError = e instanceof Error ? e.message : String(e);
	}

	// Test i18n loading
	try {
		const { serverSideTranslations } = await import('next-i18next/serverSideTranslations');
		const t = await serverSideTranslations('en', ['common']);
		out.i18nKeys = Object.keys(t);
	} catch (e) {
		out.i18nError = e instanceof Error ? `${e.message}\n${(e as Error).stack?.slice(0, 500)}` : String(e);
	}

	res.status(200).json(out);
}
