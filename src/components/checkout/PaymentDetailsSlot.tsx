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
      <div className="rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-5 text-center text-[0.875rem] text-[var(--theme-text-muted)]">
        Card form for {method.name} (coming soon)
      </div>
    );
  }

  return null;
}
