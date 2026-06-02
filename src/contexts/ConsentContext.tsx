import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'next-i18next';
import * as CookieConsent from 'vanilla-cookieconsent';
import { ANALYTICS_CATEGORY, MARKETING_CATEGORY, buildCookieConsentConfig } from '@/lib/cookieConsent';

// Site-wide GDPR consent, backed by vanilla-cookieconsent (orestbida). The plugin owns the
// banner/preferences UI and persists the decision in its own `cc_cookie`. This context exposes
// the accepted categories to React: `granted` (marketing) gates the Facebook Pixel + the
// marketing_consent flag forwarded to besttix CAPI; nothing tracking-related fires until then.

interface ConsentCtx {
	/** True once the marketing category is accepted. (Back-compatible name.) */
	granted: boolean;
	/** True once the analytics category is accepted. */
	analyticsGranted: boolean;
	/** True after the plugin has initialised, so consumers can wait before firing. */
	ready: boolean;
	/** Reopen the preferences modal (e.g. from the footer "Cookie settings" link). */
	showPreferences: () => void;
}

const ConsentContext = createContext<ConsentCtx>({
	granted: false,
	analyticsGranted: false,
	ready: false,
	showPreferences: () => {},
});

export function ConsentProvider({ children }: { children: ReactNode }) {
	const { i18n } = useTranslation('common');
	const [granted, setGranted] = useState(false);
	const [analyticsGranted, setAnalyticsGranted] = useState(false);
	const [ready, setReady] = useState(false);
	const startedRef = useRef(false);

	// Initialise the plugin exactly once (StrictMode-safe via the ref guard). Re-read the
	// accepted categories on first load and on every consent change so the gates stay in sync.
	useEffect(() => {
		if (startedRef.current) return;
		startedRef.current = true;

		const sync = () => {
			setGranted(CookieConsent.acceptedCategory(MARKETING_CATEGORY));
			setAnalyticsGranted(CookieConsent.acceptedCategory(ANALYTICS_CATEGORY));
			setReady(true);
		};

		void CookieConsent.run(buildCookieConsentConfig(i18n, sync));
	}, [i18n]);

	// Keep the modal text in sync with the active locale (the NEXT_LOCALE-driven language).
	useEffect(() => {
		if (!ready) return;
		void CookieConsent.setLanguage(i18n.language);
	}, [i18n.language, ready]);

	return (
		<ConsentContext.Provider
			value={{ granted, analyticsGranted, ready, showPreferences: () => CookieConsent.showPreferences() }}
		>
			{children}
		</ConsentContext.Provider>
	);
}

export function useConsent() {
	return useContext(ConsentContext);
}
