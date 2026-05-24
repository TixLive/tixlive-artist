import { FC } from 'react';
import { Icon } from '@iconify/react';

interface AddressMapProps {
	googlePlaceId: string;
	height?: number;
}

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

const AddressMap: FC<AddressMapProps> = ({ googlePlaceId, height = 220 }) => {
	const src = MAPS_KEY
		? `https://www.google.com/maps/embed/v1/place?key=${MAPS_KEY}&q=place_id:${googlePlaceId}&zoom=15`
		: `https://maps.google.com/maps?q=place_id:${googlePlaceId}&output=embed&z=15`;

	return (
		<div className="relative w-full overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)]" style={{ height: `${height}px` }}>
			<iframe
				className="absolute inset-0 h-full w-full"
				loading="lazy"
				allowFullScreen
				referrerPolicy="no-referrer-when-downgrade"
				src={src}
				title="Locație pe hartă"
			/>
			{/* Link overlay — tapping opens native Maps on mobile */}
			<a
				href={`https://www.google.com/maps/search/?api=1&query=place_id:${googlePlaceId}`}
				target="_blank"
				rel="noopener noreferrer"
				className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-lg bg-[var(--theme-bg)]/90 px-2.5 py-1.5 text-[0.75rem] font-medium text-[var(--theme-text)] shadow backdrop-blur transition-colors hover:bg-[var(--theme-bg)]"
				aria-label="Deschide în Google Maps"
			>
				<Icon icon="mdi:google-maps" width={14} />
				Deschide harta
			</a>
		</div>
	);
};

export default AddressMap;
