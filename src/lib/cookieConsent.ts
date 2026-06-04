// Configuration for vanilla-cookieconsent (orestbida) — the GDPR cookie banner shown across
// the whole white-label site. Three categories:
//   • necessary  — auth/session, NEXT_LOCALE language cookie, reCAPTCHA anti-spam. Always on.
//   • analytics  — reserved for future site analytics. Off until granted (no scripts yet).
//   • marketing  — gates the Facebook Pixel (browser) + the marketing_consent flag forwarded
//                  to besttix CAPI at checkout. Off until granted.
// The modal text is fully localised (en/ro/ru) from the i18n bundle so a locale switch updates
// it live, and the styling inherits the organizer's brand via --cc-* overrides in globals.css.

import type { i18n as I18n } from 'i18next';
import type { CookieConsentConfig, Translation } from 'vanilla-cookieconsent';

export const MARKETING_CATEGORY = 'marketing';
export const ANALYTICS_CATEGORY = 'analytics';

const SUPPORTED_LANGUAGES = ['en', 'ro', 'ru'] as const;

type Translator = (key: string) => string;

function buildTranslation(t: Translator): Translation {
	return {
		consentModal: {
			label: t('cookieConsent.aria'),
			title: t('cookieConsent.consentModal.title'),
			description: t('cookieConsent.consentModal.description'),
			acceptAllBtn: t('cookieConsent.consentModal.acceptAll'),
			acceptNecessaryBtn: t('cookieConsent.consentModal.acceptNecessary'),
			showPreferencesBtn: t('cookieConsent.consentModal.managePreferences'),
		},
		preferencesModal: {
			title: t('cookieConsent.preferencesModal.title'),
			acceptAllBtn: t('cookieConsent.preferencesModal.acceptAll'),
			acceptNecessaryBtn: t('cookieConsent.preferencesModal.acceptNecessary'),
			savePreferencesBtn: t('cookieConsent.preferencesModal.savePreferences'),
			closeIconLabel: t('cookieConsent.preferencesModal.close'),
			sections: [
				{
					// Intro paragraph (no linkedCategory → plain text block, not a toggle).
					title: t('cookieConsent.preferencesModal.introTitle'),
					description: t('cookieConsent.preferencesModal.intro'),
				},
				{
					title: t('cookieConsent.preferencesModal.necessaryTitle'),
					description: t('cookieConsent.preferencesModal.necessaryDescription'),
					linkedCategory: 'necessary',
				},
				{
					title: t('cookieConsent.preferencesModal.analyticsTitle'),
					description: t('cookieConsent.preferencesModal.analyticsDescription'),
					linkedCategory: ANALYTICS_CATEGORY,
				},
				{
					title: t('cookieConsent.preferencesModal.marketingTitle'),
					description: t('cookieConsent.preferencesModal.marketingDescription'),
					linkedCategory: MARKETING_CATEGORY,
				},
			],
		},
	};
}

/**
 * Builds the full plugin config. `onUpdate` is wired to every consent lifecycle callback so the
 * React layer can re-read the accepted categories whenever they change. Translations for all
 * supported languages are pre-built, so `CookieConsent.setLanguage(locale)` switches instantly.
 */
export function buildCookieConsentConfig(i18n: I18n, onUpdate: () => void): CookieConsentConfig {
	const translations: CookieConsentConfig['language']['translations'] = {};
	for (const lng of SUPPORTED_LANGUAGES) {
		translations[lng] = buildTranslation(i18n.getFixedT(lng, 'common'));
	}

	const current = (SUPPORTED_LANGUAGES as readonly string[]).includes(i18n.language) ? i18n.language : 'en';

	return {
		guiOptions: {
			consentModal: { layout: 'box', position: 'bottom right', equalWeightButtons: true },
			preferencesModal: { layout: 'box', equalWeightButtons: true },
		},
		categories: {
			necessary: { enabled: true, readOnly: true },
			// Microsoft Clarity (session recordings + heatmaps) named explicitly for transparency.
			// Brand name — identical across locales — so it isn't routed through i18n. The localized
			// explanation lives in the analytics section description.
			[ANALYTICS_CATEGORY]: { services: { clarity: { label: 'Microsoft Clarity' } } },
			[MARKETING_CATEGORY]: {},
		},
		language: { default: current, translations },
		onFirstConsent: onUpdate,
		onConsent: onUpdate,
		onChange: onUpdate,
	};
}
