import { ICartItem, IAddonCartItem } from '@/types';

interface PriceBreakdownProps {
  items: ICartItem[];
  addonItems?: IAddonCartItem[];
  totalTicketQty?: number;
  discount?: { percent?: number; amount?: number };
  currency: string;
  platformFeePayer?: 'buyer' | 'organizer';
  providerFeePayer?: 'buyer' | 'organizer';
  platformFeePercent?: number;
  platformFeeFixed?: number;
  providerFeePercent?: number;
}

export default function PriceBreakdown({
  items,
  addonItems,
  totalTicketQty = 0,
  discount,
  currency,
  platformFeePayer,
  providerFeePayer,
  platformFeePercent = 0,
  platformFeeFixed = 0,
  providerFeePercent = 0,
}: PriceBreakdownProps) {
  const ticketSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addonSubtotal = (addonItems ?? []).reduce((sum, addon) => {
    const multiplier = addon.per_ticket ? totalTicketQty : 1;
    return sum + addon.price * addon.quantity * multiplier;
  }, 0);

  const subtotal = ticketSubtotal + addonSubtotal;

  let discountAmount = 0;
  if (discount?.percent) {
    discountAmount = ticketSubtotal * (discount.percent / 100);
  } else if (discount?.amount) {
    discountAmount = discount.amount;
  }

  const afterDiscount = Math.max(0, subtotal - discountAmount);

  // Platform fee (tix.live charges organizer, optionally passed to buyer)
  const platformFee = platformFeePayer === 'buyer' && afterDiscount > 0
    ? Math.round((afterDiscount * platformFeePercent / 100 + platformFeeFixed) * 100) / 100
    : 0;

  // Payment provider fee (Stripe, MAIB, etc.)
  const providerFee = providerFeePayer === 'buyer'
    ? Math.round(afterDiscount * providerFeePercent / 100 * 100) / 100
    : 0;

  const serviceFee = platformFee + providerFee;
  const total = afterDiscount + serviceFee;

  const formatPrice = (value: number) => {
    return value.toFixed(2);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-[0.875rem]">
        <span className="text-[var(--theme-text-muted)]">Tickets</span>
        <span className="font-[family-name:var(--font-data)] tabular-nums text-[var(--theme-text-muted)]">
          {formatPrice(ticketSubtotal)} {currency}
        </span>
      </div>

      {addonSubtotal > 0 && (
        <div className="flex items-center justify-between text-[0.875rem]">
          <span className="text-[var(--theme-text-muted)]">Add-ons</span>
          <span className="font-[family-name:var(--font-data)] tabular-nums text-[var(--theme-text-muted)]">
            {formatPrice(addonSubtotal)} {currency}
          </span>
        </div>
      )}

      {discount && discountAmount > 0 && (
        <div className="flex items-center justify-between text-[0.875rem] text-[#16A34A]">
          <span>
            Discount
            {discount.percent ? ` (${discount.percent}%)` : ''}
          </span>
          <span className="font-[family-name:var(--font-data)] tabular-nums">
            -{formatPrice(discountAmount)} {currency}
          </span>
        </div>
      )}

      {serviceFee > 0 && (
        <div className="flex items-center justify-between text-[0.875rem]">
          <span className="text-[var(--theme-text-muted)]">Service fee</span>
          <span className="font-[family-name:var(--font-data)] tabular-nums text-[var(--theme-text-muted)]">
            +{formatPrice(serviceFee)} {currency}
          </span>
        </div>
      )}

      <div className="border-t border-[color-mix(in_srgb,var(--theme-text)_6%,transparent)] pt-3">
        <div className="flex items-center justify-between">
          <span className="font-[family-name:var(--font-display)] text-[1.0625rem] font-[700] text-[var(--theme-text)]">Total</span>
          <span className="font-[family-name:var(--font-data)] text-[1.125rem] font-bold tabular-nums text-[var(--theme-text)]">
            {formatPrice(total)} {currency}
          </span>
        </div>
      </div>
    </div>
  );
}
