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
			<div className="rounded-[22px] border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-5 sm:p-6">
				{type && (
					<div className="mb-5 flex items-center gap-3">
						<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--brand-accent)_6%,transparent)]">
							<Icon icon="mdi:hanger" width={20} className="text-[var(--brand-accent)]" />
						</span>
						<span className="font-[family-name:var(--font-display)] text-[1.0625rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)]">
							{type}
						</span>
					</div>
				)}

				{recommended && (
					<div className="mb-4">
						<p className="mb-1.5 flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[#16A34A]">
							<Icon icon="mdi:check" width={14} />
							{t('dress_code.recommended')}
						</p>
						<p className="text-[0.875rem] leading-relaxed text-[var(--theme-text-muted)]">
							{recommended}
						</p>
					</div>
				)}

				{forbidden && (
					<div>
						<p className="mb-1.5 flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[#DC2626]">
							<Icon icon="mdi:close" width={14} />
							{t('dress_code.not_allowed')}
						</p>
						<p className="text-[0.875rem] leading-relaxed text-[var(--theme-text-muted)]">
							{forbidden}
						</p>
					</div>
				)}
			</div>
		</SectionShell>
	);
}
