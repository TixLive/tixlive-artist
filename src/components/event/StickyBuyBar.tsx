import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { ICartItem } from '@/types';

interface StickyBuyBarProps {
  cartItems: ICartItem[];
  currency: string;
  onBuy: () => void;
}

export default function StickyBuyBar({ cartItems, currency, onBuy }: StickyBuyBarProps) {
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (totalQuantity === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[color-mix(in_srgb,var(--theme-text)_10%,transparent)] bg-[var(--theme-bg)]/90 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-xl md:hidden"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.75rem] text-[var(--theme-text-muted)]">
            {totalQuantity} {totalQuantity === 1 ? 'ticket' : 'tickets'}
          </p>
          <p className="font-[family-name:var(--font-data)] text-[1.125rem] font-bold tabular-nums text-[var(--theme-text)]">
            {totalPrice} {currency}
          </p>
        </div>
        <Button
          variant="solid"
          size="lg"
          className="rounded-xl font-[family-name:var(--font-display)] font-semibold text-white"
          style={{ backgroundColor: 'var(--brand-primary)' }}
          onPress={onBuy}
        >
          Checkout
          <Icon icon="mdi:arrow-right" className="ml-1" width={20} />
        </Button>
      </div>
    </div>
  );
}
