import { useTranslation } from 'next-i18next';
import SectionShell from '@/components/event/sections/SectionShell';
import type { IAgendaItem } from '@/types';

interface ProgramSectionProps {
	items: IAgendaItem[];
}

export default function ProgramSection({ items }: ProgramSectionProps) {
	const { t } = useTranslation('common');
	if (!items.length) return null;

	return (
		<SectionShell label={t('sections.program')}>
			<div className="overflow-hidden rounded-[22px] border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] shadow-[0_1px_2px_rgba(20,19,18,0.04),0_8px_24px_rgba(20,19,18,0.06)]">
				{items.map((item, idx) => (
					<div
						key={item.id}
						className={`flex gap-4 p-4 sm:gap-5 sm:p-5 ${
							idx < items.length - 1
								? 'border-b border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)]'
								: ''
						}`}
					>
						{/* Time */}
						<div className="w-16 shrink-0">
							{item.start_time && (
								<span className="font-[family-name:var(--font-data)] text-[0.8125rem] font-medium tabular-nums text-[var(--brand-accent)]">
									{item.start_time}
								</span>
							)}
						</div>

						{/* Content */}
						<div className="min-w-0 flex-1">
							<p className="font-[family-name:var(--font-display)] text-[1.0625rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)]">
								{item.title}
							</p>
							{item.description && (
								<p className="mt-1.5 text-[0.875rem] leading-relaxed text-[var(--theme-text-muted)]">
									{item.description}
								</p>
							)}
						</div>
					</div>
				))}
			</div>
		</SectionShell>
	);
}
