import enCommon from '../../public/locales/en/common.json';
import roCommon from '../../public/locales/ro/common.json';
import ruCommon from '../../public/locales/ru/common.json';

export const SUPPORTED_LOCALES = ['en', 'ro', 'ru'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Resolve the active UI locale to a clean 'en' | 'ro' | 'ru' for API payloads.
 *
 * The site ships as a static export (`output: 'export'`), which disables Next.js
 * i18n routing — so `router.locale` is stuck at the default and must NOT be used
 * as the language source. The real, user-selected language lives in i18next
 * (`i18n.language`, hydrated from the NEXT_LOCALE cookie). Pass that here when
 * sending requests (order/buy, email-code) so the backend localizes its emails.
 */
export function normalizeLocale(lang?: string): AppLocale {
	const base = (lang ?? '').slice(0, 2).toLowerCase();
	return (SUPPORTED_LOCALES as readonly string[]).includes(base) ? (base as AppLocale) : 'ro';
}

const translations: Record<string, Record<string, unknown>> = {
	en: enCommon,
	ro: roCommon,
	ru: ruCommon,
};

export function staticI18nProps(locale?: string) {
	const lang = locale ?? 'ro';
	return {
		_nextI18Next: {
			initialI18nStore: {
				en: { common: translations['en'] },
				ro: { common: translations['ro'] },
				ru: { common: translations['ru'] },
			},
			initialLocale: lang,
			ns: ['common'],
			userConfig: null,
		},
	};
}
