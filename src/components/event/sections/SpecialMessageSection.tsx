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
			<div className="rounded-[18px] bg-[var(--ink)] p-6 text-white sm:p-7" style={{ boxShadow: 'var(--shadow-2)' }}>
				<div className="mb-3 flex items-center gap-2">
					<Icon icon="mdi:heart" width={16} className="text-white" />
					<span className="text-[11px] font-[700] uppercase tracking-[0.12em] text-white/65">
						{t('sections.special_message')}
					</span>
				</div>
				<p className="m-0 whitespace-pre-line text-[15px] leading-[1.6] text-white">{message}</p>
			</div>
		</section>
	);
}
