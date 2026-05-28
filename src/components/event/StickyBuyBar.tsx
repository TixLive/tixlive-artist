import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import { ICartItem } from '@/types';

interface StickyBuyBarProps {
	cartItems: ICartItem[];
	currency: string;
	onBuy: () => void;
	ctaLabel?: string;
	isSeated?: boolean;
	salesOpen?: boolean;
}

/**
 * Mobile sticky CTA bar. Solid black background, eyebrow + price on the left,
 * white CTA pill on the right. Reserves bottom inset via env(safe-area-inset).
 */
export default function StickyBuyBar({ cartItems, currency, onBuy, ctaLabel, isSeated, salesOpen }: StickyBuyBarProps) {
	const { t } = useTranslation('common');
	const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
	const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

	if (totalQuantity === 0 && !(isSeated && salesOpen)) return null;

	return (
		<div
			className="fixed inset-x-0 bottom-0 z-50 bg-[var(--ink)] px-4 py-3 text-white md:hidden"
			style={{
				boxShadow: '0 -8px 28px -8px rgba(0,0,0,0.25)',
				paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
			}}
		>
			<div className="flex items-center justify-between gap-3">
				<div className="min-w-0">
					<p className="text-[10px] font-[700] uppercase tracking-[0.12em] text-white/55">
						{totalQuantity > 0 ? `${totalQuantity} ${t('event.ticket_count', { count: totalQuantity })}` : t('event.tickets')}
					</p>
					<p className="text-[16px] font-[700] leading-tight tracking-[-0.008em] tabular-nums text-white">
						{totalQuantity > 0 ? `${totalPrice} ${currency}` : t('event.tickets')}
					</p>
				</div>
				<button
					onClick={onBuy}
					className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-[600] tracking-[-0.005em] text-[var(--ink)] transition-transform duration-150 hover:scale-[1.03]"
				>
					{ctaLabel ?? t('event.checkout')}
					<Icon icon="mdi:arrow-right" width={13} />
				</button>
			</div>
		</div>
	);
}
