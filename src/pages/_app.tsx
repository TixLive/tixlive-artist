import '@/styles/globals.css';
import { HeroUIProvider } from '@heroui/react';
import type { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { dmSans, geist, geistMono } from '@/styles/font';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';

function App({ Component, pageProps }: AppProps) {
	const router = useRouter();
	const [queryClient] = useState(
		() => new QueryClient({ defaultOptions: { queries: { staleTime: 60 * 1000 } } })
	);

	const { brandPrimary, brandAccent, eventType } = pageProps;

	// Validate hex color to prevent CSS injection
	const isValidHex = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(v);

	// Inject brand color CSS vars
	const brandCssVars = [
		isValidHex(brandPrimary) && `--brand-primary: ${brandPrimary};`,
		isValidHex(brandAccent) && `--brand-accent: ${brandAccent};`,
	]
		.filter(Boolean)
		.join('\n');

	// Set data-event-type on html element for CSS theme tokens
	useEffect(() => {
		if (eventType) {
			document.documentElement.setAttribute('data-event-type', eventType);
		} else {
			document.documentElement.removeAttribute('data-event-type');
		}
	}, [eventType]);

	return (
		<QueryClientProvider client={queryClient}>
			<HeroUIProvider navigate={router.push}>
				<Head>{brandCssVars && <style>{`:root { ${brandCssVars} }`}</style>}</Head>
				<main className={`${dmSans.variable} ${geist.variable} ${geistMono.variable} font-sans min-h-screen`}>
					<Component {...pageProps} />
				</main>
			</HeroUIProvider>
		</QueryClientProvider>
	);
}

export default appWithTranslation(App);
