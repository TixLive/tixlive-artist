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
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center text-[0.875rem] text-gray-500">
        Card form for {method.name} (coming soon)
      </div>
    );
  }

  return null;
}
