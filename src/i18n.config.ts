// No-op backend: prevents next-i18next from auto-loading i18next-fs-backend
// (async fs reads) during SSR. Translations are baked into pageProps via
// `staticI18nProps`, so the backend just needs to short-circuit synchronously
// — without this, `t()` returns raw keys during the server render and we get
// a hydration mismatch against the client.
const noopBackend = {
	type: 'backend' as const,
	init: () => {},
	read: (_lng: string, _ns: string, cb: (err: unknown, data: unknown) => void) => cb(null, {}),
};

const nextI18NextConfig = {
	i18n: {
		defaultLocale: 'ro',
		locales: ['en', 'ro', 'ru'],
	},
	use: [noopBackend],
	serializeConfig: false,
};

export default nextI18NextConfig;
