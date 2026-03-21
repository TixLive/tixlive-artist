import { ICartItem } from '@/types';

interface PriceBreakdownProps {
  items: ICartItem[];
  discount?: { percent?: number; amount?: number };
  currency: string;
}

export default function PriceBreakdown({ items, discount, currency }: PriceBreakdownProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let discountAmount = 0;
  if (discount?.percent) {
    discountAmount = subtotal * (discount.percent / 100);
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
        <span>Subtotal</span>
        <span>
          {formatPrice(subtotal)} {currency}
        </span>
      </div>

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

      <div className="border-t border-gray-200 pt-2">
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
