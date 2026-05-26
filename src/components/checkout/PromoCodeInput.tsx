import { useState } from 'react';
import { Button, Input } from '@heroui/react';
import { Icon } from '@iconify/react';
import { directValidatePromo } from '@/lib/directApi';

interface PromoCodeInputProps {
  eventId: number;
  onApply: (discount: { percent?: number; amount?: number }, code: string) => void;
  onRemove: () => void;
}

export default function PromoCodeInput({ eventId, onApply, onRemove }: PromoCodeInputProps) {
  const [expanded, setExpanded] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [applied, setApplied] = useState(false);

  const handleApply = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await directValidatePromo(eventId, code.trim());
      if (response.valid) {
        setApplied(true);
        onApply({
          percent: response.discount_percent,
          amount: response.discount_amount,
        }, code.trim());
      } else {
        setError(response.error ?? 'Invalid promo code');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
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
      <Button
        variant="light"
        onPress={() => setExpanded(true)}
        className="px-0 font-[family-name:var(--font-body)] text-[0.875rem] font-[600] text-[var(--brand-accent)] underline underline-offset-2"
      >
        Have a discount code?
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={code}
          onValueChange={(val) => {
            setCode(val);
            if (error) setError('');
          }}
          placeholder="Enter promo code"
          isReadOnly={applied}
          classNames={{ inputWrapper: 'rounded-full' }}
          size="sm"
          endContent={
            applied ? (
              <Icon icon="mdi:check-circle" className="text-[#16A34A]" width={20} />
            ) : undefined
          }
        />
        {!applied ? (
          <Button
            type="button"
            variant="solid"
            className="shrink-0 rounded-full font-[family-name:var(--font-body)] font-[700] text-[var(--theme-bg)]"
            style={{ backgroundColor: 'var(--brand-primary)' }}
            onPress={handleApply}
            isLoading={loading}
            isDisabled={!code.trim()}
          >
            Apply
          </Button>
        ) : (
          <Button
            type="button"
            variant="light"
            className="shrink-0 text-[#DC2626]"
            onPress={handleRemove}
          >
            Remove
          </Button>
        )}
      </div>
      {error && <p className="text-[0.75rem] text-[#DC2626]">{error}</p>}
      {applied && (
        <p className="text-[0.75rem] text-[#16A34A]">
          <Icon icon="mdi:check" className="mr-1 inline" width={14} />
          Promo code applied!
        </p>
      )}
    </div>
  );
}
