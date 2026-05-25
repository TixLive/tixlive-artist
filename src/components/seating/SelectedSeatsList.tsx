import { useTranslation } from 'next-i18next';
import { Icon } from '@iconify/react';

export interface SelectedSeatItem {
	seatId: string;
	tierName: string;
	label: string;
	color: string;
	price: number;
}

interface SelectedSeatsListProps {
	items: SelectedSeatItem[];
	currency: string;
	onRemove: (seatId: string) => void;
}

/**
 * YOUR SEATS — the keyboard- and screen-reader-operable heart of the flow. Every
 * chosen seat is a real list item with a focusable Remove button, so the entire
 * purchase is completable without touching the (aria-hidden) canvas. The canvas is
 * a sighted enhancement for manual override only.
 */
export default function SelectedSeatsList({ items, currency, onRemove }: SelectedSeatsListProps) {
	const { t } = useTranslation('common');

	if (items.length === 0) {
		return (
			/* Empty state — handoff EmptyCart */
			<div className="py-8 text-center">
				<span className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--theme-bg)]">
					<Icon icon="mdi:ticket-confirmation-outline" width={22} className="text-[var(--theme-text-muted)]" />
				</span>
				<p className="font-[family-name:var(--font-display)] text-[0.9375rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)]">
					{t('seating.no_seats_yet')}
				</p>
				<p className="mx-auto mt-1 max-w-[14rem] text-[0.75rem] leading-relaxed text-[var(--theme-text-muted)]">
					{t('seating.canvas_hint')}
				</p>
			</div>
		);
	}

	return (
		<ul className="space-y-2">
			{items.map((item) => (
				<li
					key={item.seatId}
					className="flex items-center gap-3 rounded-xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-bg)] px-3 py-2.5"
				>
					<span
						className="h-9 w-1 shrink-0 rounded-full"
						style={{ backgroundColor: item.color }}
						aria-hidden="true"
					/>
					<div className="min-w-0 flex-1">
						<p className="truncate font-[family-name:var(--font-display)] text-[0.875rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)]">
							{item.tierName}
						</p>
						<p className="font-[family-name:var(--font-data)] text-[0.75rem] tabular-nums text-[var(--theme-text-muted)]">
							{item.label}
						</p>
					</div>
					<div className="shrink-0 text-right">
						<div className="font-[family-name:var(--font-data)] text-[0.8125rem] tabular-nums text-[var(--theme-text)]">{item.price}</div>
						<div className="font-[family-name:var(--font-mono)] text-[0.5625rem] uppercase tracking-[0.1em] text-[var(--theme-text-muted)]">{currency}</div>
					</div>
					<button
						type="button"
						onClick={() => onRemove(item.seatId)}
						aria-label={t('seating.remove_seat', { seat: `${item.tierName} ${item.label}` })}
						className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] text-[var(--theme-text-muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--theme-text)_6%,transparent)] hover:text-[var(--theme-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
					>
						<Icon icon="mdi:close" width={15} />
					</button>
				</li>
			))}
		</ul>
	);
}
