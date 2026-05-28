import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import SectionShell from '@/components/event/sections/SectionShell';
import type { IRule } from '@/types';

interface RulesSectionProps {
	rules: IRule[];
}

function RuleCard({ variant, title, items }: { variant: 'ok' | 'no'; title: string; items: IRule[] }) {
	const ok = variant === 'ok';
	const accent = ok ? '#3D7B5C' : '#C73E3E';
	const accentBg = ok ? 'rgba(61, 123, 92, 0.12)' : 'rgba(199, 62, 62, 0.10)';
	return (
		<div className="rounded-[18px] bg-[var(--surface)] p-5" style={{ boxShadow: 'var(--shadow-2)' }}>
			<div className="mb-3.5 flex items-center gap-2.5">
				<span
					className="flex h-7 w-7 items-center justify-center rounded-[9px]"
					style={{ background: accentBg, color: accent }}
				>
					<Icon icon={ok ? 'mdi:check' : 'mdi:close'} width={14} />
				</span>
				<span className="text-[15px] font-[800] tracking-[-0.012em] text-[var(--ink)]">{title}</span>
			</div>
			<ul className="m-0 flex list-none flex-col gap-2.5 p-0">
				{items.map((rule) => (
					<li key={rule.id} className="flex items-start gap-2.5 text-[13.5px] leading-[1.45] text-[var(--ink-2)]">
						<span
							className="mt-[5px] inline-block h-1.5 w-1.5 shrink-0 rounded-full"
							style={{ background: accent }}
						/>
						<span>{rule.text}</span>
					</li>
				))}
			</ul>
		</div>
	);
}

export default function RulesSection({ rules }: RulesSectionProps) {
	const { t } = useTranslation('common');
	if (!rules.length) return null;

	const allowed = rules.filter((r) => r.type === 'allowed');
	const forbidden = rules.filter((r) => r.type === 'forbidden');

	return (
		<SectionShell label={t('sections.rules')} sub={t('sections.rules_sub')}>
			<div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
				{allowed.length > 0 && <RuleCard variant="ok" title={t('rules.allowed')} items={allowed} />}
				{forbidden.length > 0 && <RuleCard variant="no" title={t('rules.not_allowed')} items={forbidden} />}
			</div>
		</SectionShell>
	);
}
