import { DM_Sans, Geist, Geist_Mono } from 'next/font/google';

const dmSans = DM_Sans({
	subsets: ['latin', 'latin-ext'],
	variable: '--font-dm-sans',
	weight: ['400', '500', '600', '700'],
});

const geist = Geist({
	subsets: ['latin'],
	variable: '--font-geist',
});

const geistMono = Geist_Mono({
	subsets: ['latin'],
	variable: '--font-geist-mono',
});

// Satoshi is loaded via Fontshare CDN in _document.tsx
// (not available in next/font)

export { dmSans, geist, geistMono };
