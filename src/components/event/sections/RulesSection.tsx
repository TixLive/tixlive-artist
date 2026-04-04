import { Icon } from '@iconify/react';
import type { IRule } from '@/types';

interface RulesSectionProps {
	rules: IRule[];
}

export default function RulesSection({ rules }: RulesSectionProps) {
	if (!rules.length) return null;

	const allowed = rules.filter((r) => r.type === 'allowed');
	const forbidden = rules.filter((r) => r.type === 'forbidden');

	return (
		<section className="mt-10">
			<h2 className="mb-4 font-[family-name:var(--font-display)] text-[1.5rem] font-[700] text-[var(--theme-text)]">
				Rules
			</h2>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				{/* Allowed */}
				{allowed.length > 0 && (
					<div className="rounded-2xl bg-[var(--theme-surface)] p-4">
						<p className="mb-3 flex items-center gap-2 text-[0.75rem] font-semibold uppercase tracking-wider text-emerald-600">
							<Icon icon="mdi:check-circle" width={18} />
							Allowed
						</p>
						<ul className="space-y-2">
							{allowed.map((rule) => (
								<li key={rule.id} className="flex items-start gap-2">
									<Icon
										icon="mdi:check"
										width={16}
										className="mt-0.5 shrink-0 text-emerald-500"
									/>
									<span className="text-[0.8125rem] text-[var(--theme-text)]">
										{rule.text}
									</span>
								</li>
							))}
						</ul>
					</div>
				)}

				{/* Forbidden */}
				{forbidden.length > 0 && (
					<div className="rounded-2xl bg-[var(--theme-surface)] p-4">
						<p className="mb-3 flex items-center gap-2 text-[0.75rem] font-semibold uppercase tracking-wider text-red-500">
							<Icon icon="mdi:close-circle" width={18} />
							Not Allowed
						</p>
						<ul className="space-y-2">
							{forbidden.map((rule) => (
								<li key={rule.id} className="flex items-start gap-2">
									<Icon
										icon="mdi:close"
										width={16}
										className="mt-0.5 shrink-0 text-red-500"
									/>
									<span className="text-[0.8125rem] text-[var(--theme-text)]">
										{rule.text}
									</span>
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</section>
	);
}
