import { FC } from 'react';
import { Icon } from '@iconify/react';

interface AddressMapProps {
	googlePlaceId: string;
	address?: string;
	height?: number;
}

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

const AddressMap: FC<AddressMapProps> = ({ googlePlaceId, address, height = 220 }) => {
	// With API key: use the proper Embed API (place_id supported).
	// Without API key: fall back to a text search query — place_id embeds are
	// broken without a key and render the world map.
	const src = MAPS_KEY
		? `https://www.google.com/maps/embed/v1/place?key=${MAPS_KEY}&q=place_id:${googlePlaceId}&zoom=15`
		: address
			? `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed&z=15`
			: null;

	const mapsHref = `https://www.google.com/maps/search/?api=1&query=place_id:${googlePlaceId}`;

	if (!src) {
		return (
			<div
				className="mt-4 flex items-center justify-between rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] px-5 py-4"
				style={{ height: `${height}px` }}
			>
				<div className="flex items-center gap-3 text-[var(--theme-text-muted)]">
					<Icon icon="mdi:map-marker-outline" width={28} />
					<span className="text-[0.875rem]">{address ?? 'Hartă indisponibilă'}</span>
				</div>
				<a
					href={mapsHref}
					target="_blank"
					rel="noopener noreferrer"
					className="shrink-0 rounded-full bg-[var(--brand-primary)] px-4 py-2 text-[0.8125rem] font-semibold text-[var(--theme-bg)]"
				>
					Deschide harta
				</a>
			</div>
		);
	}

	return (
		<div className="relative mt-4 w-full overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)]" style={{ height: `${height}px` }}>
			<iframe
				className="absolute inset-0 h-full w-full"
				loading="lazy"
				allowFullScreen
				referrerPolicy="no-referrer-when-downgrade"
				src={src}
				title="Locație pe hartă"
			/>
			<a
				href={mapsHref}
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
