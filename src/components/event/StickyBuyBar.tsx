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
    <>
      {/* Mobile sticky bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-100 bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.75rem] text-gray-500">
              {totalQuantity} {totalQuantity === 1 ? 'ticket' : 'tickets'}
            </p>
            <p className="text-[1.125rem] font-bold text-gray-900">
              {totalPrice} {currency}
            </p>
          </div>
          <Button
            variant="solid"
            size="lg"
            className="rounded-full font-semibold text-white"
            style={{ backgroundColor: 'var(--brand-primary)' }}
            onPress={onBuy}
          >
            Buy Tickets
            <Icon icon="mdi:arrow-right" className="ml-1" width={20} />
          </Button>
        </div>
      </div>

      {/* Desktop inline summary */}
      <div className="mt-6 hidden rounded-xl border border-gray-100 bg-gray-50 p-4 md:block">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[0.875rem] text-gray-500">
              {totalQuantity} {totalQuantity === 1 ? 'ticket' : 'tickets'}
            </p>
            <p className="text-[1.5rem] font-bold text-gray-900">
              {totalPrice} {currency}
            </p>
          </div>
        </div>
        <Button
          variant="solid"
          size="lg"
          className="mt-3 w-full rounded-full font-semibold text-white"
          style={{ backgroundColor: 'var(--brand-primary)' }}
          onPress={onBuy}
        >
          Buy Tickets
          <Icon icon="mdi:arrow-right" className="ml-1" width={20} />
        </Button>
      </div>
    </>
  );
}
