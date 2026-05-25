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
      <h3 className="font-[family-name:var(--font-display)] text-[1.125rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)]">Payment method</h3>
      {methods.map((method) => {
        const isSelected = method.id === selected;
        return (
          <button
            key={method.id}
            type="button"
            onClick={() => onSelect(method.id)}
            className={`flex w-full items-center gap-3.5 rounded-2xl border px-4 py-3.5 text-left transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] ${
              isSelected
                ? 'border-[color-mix(in_srgb,var(--brand-accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--brand-accent)_6%,transparent)]'
                : 'border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] hover:border-[color-mix(in_srgb,var(--theme-text)_18%,transparent)]'
            }`}
          >
            <span
              className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${
                isSelected ? 'border-[var(--brand-accent)]' : 'border-[color-mix(in_srgb,var(--theme-text)_25%,transparent)]'
              }`}
            >
              {isSelected && <span className="h-2 w-2 rounded-full bg-[var(--brand-accent)]" />}
            </span>
            <span className="flex-1 font-[family-name:var(--font-display)] text-[0.9375rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)]">
              {method.name}
            </span>
            {method.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={method.logo_url} alt="" className="h-5 w-auto shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
}
