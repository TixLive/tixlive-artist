import type { NextApiRequest, NextApiResponse } from 'next';
import { getSite, getEvents } from '@/lib/api';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '@/i18n.config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	const out: Record<string, unknown> = {};
	out.BESTTIX_API_URL = process.env.BESTTIX_API_URL || 'NOT_SET';
	out.BESTTIX_API_KEY = process.env.BESTTIX_API_KEY ? `SET:${process.env.BESTTIX_API_KEY.slice(0, 12)}...` : 'NOT_SET';
	out.cwd = process.cwd();

	try { const o = await getSite(); out.siteOk = true; out.siteName = o.name; }
	catch (e) { out.siteError = e instanceof Error ? e.message : String(e); }

	try { const ev = await getEvents(); out.eventsOk = true; out.eventsCount = ev.events?.length; }
	catch (e) { out.eventsError = e instanceof Error ? e.message : String(e); }

	try {
		const t = await serverSideTranslations('en', ['common'], nextI18NextConfig);
		out.i18nOk = true; out.i18nKeys = Object.keys(t);
	} catch (e) { out.i18nError = e instanceof Error ? `${e.message}\n${(e as Error).stack?.slice(0, 500)}` : String(e); }

	// Full GSSP simulation
	try {
		const [organizer, eventsData] = await Promise.all([getSite(), getEvents()]);
		const translations = await serverSideTranslations('en', ['common'], nextI18NextConfig);
		out.fullGsspOk = true;
		out.props = { organizer: organizer.name, eventsCount: eventsData.events?.length, translationKeys: Object.keys(translations) };
	} catch (e) { out.fullGsspError = e instanceof Error ? `${e.message}\n${(e as Error).stack?.slice(0, 800)}` : String(e); }

	res.status(200).json(out);
}
