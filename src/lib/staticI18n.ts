import enCommon from '../../public/locales/en/common.json';
import roCommon from '../../public/locales/ro/common.json';
import ruCommon from '../../public/locales/ru/common.json';

const translations: Record<string, Record<string, unknown>> = {
	en: enCommon,
	ro: roCommon,
	ru: ruCommon,
};

export function staticI18nProps(locale?: string) {
	const lang = locale ?? 'ro';
	const store = translations[lang] ?? translations['ro'];
	return {
		_nextI18Next: {
			initialI18nStore: { [lang]: { common: store } },
			initialLocale: lang,
			ns: ['common'],
			userConfig: null,
		},
	};
}
