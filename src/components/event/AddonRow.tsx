import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import type { ITicketAddon } from '@/types';

interface AddonRowProps {
	addon: ITicketAddon;
	quantity: number;
	/** Upper bound for this addon (per-ticket addons cap at the ticket count). */
	max: number;
	onQuantityChange: (addonId: number, quantity: number) => void;
}

/**
 * V2 addon card with a pill stepper. Quantity flows through to checkout, which
 * already multiplies per-ticket addons by the cart's ticket count.
 */
export default function AddonRow({ addon, quantity, max, onQuantityChange }: AddonRowProps) {
	const { t } = useTranslation('common');
	const isActive = quantity > 0;

	return (
		<div
			className={`flex items-center justify-between gap-3 rounded-2xl border p-4 transition-colors duration-200 ${
				isActive
					? 'border-[color-mix(in_srgb,var(--brand-accent)_25%,transparent)] bg-[color-mix(in_srgb,var(--brand-accent)_6%,transparent)]'
					: 'border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)]'
			}`}
		>
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
					<span className="font-[family-name:var(--font-display)] text-[0.9375rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)]">
						{addon.name}
					</span>
					<span className="font-[family-name:var(--font-mono)] text-[0.6875rem] tracking-[0.03em] text-[var(--theme-text-muted)]">
						+{addon.price} · {addon.per_ticket ? t('addon.per_ticket') : t('addon.one_off')}
					</span>
				</div>
				{addon.description && (
					<p className="mt-1 text-[0.8125rem] leading-relaxed text-[var(--theme-text-muted)]">
						{addon.description}
					</p>
				)}
			</div>

			<div
				className="inline-flex h-9 shrink-0 items-stretch rounded-full border border-[color-mix(in_srgb,var(--theme-text)_10%,transparent)] bg-[var(--theme-bg)] p-0.5"
				role="group"
				aria-label={t('addon.qty_for', { name: addon.name })}
			>
				<button
					className="flex w-8 items-center justify-center rounded-full text-[var(--theme-text-muted)] transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--theme-text)_5%,transparent)] disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
					onClick={() => onQuantityChange(addon.id, Math.max(0, quantity - 1))}
					disabled={quantity === 0}
					aria-label={t('addon.decrease', { name: addon.name })}
				>
					<Icon icon="mdi:minus" width={16} />
				</button>
				<span
					className={`flex min-w-8 items-center justify-center rounded-full px-1 font-[family-name:var(--font-data)] text-[0.875rem] font-[700] tabular-nums transition-colors duration-200 ${
						isActive ? 'bg-[var(--brand-accent)] text-white' : 'text-[var(--theme-text)]'
					}`}
				>
					{quantity}
				</span>
				<button
					className="flex w-8 items-center justify-center rounded-full text-[var(--theme-text)] transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--theme-text)_5%,transparent)] disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
					onClick={() => onQuantityChange(addon.id, Math.min(max, quantity + 1))}
					disabled={quantity >= max}
					aria-label={t('addon.increase', { name: addon.name })}
				>
					<Icon icon="mdi:plus" width={16} />
				</button>
			</div>
		</div>
	);
}
