import { Icon } from '@iconify/react';
import type { ITicketAddon } from '@/types';

interface AddonRowProps {
	addon: ITicketAddon;
	quantity: number;
	onQuantityChange: (addonId: number, quantity: number) => void;
}

const ADDON_ICONS: Record<string, string> = {
	parking: 'mdi:car',
	vip: 'mdi:star',
	upgrade: 'mdi:arrow-up-circle',
	skip: 'mdi:flash',
	meet: 'mdi:account-star',
	shirt: 'mdi:tshirt-crew',
	food: 'mdi:food',
	meal: 'mdi:food',
	drink: 'mdi:glass-cocktail',
	merch: 'mdi:shopping',
};

function getAddonIcon(name: string): string {
	const lower = name.toLowerCase();
	for (const [key, icon] of Object.entries(ADDON_ICONS)) {
		if (lower.includes(key)) return icon;
	}
	return 'mdi:plus-circle';
}

export default function AddonRow({ addon, quantity, onQuantityChange }: AddonRowProps) {
	const isActive = quantity > 0;

	const handleToggle = () => {
		if (isActive) {
			onQuantityChange(addon.id, 0);
		} else {
			onQuantityChange(addon.id, 1);
		}
	};

	return (
		<div
			className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 transition-all duration-200 ${
				isActive
					? 'border-[var(--brand-accent)] bg-[color-mix(in_srgb,var(--brand-accent)_3%,var(--theme-bg))]'
					: 'border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-bg)]'
			}`}
		>
			{/* Icon */}
			<div
				className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-200 ${
					isActive
						? 'bg-[color-mix(in_srgb,var(--brand-accent)_12%,transparent)]'
						: 'bg-[var(--theme-surface)]'
				}`}
			>
				<Icon
					icon={getAddonIcon(addon.name)}
					width={20}
					className={isActive ? 'text-[var(--brand-accent)]' : 'text-[var(--theme-text-muted)]'}
				/>
			</div>

			{/* Info */}
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-1.5">
					<span className="font-[family-name:var(--font-display)] text-[0.875rem] font-[700] text-[var(--theme-text)]">
						{addon.name}
					</span>
					{addon.per_ticket && (
						<span className="rounded-md bg-[var(--theme-surface)] px-1.5 py-0.5 font-[family-name:var(--font-data)] text-[0.625rem] font-medium text-[var(--theme-text-muted)]">
							per ticket
						</span>
					)}
				</div>
				{addon.description && (
					<p className="text-[0.6875rem] leading-relaxed text-[var(--theme-text-muted)]">
						{addon.description}
					</p>
				)}
			</div>

			{/* Price */}
			<span className="shrink-0 font-[family-name:var(--font-data)] text-[0.875rem] font-bold tabular-nums text-[var(--theme-text)]">
				+{addon.price}
			</span>

			{/* Toggle switch */}
			<button
				onClick={handleToggle}
				className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] focus-visible:ring-offset-2 ${
					isActive
						? 'bg-[var(--brand-accent)]'
						: 'bg-[color-mix(in_srgb,var(--theme-text)_15%,transparent)]'
				}`}
				role="switch"
				aria-checked={isActive}
				aria-label={`Toggle ${addon.name}`}
			>
				<span
					className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
						isActive ? 'translate-x-[22px]' : 'translate-x-0.5'
					}`}
				/>
			</button>
		</div>
	);
}
