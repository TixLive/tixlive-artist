import { FC } from 'react';
import { Icon } from '@iconify/react';

interface AddressMapProps {
	googlePlaceId: string;
	height?: number;
}

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

const AddressMap: FC<AddressMapProps> = ({ googlePlaceId, height = 200 }) => {
	if (!MAPS_KEY) {
		return (
			<div
				className="flex items-center justify-center rounded-xl bg-[var(--theme-surface)] text-[var(--theme-text-muted)]"
				style={{ height: `${height}px` }}
			>
				<Icon icon="mdi:map" width={40} />
			</div>
		);
	}

	return (
		<iframe
			className="w-full rounded-xl"
			height={height}
			style={{ height: `${height}px` }}
			loading="lazy"
			allowFullScreen
			referrerPolicy="no-referrer-when-downgrade"
			src={`https://www.google.com/maps/embed/v1/place?key=${MAPS_KEY}&q=place_id:${googlePlaceId}&zoom=15`}
		/>
	);
};

export default AddressMap;
