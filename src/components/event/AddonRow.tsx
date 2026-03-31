import { Icon } from '@iconify/react';
import type { ITicketAddon } from '@/types';

interface AddonRowProps {
	addon: ITicketAddon;
	quantity: number;
	onQuantityChange: (addonId: number, quantity: number) => void;
}

export default function AddonRow({ addon, quantity, onQuantityChange }: AddonRowProps) {
	const maxQty = addon.max_quantity ?? 99;

	return (
		<div
			className="flex items-center gap-3 rounded-xl border border-[color-mix(in_srgb,var(--theme-text)_10%,transparent)] px-4 py-3"
			style={{ backgroundColor: 'var(--theme-surface)' }}
		>
			<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--brand-primary)_12%,transparent)]">
				<Icon icon="mdi:plus-box" width={18} className="text-[var(--brand-primary)]" />
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-1.5">
					<span className="text-[0.875rem] font-medium text-[var(--theme-text)]">
						{addon.name}
					</span>
					{addon.per_ticket && (
						<span className="rounded-full bg-[color-mix(in_srgb,var(--brand-primary)_12%,transparent)] px-1.5 py-0.5 text-[0.625rem] font-medium text-[var(--brand-primary)]">
							per ticket
						</span>
					)}
				</div>
				{addon.description && (
					<p className="text-[0.6875rem] text-[var(--theme-text-muted)]">{addon.description}</p>
				)}
			</div>
			<span className="shrink-0 font-[family-name:var(--font-data)] text-[0.875rem] font-semibold tabular-nums text-[var(--theme-text)]">
				+{addon.price} {/* currency comes from parent context */}
			</span>
			<div
				className="inline-flex items-center rounded-lg border border-[color-mix(in_srgb,var(--theme-text)_15%,transparent)]"
				role="group"
				aria-label={`Quantity for ${addon.name}`}
			>
				<button
					className="flex h-9 w-9 items-center justify-center transition disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-offset-2"
					style={{ color: 'var(--theme-text-muted)' }}
					onClick={() => onQuantityChange(addon.id, Math.max(0, quantity - 1))}
					disabled={quantity === 0}
					aria-label={`Decrease quantity for ${addon.name}`}
				>
					<Icon icon="mdi:minus" width={18} />
				</button>
				<span className="min-w-[28px] text-center text-[0.8125rem] font-semibold tabular-nums text-[var(--theme-text)]">
					{quantity}
				</span>
				<button
					className="flex h-9 w-9 items-center justify-center transition disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-offset-2"
					style={{ color: 'var(--theme-text-muted)' }}
					onClick={() => onQuantityChange(addon.id, Math.min(maxQty, quantity + 1))}
					disabled={quantity >= maxQty}
					aria-label={`Increase quantity for ${addon.name}`}
				>
					<Icon icon="mdi:plus" width={18} />
				</button>
			</div>
		</div>
	);
}
