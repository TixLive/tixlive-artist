import { useTranslation } from 'next-i18next';
import { IAvailablePaymentMethod } from '@/types';

interface PaymentDetailsSlotProps {
  method: IAvailablePaymentMethod;
}

export default function PaymentDetailsSlot({ method }: PaymentDetailsSlotProps) {
  const { t } = useTranslation('common');
  if (method.type === 'redirect') {
    return null;
  }

  if (method.type === 'card') {
    return (
      <div className="rounded-[18px] bg-[var(--surface)] p-6 text-center text-[14px] text-[var(--ink-3)]" style={{ boxShadow: 'var(--shadow-1)' }}>
        {t('payment.card_form_coming_soon', { name: method.name })}
      </div>
    );
  }

  return null;
}
