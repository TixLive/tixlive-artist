import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import SectionShell from '@/components/event/sections/SectionShell';
import type { IRule } from '@/types';

interface RulesSectionProps {
	rules: IRule[];
}

export default function RulesSection({ rules }: RulesSectionProps) {
	const { t } = useTranslation('common');
	if (!rules.length) return null;

	const allowed = rules.filter((r) => r.type === 'allowed');
	const forbidden = rules.filter((r) => r.type === 'forbidden');

	return (
		<SectionShell label={t('sections.rules')}>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				{/* Allowed */}
				{allowed.length > 0 && (
					<div className="rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-5">
						<p className="mb-4 flex items-center gap-2 font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[#16A34A]">
							<Icon icon="mdi:check-circle" width={16} />
							{t('rules.allowed')}
						</p>
						<ul className="space-y-3">
							{allowed.map((rule) => (
								<li key={rule.id} className="flex items-start gap-2.5">
									<Icon
										icon="mdi:check"
										width={16}
										className="mt-0.5 shrink-0 text-[#16A34A]"
									/>
									<span className="text-[0.875rem] leading-relaxed text-[var(--theme-text)]">
										{rule.text}
									</span>
								</li>
							))}
						</ul>
					</div>
				)}

				{/* Forbidden */}
				{forbidden.length > 0 && (
					<div className="rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-5">
						<p className="mb-4 flex items-center gap-2 font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[#DC2626]">
							<Icon icon="mdi:close-circle" width={16} />
							{t('rules.not_allowed')}
						</p>
						<ul className="space-y-3">
							{forbidden.map((rule) => (
								<li key={rule.id} className="flex items-start gap-2.5">
									<Icon
										icon="mdi:close"
										width={16}
										className="mt-0.5 shrink-0 text-[#DC2626]"
									/>
									<span className="text-[0.875rem] leading-relaxed text-[var(--theme-text)]">
										{rule.text}
									</span>
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</SectionShell>
	);
}
