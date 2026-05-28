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
      <div className="rounded-[22px] border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-6 text-center text-[0.875rem] text-[var(--theme-text-muted)]">
        {t('payment.card_form_coming_soon', { name: method.name })}
      </div>
    );
  }

  return null;
}
