import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import type { IBundle } from '@/types';

interface BundleRowProps {
	bundle: IBundle;
	quantity: number;
	/** Upper bound: remaining_capacity (or a sane default when unlimited). */
	max: number;
	/** Pre-resolved "2× PROMOTOR" labels for the bundle's included items. */
	itemLabels: string[];
	currency: string;
	onQuantityChange: (bundleId: number, quantity: number) => void;
}

/**
 * Pachet (fixed-price bundle) card. A bundle buys a predefined set of tickets
 * (+ add-ons) for one price; seats are auto-allocated server-side at checkout.
 */
export default function BundleRow({ bundle, quantity, max, itemLabels, currency, onQuantityChange }: BundleRowProps) {
	const { t } = useTranslation('common');
	const isActive = quantity > 0;
	const soldOut = max <= 0;
	const lowStock = bundle.remaining_capacity != null && bundle.remaining_capacity > 0 && bundle.remaining_capacity <= 10;

	return (
		<div
			className={`rounded-2xl border p-4 transition-colors duration-200 ${
				isActive
					? 'border-[color-mix(in_srgb,var(--brand-accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--brand-accent)_7%,transparent)]'
					: 'border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)]'
			} ${soldOut ? 'opacity-55' : ''}`}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
						<Icon icon="solar:bag-smile-bold" width={18} className="shrink-0 text-[var(--brand-accent)]" />
						<span className="font-[family-name:var(--font-display)] text-[1.0625rem] font-[800] tracking-[-0.01em] text-[var(--theme-text)]">
							{bundle.name}
						</span>
					</div>
					{bundle.description && (
						<p className="mt-1 text-[0.8125rem] leading-relaxed text-[var(--theme-text-muted)]">{bundle.description}</p>
					)}
				</div>
				<div className="shrink-0 text-right">
					<div className="font-[family-name:var(--font-data)] text-[1.125rem] font-[700] tabular-nums text-[var(--theme-text)]">
						{bundle.price} <span className="text-[0.75rem] font-[500]">{currency}</span>
					</div>
					{lowStock && (
						<div className="mt-0.5 font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.1em] text-[var(--brand-accent)]">
							{t('bundle.remaining', { count: bundle.remaining_capacity ?? 0 })}
						</div>
					)}
				</div>
			</div>

			{itemLabels.length > 0 && (
				<ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
					{itemLabels.map((label, i) => (
						<li key={i} className="flex items-center gap-1.5 text-[0.8125rem] text-[var(--theme-text)]">
							<Icon icon="mdi:check-circle" width={14} className="shrink-0 text-[var(--brand-accent)]" />
							{label}
						</li>
					))}
				</ul>
			)}

			<div className="mt-3 flex items-center justify-between">
				<span className="font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.1em] text-[var(--theme-text-muted)]">
					{soldOut ? t('bundle.sold_out') : t('bundle.seats_auto')}
				</span>
				<div
					className="inline-flex h-9 shrink-0 items-stretch rounded-full border border-[color-mix(in_srgb,var(--theme-text)_10%,transparent)] bg-[var(--theme-bg)] p-0.5"
					role="group"
					aria-label={t('bundle.qty_for', { name: bundle.name })}
				>
					<button
						className="flex w-8 items-center justify-center rounded-full text-[var(--theme-text-muted)] transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--theme-text)_5%,transparent)] disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
						onClick={() => onQuantityChange(bundle.id, Math.max(0, quantity - 1))}
						disabled={quantity === 0}
						aria-label={t('bundle.decrease', { name: bundle.name })}
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
						onClick={() => onQuantityChange(bundle.id, Math.min(max, quantity + 1))}
						disabled={quantity >= max}
						aria-label={t('bundle.increase', { name: bundle.name })}
					>
						<Icon icon="mdi:plus" width={16} />
					</button>
				</div>
			</div>
		</div>
	);
}
