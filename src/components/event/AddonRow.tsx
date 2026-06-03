import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import type { ITicketAddon } from '@/types';

interface AddonRowProps {
	addon: ITicketAddon;
	quantity: number;
	max: number;
	onQuantityChange: (addonId: number, quantity: number) => void;
	/** Units of this add-on already covered by selected bundle(s). Shown as a locked
	 *  baseline in the count — the buyer can only add MORE on top, not remove these. */
	included?: number;
}

export default function AddonRow({ addon, quantity, max, onQuantityChange, included = 0 }: AddonRowProps) {
	const { t } = useTranslation('common');
	const displayedQuantity = included + quantity;
	const isActive = displayedQuantity > 0;

	return (
		<div
			className="flex items-center justify-between gap-3 rounded-[16px] bg-[var(--surface)] p-4 transition-shadow duration-200"
			style={{
				boxShadow: isActive ? '0 0 0 1.5px var(--ink), var(--shadow-2)' : 'var(--shadow-1)',
			}}
		>
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
					<span className="text-[15px] font-[700] tracking-[-0.012em] text-[var(--ink)]">{addon.name}</span>
					<span className="text-[11.5px] font-[700] tracking-[0.02em] text-[var(--ink-3)]">
						+{addon.price} · {addon.per_ticket ? t('addon.per_ticket') : t('addon.one_off')}
					</span>
				</div>
				{addon.description && (
					<p className="mt-1 text-[13px] leading-[1.5] text-[var(--ink-3)]">{addon.description}</p>
				)}
				{included > 0 && (
					<p className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-[700] tracking-[0.01em] text-[var(--ink-2)]">
						<Icon icon="mdi:check-circle" width={13} className="shrink-0 text-[var(--ink-3)]" />
						{t('addon.included_in_bundle', { count: included })}
					</p>
				)}
			</div>

			<div
				className="inline-flex h-9 shrink-0 items-stretch rounded-full bg-[var(--bg-2)] p-0.5"
				role="group"
				aria-label={t('addon.qty_for', { name: addon.name })}
			>
				<button
					className="flex w-9 items-center justify-center rounded-full text-[var(--ink)] transition-colors duration-150 hover:bg-[var(--bg-3)] disabled:opacity-30"
					onClick={() => onQuantityChange(addon.id, Math.max(0, quantity - 1))}
					disabled={quantity === 0}
					aria-label={t('addon.decrease', { name: addon.name })}
				>
					<Icon icon="mdi:minus" width={14} />
				</button>
				<span
					className={`flex min-w-8 items-center justify-center rounded-full px-1 text-[14px] font-[700] tabular-nums transition-colors duration-150 ${
						isActive ? 'bg-[var(--ink)] text-white' : 'text-[var(--ink)]'
					}`}
				>
					{displayedQuantity}
				</span>
				<button
					className="flex w-9 items-center justify-center rounded-full text-[var(--ink)] transition-colors duration-150 hover:bg-[var(--bg-3)] disabled:opacity-30"
					onClick={() => onQuantityChange(addon.id, Math.min(max, quantity + 1))}
					disabled={quantity >= max}
					aria-label={t('addon.increase', { name: addon.name })}
				>
					<Icon icon="mdi:plus" width={14} />
				</button>
			</div>
		</div>
	);
}
