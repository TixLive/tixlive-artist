import { useTranslation } from 'next-i18next';
import { Icon } from '@iconify/react';
import { IAvailablePaymentMethod } from '@/types';

interface PaymentMethodSelectorProps {
	methods: IAvailablePaymentMethod[];
	selected: number;
	onSelect: (id: number) => void;
}

export default function PaymentMethodSelector({ methods, selected, onSelect }: PaymentMethodSelectorProps) {
	const { t } = useTranslation('common');
	if (methods.length <= 1) return null;

	return (
		<div className="flex flex-col gap-3">
			<header>
				<h3 className="text-[16px] font-[700] tracking-[-0.012em] text-[var(--ink)]">
					{t('checkout.payment_method_title')}
				</h3>
				<p className="mt-1 flex items-center gap-1.5 text-[12px] text-[var(--ink-3)]">
					<Icon icon="mdi:shield-check-outline" width={13} />
					{t('checkout.payment_method_subtitle')}
				</p>
			</header>
			<div className="flex flex-col gap-2">
				{methods.map((method) => {
					const isSelected = method.id === selected;
					return (
						<button
							key={method.id}
							type="button"
							onClick={() => onSelect(method.id)}
							className="flex w-full items-center gap-3 rounded-[14px] bg-[var(--surface)] px-4 py-3.5 text-left transition-shadow duration-150"
							style={{
								boxShadow: isSelected
									? '0 0 0 1.5px var(--ink), var(--shadow-1)'
									: 'inset 0 0 0 1px var(--line)',
							}}
						>
							<span
								className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full"
								style={{
									boxShadow: isSelected
										? 'inset 0 0 0 2px var(--ink)'
										: 'inset 0 0 0 2px var(--line)',
								}}
							>
								{isSelected && <span className="h-2 w-2 rounded-full bg-[var(--ink)]" />}
							</span>
							<span className="flex-1 text-[14px] font-[700] tracking-[-0.012em] text-[var(--ink)]">
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
		</div>
	);
}
