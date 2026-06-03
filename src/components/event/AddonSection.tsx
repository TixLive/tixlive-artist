import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import AddonRow from './AddonRow';
import type { ITicketAddon } from '@/types';

interface AddonSectionProps {
	addons: ITicketAddon[];
	quantities: Record<number, number>;
	/** Total tickets/seats selected — caps per_ticket add-ons and drives their price multiplier. */
	ticketCount: number;
	onQuantityChange: (addonId: number, quantity: number) => void;
	/** Hide the "Enhance Your Experience" heading + note (e.g. when a modal already titles it). */
	showHeader?: boolean;
}

/**
 * "Enhance Your Experience" add-on picker. Shared by the GA event page and the
 * seat-selection flow so both surfaces stay visually and behaviourally identical.
 */
export default function AddonSection({
	addons,
	quantities,
	ticketCount,
	onQuantityChange,
	showHeader = true,
}: AddonSectionProps) {
	const { t } = useTranslation('common');
	if (addons.length === 0 || ticketCount === 0) return null;

	return (
		<div>
			{showHeader && (
				<>
					<div className="flex items-center gap-2">
						<Icon icon="mdi:auto-awesome" width={18} className="text-[var(--brand-accent)]" />
						<h3 className="font-[family-name:var(--font-display)] text-[1.25rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)]">
							{t('event.enhance_experience')}
						</h3>
					</div>
					<p className="mt-1 text-[0.75rem] text-[var(--theme-text-muted)]">{t('event.addon_per_ticket_note')}</p>
				</>
			)}
			<div className={`flex flex-col gap-2.5 ${showHeader ? 'mt-3' : ''}`}>
				{addons.map((addon) => (
					<AddonRow
						key={addon.id}
						addon={addon}
						quantity={quantities[addon.id] ?? 0}
						max={addon.per_ticket ? ticketCount : addon.max_quantity ?? 4}
						onQuantityChange={onQuantityChange}
					/>
				))}
			</div>
		</div>
	);
}
