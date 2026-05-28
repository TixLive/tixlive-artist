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

export default function SelectedSeatsList({ items, currency, onRemove }: SelectedSeatsListProps) {
	const { t } = useTranslation('common');

	if (items.length === 0) {
		return (
			<div className="py-8 text-center">
				<span className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg-2)]">
					<Icon icon="mdi:ticket-confirmation-outline" width={22} className="text-[var(--ink-3)]" />
				</span>
				<p className="text-[15px] font-[700] tracking-[-0.012em] text-[var(--ink)]">
					{t('seating.no_seats_yet')}
				</p>
				<p className="mx-auto mt-1 max-w-[14rem] text-[12px] leading-[1.5] text-[var(--ink-3)]">
					{t('seating.canvas_hint')}
				</p>
			</div>
		);
	}

	return (
		<ul className="flex flex-col gap-2">
			{items.map((item) => (
				<li
					key={item.seatId}
					className="flex items-center gap-3 rounded-[12px] bg-[var(--bg-2)] px-3 py-2.5"
				>
					<span
						className="h-9 w-1 shrink-0 rounded-full"
						style={{ backgroundColor: item.color }}
						aria-hidden="true"
					/>
					<div className="min-w-0 flex-1">
						<p className="m-0 truncate text-[13.5px] font-[700] tracking-[-0.012em] text-[var(--ink)]">
							{item.tierName}
						</p>
						<p className="m-0 text-[12px] tabular-nums text-[var(--ink-3)]">{item.label}</p>
					</div>
					<div className="shrink-0 text-right leading-tight">
						<div className="text-[13.5px] font-[700] tabular-nums text-[var(--ink)]">{item.price}</div>
						<div className="text-[9.5px] font-[700] uppercase tracking-[0.1em] text-[var(--ink-3)]">{currency}</div>
					</div>
					<button
						type="button"
						onClick={() => onRemove(item.seatId)}
						aria-label={t('seating.remove_seat', { seat: `${item.tierName} ${item.label}` })}
						className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[var(--ink-3)] transition-colors duration-150 hover:bg-[var(--bg-3)] hover:text-[var(--ink)]"
					>
						<Icon icon="mdi:close" width={14} />
					</button>
				</li>
			))}
		</ul>
	);
}
