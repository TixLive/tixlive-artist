import { Manrope, JetBrains_Mono } from 'next/font/google';

const manrope = Manrope({
	subsets: ['latin', 'latin-ext', 'cyrillic'],
	weight: ['400', '500', '600', '700', '800'],
	variable: '--font-manrope',
});

const jetbrainsMono = JetBrains_Mono({
	subsets: ['latin', 'latin-ext'],
	weight: ['400', '500'],
	variable: '--font-jetbrains-mono',
});

export { manrope, jetbrainsMono };
