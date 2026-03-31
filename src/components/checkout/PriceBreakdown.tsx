import { ICartItem, IAddonCartItem } from '@/types';

interface PriceBreakdownProps {
  items: ICartItem[];
  addonItems?: IAddonCartItem[];
  totalTicketQty?: number;
  discount?: { percent?: number; amount?: number };
  currency: string;
}

export default function PriceBreakdown({ items, addonItems, totalTicketQty = 0, discount, currency }: PriceBreakdownProps) {
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

  const total = Math.max(0, subtotal - discountAmount);

  const formatPrice = (value: number) => {
    return value.toFixed(2);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[0.875rem]" style={{ color: 'var(--theme-text-muted)' }}>
        <span>Tickets</span>
        <span>
          {formatPrice(ticketSubtotal)} {currency}
        </span>
      </div>

      {addonSubtotal > 0 && (
        <div className="flex items-center justify-between text-[0.875rem]" style={{ color: 'var(--theme-text-muted)' }}>
          <span>Add-ons</span>
          <span>
            {formatPrice(addonSubtotal)} {currency}
          </span>
        </div>
      )}

      {discount && discountAmount > 0 && (
        <div className="flex items-center justify-between text-[0.875rem] text-green-600">
          <span>
            Discount
            {discount.percent ? ` (${discount.percent}%)` : ''}
          </span>
          <span>
            -{formatPrice(discountAmount)} {currency}
          </span>
        </div>
      )}

      <div className="border-t pt-2" style={{ borderColor: 'color-mix(in srgb, var(--theme-text) 15%, transparent)' }}>
        <div className="flex items-center justify-between">
          <span className="text-[1.125rem] font-semibold" style={{ color: 'var(--theme-text)' }}>Total</span>
          <span className="text-[1.125rem] font-bold" style={{ color: 'var(--theme-text)' }}>
            {formatPrice(total)} {currency}
          </span>
        </div>
      </div>
    </div>
  );
}
