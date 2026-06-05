import 'react-phone-number-input/style.css';
import 'vanilla-cookieconsent/dist/cookieconsent.css';
import '@/styles/globals.css';
import { HeroUIProvider, ToastProvider } from '@heroui/react';
import type { AppProps } from 'next/app';
import type { NextPage } from 'next';
import type { ReactElement, ReactNode } from 'react';
import { appWithTranslation, useTranslation } from 'next-i18next';
import nextI18NextConfig from '@/i18n.config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { manrope, jetbrainsMono } from '@/styles/font';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { OrganizerProvider } from '@/contexts/OrganizerContext';
import { ConsentProvider } from '@/contexts/ConsentContext';
import SiteHead from '@/components/SiteHead';
import { LayoutProvider } from '@/contexts/LayoutContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { RecaptchaProvider } from '@/contexts/RecaptchaContext';
import { FacebookPixel } from '@/components/FacebookPixel';
import { MicrosoftClarity } from '@/components/MicrosoftClarity';

export type NextPageWithLayout<P = object, IP = P> = NextPage<P, IP> & {
	getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
	Component: NextPageWithLayout;
};

function LocaleHydrator() {
	const { i18n } = useTranslation();
	useEffect(() => {
		const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
		const cookieLocale = match?.[1];
		if (cookieLocale && ['en', 'ro', 'ru'].includes(cookieLocale) && i18n.language !== cookieLocale) {
			i18n.changeLanguage(cookieLocale);
		}
	}, [i18n]);
	return null;
}

function App({ Component, pageProps }: AppPropsWithLayout) {
	const router = useRouter();
	const [queryClient] = useState(
		() => new QueryClient({ defaultOptions: { queries: { staleTime: 60 * 1000 } } })
	);

	const getLayout = Component.getLayout ?? ((page) => page);

	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<OrganizerProvider>
					<SiteHead />
					<ConsentProvider>
						<LayoutProvider>
							<RecaptchaProvider>
								<HeroUIProvider navigate={router.push}>
									<ToastProvider placement="top-center" toastOffset={16} />
									<LocaleHydrator />
									<FacebookPixel />
									<MicrosoftClarity />
									<div className={`${manrope.variable} ${jetbrainsMono.variable} font-sans min-h-screen`}>
										{getLayout(<Component {...pageProps} />)}
									</div>
								</HeroUIProvider>
							</RecaptchaProvider>
						</LayoutProvider>
					</ConsentProvider>
				</OrganizerProvider>
			</AuthProvider>
		</QueryClientProvider>
	);
}

export default appWithTranslation(App, nextI18NextConfig);
