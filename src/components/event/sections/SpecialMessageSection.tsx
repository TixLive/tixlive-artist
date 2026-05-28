import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';

interface SpecialMessageSectionProps {
	message: string;
}

export default function SpecialMessageSection({ message }: SpecialMessageSectionProps) {
	const { t } = useTranslation('common');
	if (!message) return null;

	return (
		<section>
			<div className="rounded-[22px] border border-[color-mix(in_srgb,var(--brand-accent)_25%,transparent)] bg-[color-mix(in_srgb,var(--brand-accent)_6%,transparent)] p-6 sm:p-7">
				<div className="mb-3 flex items-center gap-2">
					<Icon icon="mdi:heart" width={18} className="text-[var(--brand-accent)]" />
					<span className="font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[var(--brand-accent)]">
						{t('sections.special_message')}
					</span>
				</div>
				<p className="whitespace-pre-line font-[family-name:var(--font-body)] text-[0.9375rem] leading-relaxed text-[var(--theme-text)]">
					{message}
				</p>
			</div>
		</section>
	);
}
