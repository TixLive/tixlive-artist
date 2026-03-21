import { IAvailablePaymentMethod } from '@/types';

interface PaymentDetailsSlotProps {
  method: IAvailablePaymentMethod;
}

export default function PaymentDetailsSlot({ method }: PaymentDetailsSlotProps) {
  if (method.type === 'redirect') {
    return null;
  }

  if (method.type === 'card') {
    return (
      <div className="rounded-xl border p-4 text-center text-[0.875rem]" style={{ borderColor: 'color-mix(in srgb, var(--theme-text) 15%, transparent)', backgroundColor: 'var(--theme-surface)', color: 'var(--theme-text-muted)' }}>
        Card form for {method.name} (coming soon)
      </div>
    );
  }

  return null;
}
