import { useTranslation } from 'next-i18next';
import { ICartItem, IAddonCartItem } from '@/types';
import { computeCheckoutFees } from '@/lib/orderFees';

interface PriceBreakdownProps {
	items: ICartItem[];
	addonItems?: IAddonCartItem[];
	bundleItems?: Array<{ quantity: number; price: number }>;
	totalTicketQty?: number;
	discount?: { percent?: number; amount?: number };
	currency: string;
	platformFeePayer?: 'buyer' | 'organizer';
	providerFeePayer?: 'buyer' | 'organizer';
	platformFeePercent?: number;
	platformFeeFixed?: number;
	providerFeePercent?: number;
	providerFeeFixed?: number;
}

export default function PriceBreakdown({
	items,
	addonItems,
	bundleItems,
	totalTicketQty = 0,
	discount,
	currency,
	platformFeePayer,
	providerFeePayer,
	platformFeePercent = 0,
	platformFeeFixed = 0,
	providerFeePercent = 0,
	providerFeeFixed = 0,
}: PriceBreakdownProps) {
	const { t } = useTranslation('common');
	const ticketSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

	const addonSubtotal = (addonItems ?? []).reduce((sum, addon) => {
		const multiplier = addon.per_ticket ? totalTicketQty : 1;
		return sum + addon.price * addon.quantity * multiplier;
	}, 0);

	const bundleSubtotal = (bundleItems ?? []).reduce((sum, b) => sum + b.price * b.quantity, 0);

	const subtotal = ticketSubtotal + addonSubtotal + bundleSubtotal;

	let discountAmount = 0;
	if (discount?.percent) discountAmount = subtotal * (discount.percent / 100);
	else if (discount?.amount) discountAmount = discount.amount;

	const afterDiscount = Math.max(0, subtotal - discountAmount);

	const { serviceFee } = computeCheckoutFees({
		afterDiscount,
		platformFeePayer,
		providerFeePayer,
		platformFeePercent,
		platformFeeFixed,
		providerFeePercent,
		providerFeeFixed,
	});
	const total = afterDiscount + serviceFee;

	const fmt = (v: number) => v.toFixed(2);

	return (
		<div className="flex flex-col gap-1.5">
			{(ticketSubtotal > 0 || bundleSubtotal === 0) && (
				<div className="flex items-center justify-between text-[13px] text-[var(--ink-3)]">
					<span>{t('price_breakdown.tickets')}</span>
					<span className="tabular-nums">{fmt(ticketSubtotal)} {currency}</span>
				</div>
			)}

			{bundleSubtotal > 0 && (
				<div className="flex items-center justify-between text-[13px] text-[var(--ink-3)]">
					<span>{t('price_breakdown.bundles')}</span>
					<span className="tabular-nums">{fmt(bundleSubtotal)} {currency}</span>
				</div>
			)}

			{addonSubtotal > 0 && (
				<div className="flex items-center justify-between text-[13px] text-[var(--ink-3)]">
					<span>{t('price_breakdown.addons')}</span>
					<span className="tabular-nums">{fmt(addonSubtotal)} {currency}</span>
				</div>
			)}

			{discount && discountAmount > 0 && (
				<div className="flex items-center justify-between text-[13px] font-[700] text-[#3D7B5C]">
					<span>
						{t('price_breakdown.discount')}
						{discount.percent ? ` (${discount.percent}%)` : ''}
					</span>
					<span className="tabular-nums">-{fmt(discountAmount)} {currency}</span>
				</div>
			)}

			{serviceFee > 0 && (
				<div className="flex items-center justify-between text-[13px] text-[var(--ink-3)]">
					<span>{t('price_breakdown.service_fee')}</span>
					<span className="tabular-nums">+{fmt(serviceFee)} {currency}</span>
				</div>
			)}

			<div className="mt-3 flex items-baseline justify-between border-t border-[var(--line)] pt-3.5">
				<span className="text-[10.5px] font-[700] uppercase tracking-[0.12em] text-[var(--ink-3)]">
					{t('price_breakdown.total')}
				</span>
				<span className="text-[24px] font-[800] leading-none tracking-[-0.022em] tabular-nums text-[var(--ink)]">
					{fmt(total)} <span className="text-[12px] font-[700] text-[var(--ink-3)]">{currency}</span>
				</span>
			</div>
		</div>
	);
}
