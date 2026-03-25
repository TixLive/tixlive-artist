import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	i18n: {
		defaultLocale: 'en',
		locales: ['en', 'ro', 'ru'],
	},
	images: {
		remotePatterns: [
			{ protocol: 'https', hostname: '**' },
			{
				protocol: 'http',
				hostname: 'localhost',
				port: process.env.NEXT_PUBLIC_CDN_LOCAL_PORT,
				pathname: '/**',
			},
		],
		dangerouslyAllowLocalIP: process.env.NODE_ENV === 'development',
	},
};

export default nextConfig;
