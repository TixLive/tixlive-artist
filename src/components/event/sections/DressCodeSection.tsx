import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import SectionShell from '@/components/event/sections/SectionShell';

interface DressCodeSectionProps {
	type?: string;
	recommended?: string;
	forbidden?: string;
}

export default function DressCodeSection({ type, recommended, forbidden }: DressCodeSectionProps) {
	const { t } = useTranslation('common');
	if (!type && !recommended && !forbidden) return null;

	return (
		<SectionShell label={t('sections.dress_code')}>
			<div className="rounded-[18px] bg-[var(--surface)] p-5 sm:p-6" style={{ boxShadow: 'var(--shadow-2)' }}>
				{type && (
					<div className="mb-5 flex items-center gap-3">
						<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-2)] text-[var(--ink)]">
							<Icon icon="mdi:hanger" width={18} />
						</span>
						<span className="text-[16px] font-[700] tracking-[-0.012em] text-[var(--ink)]">{type}</span>
					</div>
				)}

				{recommended && (
					<div className="mb-4">
						<p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-[700] uppercase tracking-[0.12em] text-[#3D7B5C]">
							<Icon icon="mdi:check" width={14} />
							{t('dress_code.recommended')}
						</p>
						<p className="text-[13.5px] leading-[1.5] text-[var(--ink-2)]">{recommended}</p>
					</div>
				)}

				{forbidden && (
					<div>
						<p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-[700] uppercase tracking-[0.12em] text-[#C73E3E]">
							<Icon icon="mdi:close" width={14} />
							{t('dress_code.not_allowed')}
						</p>
						<p className="text-[13.5px] leading-[1.5] text-[var(--ink-2)]">{forbidden}</p>
					</div>
				)}
			</div>
		</SectionShell>
	);
}
