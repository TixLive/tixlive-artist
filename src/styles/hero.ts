import { heroui } from '@heroui/react';

/**
 * Premium B&W theme override. HeroUI primary color is mapped to our ink (#0A0A0A)
 * so default solid Buttons render as the design's near-black accent. Radii are
 * lifted toward the pill-leaning system used in the new design.
 */
export default heroui({
	themes: {
		light: {
			colors: {
				background: '#FFFFFF',
				foreground: '#0A0A0A',
				divider: '#E8E8ED',
				focus: '#0A0A0A',
				primary: {
					50: '#F5F5F7',
					100: '#EBEBEF',
					200: '#C7C7CC',
					300: '#98989F',
					400: '#6E6E73',
					500: '#1D1D1F',
					600: '#0A0A0A',
					700: '#0A0A0A',
					800: '#000000',
					900: '#000000',
					DEFAULT: '#0A0A0A',
					foreground: '#FFFFFF',
				},
				default: {
					50: '#FAFAFC',
					100: '#F5F5F7',
					200: '#EBEBEF',
					300: '#E8E8ED',
					400: '#C7C7CC',
					500: '#98989F',
					600: '#6E6E73',
					700: '#1D1D1F',
					800: '#0A0A0A',
					900: '#000000',
					DEFAULT: '#F5F5F7',
					foreground: '#0A0A0A',
				},
			},
		},
	},
	layout: {
		radius: {
			small: '10px',
			medium: '14px',
			large: '18px',
		},
		borderWidth: {
			small: '1px',
			medium: '1px',
			large: '2px',
		},
	},
});
