import { Geist } from 'next/font/google';

const geist = Geist({
	subsets: ['latin'],
	variable: '--font-geist',
});

// Cabinet Grotesk + Instrument Sans are loaded via Fontshare CDN in _document.tsx
// (not available in next/font)

export { geist };
