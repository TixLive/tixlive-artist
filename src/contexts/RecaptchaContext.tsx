import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '';

type ExecuteRecaptcha = (() => Promise<string | null>) | null;

const RecaptchaContext = createContext<{ executeRecaptcha: ExecuteRecaptcha }>({
	executeRecaptcha: null,
});

export function RecaptchaProvider({ children }: { children: ReactNode }) {
	const recaptchaRef = useRef<ReCAPTCHA | null>(null);

	const executeRecaptcha = useCallback<NonNullable<ExecuteRecaptcha>>(async () => {
		const widget = recaptchaRef.current;
		if (!widget) return null;
		try {
			const token = await widget.executeAsync();
			widget.reset();
			return token ?? null;
		} catch {
			return null;
		}
	}, []);

	if (!SITE_KEY) {
		return <RecaptchaContext.Provider value={{ executeRecaptcha: null }}>{children}</RecaptchaContext.Provider>;
	}

	return (
		<RecaptchaContext.Provider value={{ executeRecaptcha }}>
			<ReCAPTCHA ref={recaptchaRef} sitekey={SITE_KEY} size="invisible" badge="bottomright" />
			{children}
		</RecaptchaContext.Provider>
	);
}

export const useRecaptcha = () => useContext(RecaptchaContext);
