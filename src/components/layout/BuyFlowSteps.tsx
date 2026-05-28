import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';

interface BuyFlowStepsProps {
	/** 1 = choose seats, 2 = details & payment, 3 = your ticket. */
	currentStep: 1 | 2 | 3;
}

/**
 * The buy-tickets progress bar (handoff "Pasul 1/2/3"). Rendered by Layout as a
 * sticky sub-bar under the header on the seats → checkout → success flow. Pure
 * presentation, no state.
 */
export default function BuyFlowSteps({ currentStep }: BuyFlowStepsProps) {
	const { t } = useTranslation('common');
	const STEPS = [
		{ n: 1, label: t('buy_flow.choose_seats') },
		{ n: 2, label: t('buy_flow.details_payment') },
		{ n: 3, label: t('buy_flow.your_ticket') },
	] as const;
	return (
		<div className="sticky top-16 z-30 border-b border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-bg)]/95 backdrop-blur-md">
			<div className="mx-auto flex max-w-[1440px] items-center justify-center px-4 py-3 sm:px-6">
				<ol className="flex items-center gap-2 sm:gap-3">
					{STEPS.map((step, i) => {
						const done = step.n < currentStep;
						const active = step.n === currentStep;
						return (
							<li key={step.n} className="flex items-center gap-2 sm:gap-3">
								<div className={`flex items-center gap-2 ${active || done ? 'opacity-100' : 'opacity-55'}`}>
									<span
										className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-display)] text-[0.6875rem] font-[700] ${
											done
												? 'text-white'
												: active
													? 'bg-[var(--brand-primary)] text-[var(--theme-bg)]'
													: 'border border-[color-mix(in_srgb,var(--theme-text)_18%,transparent)] text-[var(--theme-text-muted)]'
										}`}
										style={done ? { backgroundColor: 'var(--brand-accent)' } : undefined}
									>
										{done ? <Icon icon="mdi:check" width={12} /> : step.n}
									</span>
									<span
										className={`font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.12em] ${
											active ? 'inline text-[var(--theme-text)]' : 'hidden text-[var(--theme-text-muted)] sm:inline'
										}`}
									>
										{step.label}
									</span>
								</div>
								{i < STEPS.length - 1 && (
									<span className="h-px w-5 bg-[color-mix(in_srgb,var(--theme-text)_14%,transparent)] sm:w-7" />
								)}
							</li>
						);
					})}
				</ol>
			</div>
		</div>
	);
}
