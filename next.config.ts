import type { NextConfig } from 'next';
import path from 'path';

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
	// Pin Turbopack's workspace root to this project so dev chunk filenames
	// don't encode the absolute path (`Desktop_Projects_tixlive-artist_...`).
	turbopack: {
		root: path.resolve(__dirname),
	},
	// Production = static export for Cloudflare Pages. Dev = normal Next.js
	// server so we can use rewrites (which `output: 'export'` disables).
	...(!isDev && { output: 'export' as const }),
	images: {
		unoptimized: true,
		remotePatterns: [
			{ protocol: 'https', hostname: '**' },
			{
				protocol: 'http',
				hostname: 'localhost',
				port: process.env.NEXT_PUBLIC_CDN_LOCAL_PORT,
				pathname: '/**',
			},
		],
		dangerouslyAllowLocalIP: isDev,
	},
	// Dev-only rewrites: in production we statically export single-stub pages
	// (events/_, account/orders/_, etc.) and Cloudflare Pages routes every
	// dynamic URL to the stub via public/_redirects. In dev there's no CF
	// router, so we rewrite manually here. Pages read the actual slug/token
	// from `window.location.pathname` so they work the same in both envs.
	async rewrites() {
		if (!isDev) return [];
		return [
			{ source: '/events/:slug', destination: '/events/_' },
			{ source: '/events/:slug/seats', destination: '/events/_/seats' },
			{ source: '/account/orders/:token', destination: '/account/orders/_' },
			{ source: '/account/tickets/:ticketId', destination: '/account/tickets/_' },
			{ source: '/:page(terms|cookies|public-rules|payment-regulations)', destination: '/_' },
		];
	},
};

export default nextConfig;
