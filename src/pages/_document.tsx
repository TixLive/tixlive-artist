import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
	return (
		// Static export can't vary the route per locale, so the shell ships the
		// default locale (`ro`). LocaleHydrator in _app keeps documentElement.lang
		// in sync with the active language for real users who switch.
		<Html lang="ro">
			<Head />
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
