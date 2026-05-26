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
