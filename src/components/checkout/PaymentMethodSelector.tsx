import { IAvailablePaymentMethod } from '@/types';

interface PaymentMethodSelectorProps {
  methods: IAvailablePaymentMethod[];
  selected: number;
  onSelect: (id: number) => void;
}

export default function PaymentMethodSelector({ methods, selected, onSelect }: PaymentMethodSelectorProps) {
  // If only one method, auto-selected — render nothing
  if (methods.length <= 1) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-[family-name:var(--font-display)] text-[1.125rem] font-[700] text-[var(--theme-text)]">Payment method</h3>
      <div className="flex flex-wrap gap-3">
        {methods.map((method) => {
          const isSelected = method.id === selected;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelect(method.id)}
              className={`flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-xl border-2 px-4 py-3 font-[family-name:var(--font-body)] text-[0.875rem] font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 ${
                isSelected
                  ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--theme-bg)]'
                  : 'border-[color-mix(in_srgb,var(--theme-text)_12%,transparent)] bg-[var(--theme-bg)] text-[var(--theme-text)] hover:border-[color-mix(in_srgb,var(--theme-text)_25%,transparent)]'
              }`}
            >
              {method.logo_url && (
                <img src={method.logo_url} alt="" className="h-5 w-auto" />
              )}
              <span>{method.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
