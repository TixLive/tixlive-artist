import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	i18n: {
		defaultLocale: 'en',
		locales: ['en', 'ro', 'ru'],
	},
	images: {
		remotePatterns: [{ protocol: 'https', hostname: '**' }],
	},
};

export default nextConfig;
