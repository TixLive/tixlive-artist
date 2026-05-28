import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import { useValidatePromo } from '@/queries/promo/useValidatePromo';

interface PromoCodeInputProps {
	eventId: number;
	onApply: (discount: { percent?: number; amount?: number }, code: string) => void;
	onRemove: () => void;
}

/**
 * Three states: collapsed (dashed pill button), input (mono input + ink Apply
 * pill), applied (green pill with check + remove link).
 */
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
				onApply(
					{ percent: response.discount_percent, amount: response.discount_amount },
					code.trim(),
				);
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

	if (applied) {
		return (
			<div
				className="flex items-center justify-between gap-3 rounded-full px-3 py-2"
				style={{
					background: 'rgba(61, 123, 92, 0.08)',
					border: '1px solid rgba(61, 123, 92, 0.25)',
				}}
			>
				<div className="flex min-w-0 items-center gap-2.5">
					<span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3D7B5C] text-white">
						<Icon icon="mdi:check" width={12} />
					</span>
					<span className="truncate text-[13px] font-[700] tracking-[-0.005em] text-[#2A5A42]">
						{t('checkout.promo_applied')}
					</span>
				</div>
				<button
					type="button"
					onClick={handleRemove}
					className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-[700] tracking-[0.04em] text-[var(--ink-3)] transition-colors duration-150 hover:bg-white/60"
				>
					{t('checkout.promo_remove').toUpperCase()}
				</button>
			</div>
		);
	}

	if (!expanded) {
		return (
			<button
				type="button"
				onClick={() => setExpanded(true)}
				className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-[var(--line)] px-4 py-2.5 text-[13px] font-[600] tracking-[-0.005em] text-[var(--ink-2)] transition-colors duration-150 hover:border-[var(--ink-3)] hover:bg-[var(--bg-2)]"
			>
				<Icon icon="mdi:tag-outline" width={13} /> {t('checkout.have_discount_code')}
			</button>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<div className="flex h-10 items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface)] p-1 focus-within:border-[var(--ink)]">
				<span className="ml-2.5 inline-flex shrink-0 items-center text-[var(--ink-4)]">
					<Icon icon="mdi:tag-outline" width={13} />
				</span>
				<input
					type="text"
					value={code}
					onChange={(e) => {
						setCode(e.target.value);
						if (error) setError('');
					}}
					placeholder={t('checkout.promo_placeholder')}
					className="min-w-0 flex-1 bg-transparent px-1 font-mono text-[13.5px] font-[600] uppercase tracking-[0.02em] text-[var(--ink)] placeholder:font-mono placeholder:font-[500] placeholder:tracking-[0.06em] placeholder:text-[var(--ink-4)] focus:outline-none"
					style={{ fontFamily: 'var(--font-mono)' }}
					autoFocus
				/>
				<button
					type="button"
					onClick={handleApply}
					disabled={loading || !code.trim()}
					className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-[var(--ink)] px-4 text-[12.5px] font-[700] tracking-[-0.005em] text-white transition-colors duration-150 hover:bg-[var(--ink-2)] disabled:bg-[var(--bg-2)] disabled:text-[var(--ink-4)]"
				>
					{loading ? <Icon icon="mdi:loading" width={14} className="animate-spin" /> : t('checkout.apply')}
				</button>
			</div>
			{error && (
				<p className="flex items-center gap-1.5 px-2 text-[12px] text-[#DC2626]">
					<Icon icon="mdi:alert-circle-outline" width={13} />
					{error}
				</p>
			)}
		</div>
	);
}
