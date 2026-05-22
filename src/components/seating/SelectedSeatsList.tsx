import { useTranslation } from 'next-i18next';
import { Icon } from '@iconify/react';

export interface SelectedSeatItem {
	seatId: string;
	tierName: string;
	label: string;
	color: string;
}

interface SelectedSeatsListProps {
	items: SelectedSeatItem[];
	onRemove: (seatId: string) => void;
}

/**
 * YOUR SEATS — the keyboard- and screen-reader-operable heart of the flow. Every
 * chosen seat is a real list item with a focusable Remove button, so the entire
 * purchase is completable without touching the (aria-hidden) canvas. The canvas is
 * a sighted enhancement for manual override only.
 */
export default function SelectedSeatsList({ items, onRemove }: SelectedSeatsListProps) {
	const { t } = useTranslation('common');

	return (
		<div>
			<h3 className="mb-3 font-[family-name:var(--font-display)] text-[0.8125rem] font-[700] uppercase tracking-[0.06em] text-[var(--theme-text-muted)]">
				{t('seating.your_seats')}
			</h3>

			{items.length === 0 ? (
				<p className="text-[0.8125rem] text-[var(--theme-text-muted)]">{t('seating.no_seats_yet')}</p>
			) : (
				<ul className="space-y-2">
					{items.map((item) => (
						<li
							key={item.seatId}
							className="flex items-center gap-3 rounded-xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-bg)] px-3 py-2"
						>
							<span
								className="h-2.5 w-2.5 shrink-0 rounded-full"
								style={{ backgroundColor: item.color }}
								aria-hidden="true"
							/>
							<div className="min-w-0 flex-1">
								<p className="truncate text-[0.8125rem] font-medium text-[var(--theme-text)]">{item.tierName}</p>
							</div>
							<span className="shrink-0 font-[family-name:var(--font-data)] text-[0.8125rem] font-semibold tabular-nums text-[var(--theme-text)]">
								{item.label}
							</span>
							<button
								type="button"
								onClick={() => onRemove(item.seatId)}
								aria-label={t('seating.remove_seat', { seat: `${item.tierName} ${item.label}` })}
								className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--theme-text-muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--theme-text)_6%,transparent)] hover:text-[var(--theme-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
							>
								<Icon icon="mdi:close" width={18} />
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
