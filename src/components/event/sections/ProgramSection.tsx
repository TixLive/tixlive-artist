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
		<SectionShell label={t('sections.program')} sub={t('sections.program_sub')}>
			<div className="rounded-[18px] bg-[var(--surface)] p-1.5" style={{ boxShadow: 'var(--shadow-2)' }}>
				{items.map((item, idx) => {
					const isLast = idx === items.length - 1;
					return (
						<div
							key={item.id}
							className="grid items-center gap-4 px-[18px] py-[14px]"
							style={{
								gridTemplateColumns: '88px 1fr',
								borderBottom: isLast ? 'none' : '1px solid var(--line-2)',
							}}
						>
							<span className="text-[15px] font-[800] tracking-[-0.012em] tabular-nums text-[var(--ink)]">
								{item.start_time ?? '—'}
							</span>
							<div className="min-w-0">
								<span className="text-[14px] font-[600] tracking-[-0.005em] text-[var(--ink-2)]">
									{item.title}
								</span>
								{item.description && (
									<p className="mt-1 text-[13px] leading-[1.5] text-[var(--ink-3)]">
										{item.description}
									</p>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</SectionShell>
	);
}
