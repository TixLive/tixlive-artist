import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { ICartItem } from '@/types';

interface StickyBuyBarProps {
  cartItems: ICartItem[];
  currency: string;
  onBuy: () => void;
  ctaLabel?: string;
  isSeated?: boolean;
  salesOpen?: boolean;
}

export default function StickyBuyBar({ cartItems, currency, onBuy, ctaLabel, isSeated, salesOpen }: StickyBuyBarProps) {
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (totalQuantity === 0 && !(isSeated && salesOpen)) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 bg-[var(--brand-primary)] px-4 py-3 text-[var(--theme-bg)] shadow-[0_-4px_24px_rgba(20,19,18,0.18)] md:hidden"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] opacity-65">
            {totalQuantity > 0 ? `${totalQuantity} ${totalQuantity === 1 ? 'ticket' : 'tickets'}` : 'Tickets'}
          </p>
          <p className="font-[family-name:var(--font-display)] text-[1.25rem] font-[700] tracking-[-0.01em] tabular-nums">
            {totalQuantity > 0 ? `${totalPrice} ${currency}` : 'Bilete'}
          </p>
        </div>
        <Button
          variant="solid"
          size="lg"
          className="shrink-0 rounded-full bg-[var(--brand-accent)] font-[family-name:var(--font-body)] font-[700] text-white"
          onPress={onBuy}
        >
          {ctaLabel ?? 'Checkout'}
          <Icon icon="mdi:arrow-right" className="ml-1" width={20} />
        </Button>
      </div>
    </div>
  );
}
