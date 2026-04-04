import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
	return (
		<Html>
			<Head>
				{/* Cabinet Grotesk from Fontshare — display font for headings */}
				<link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
				<link
					href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@700,800,900&display=swap"
					rel="stylesheet"
				/>
				{/* Instrument Sans from Fontshare — body font */}
				<link
					href="https://api.fontshare.com/v2/css?f[]=instrument-sans@400,500,600&display=swap"
					rel="stylesheet"
				/>
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
