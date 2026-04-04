import { Geist, Geist_Mono } from 'next/font/google';

const geist = Geist({
	subsets: ['latin'],
	variable: '--font-geist',
});

const geistMono = Geist_Mono({
	subsets: ['latin'],
	variable: '--font-geist-mono',
});

// Cabinet Grotesk + Instrument Sans are loaded via Fontshare CDN in _document.tsx
// (not available in next/font)

export { geist, geistMono };
