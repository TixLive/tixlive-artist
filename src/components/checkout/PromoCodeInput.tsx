import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import { useValidatePromo } from '@/queries/promo/useValidatePromo';

interface PromoCodeInputProps {
  eventId: number;
  onApply: (discount: { percent?: number; amount?: number }, code: string) => void;
  onRemove: () => void;
}

export default function PromoCodeInput({ eventId, onApply, onRemove }: PromoCodeInputProps) {
  const { t } = useTranslation('common');
  const [expanded, setExpanded] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [applied, setApplied] = useState(false);
  const validatePromo = useValidatePromo();
  const loading = validatePromo.isPending;

  const handleApply = async () => {
    if (!code.trim()) return;
    setError('');
    try {
      const response = await validatePromo.mutateAsync({ eventId, code: code.trim() });
      if (response.valid) {
        setApplied(true);
        onApply({
          percent: response.discount_percent,
          amount: response.discount_amount,
        }, code.trim());
      } else {
        setError(response.error ?? t('checkout.promo_invalid'));
      }
    } catch {
      setError(t('checkout.error_generic'));
    }
  };

  const handleRemove = () => {
    setCode('');
    setApplied(false);
    setError('');
    onRemove();
  };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="group flex w-full items-center gap-3 text-left transition-opacity duration-200 hover:opacity-90"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--theme-bg)] text-[var(--theme-text-muted)] transition-colors duration-200 group-hover:text-[var(--brand-accent)]">
          <Icon icon="mdi:tag-outline" width={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-[family-name:var(--font-display)] text-[0.9375rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)]">
            {t('checkout.have_discount_code')}
          </span>
          <span className="mt-0.5 block text-[0.75rem] text-[var(--theme-text-muted)]">
            {t('checkout.promo_subtitle')}
          </span>
        </span>
        <Icon icon="mdi:chevron-right" width={18} className="shrink-0 text-[var(--theme-text-muted)]" />
      </button>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--theme-text)_10%,transparent)] bg-[var(--theme-bg)] p-1.5 focus-within:border-[color-mix(in_srgb,var(--brand-accent)_50%,transparent)]">
        <span className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center text-[var(--theme-text-muted)]">
          <Icon icon="mdi:tag-outline" width={18} />
        </span>
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (error) setError('');
          }}
          placeholder={t('checkout.promo_placeholder')}
          readOnly={applied}
          className="h-9 min-w-0 flex-1 bg-transparent px-1 font-[family-name:var(--font-body)] text-[0.9375rem] font-[500] text-[var(--theme-text)] placeholder:text-[var(--theme-text-muted)] focus:outline-none"
          autoFocus
        />
        {applied ? (
          <button
            type="button"
            onClick={handleRemove}
            className="h-9 shrink-0 rounded-full px-4 font-[family-name:var(--font-body)] text-[0.8125rem] font-[600] text-[var(--theme-text-muted)] transition-colors duration-200 hover:text-[#DC2626]"
          >
            {t('checkout.promo_remove')}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleApply}
            disabled={loading || !code.trim()}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[var(--brand-primary)] px-5 font-[family-name:var(--font-body)] text-[0.8125rem] font-[700] text-[var(--theme-bg)] transition-opacity duration-200 hover:opacity-90 disabled:opacity-40"
          >
            {loading ? (
              <Icon icon="mdi:loading" width={16} className="animate-spin" />
            ) : (
              t('checkout.apply')
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="flex items-center gap-1.5 px-2 text-[0.75rem] text-[#DC2626]">
          <Icon icon="mdi:alert-circle-outline" width={14} />
          {error}
        </p>
      )}
      {applied && (
        <p className="flex items-center gap-1.5 px-2 text-[0.75rem] font-[500] text-[#16A34A]">
          <Icon icon="mdi:check-circle" width={14} />
          {t('checkout.promo_applied')}
        </p>
      )}
    </div>
  );
}
