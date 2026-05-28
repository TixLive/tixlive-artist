import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import SectionShell from '@/components/event/sections/SectionShell';
import type { IFaq } from '@/types';

interface FaqSectionProps {
	items: IFaq[];
}

export default function FaqSection({ items }: FaqSectionProps) {
	const { t } = useTranslation('common');
	const [openId, setOpenId] = useState<number | null>(items[0]?.id ?? null);

	if (!items.length) return null;

	return (
		<SectionShell
			label={t('sections.faq')}
			rightSlot={
				<span className="text-[11px] font-[700] uppercase tracking-[0.14em] text-[var(--ink-3)]">
					{items.length} {items.length === 1 ? t('sections.item_one') : t('sections.item_other')}
				</span>
			}
		>
			<div className="overflow-hidden rounded-[18px] bg-[var(--surface)]" style={{ boxShadow: 'var(--shadow-2)' }}>
				{items.map((faq, i) => {
					const isOpen = openId === faq.id;
					const isLast = i === items.length - 1;
					return (
						<div key={faq.id} className={isLast ? '' : 'border-b border-[var(--line-2)]'}>
							<button
								className="flex w-full items-center justify-between gap-3.5 px-5 py-[18px] text-left"
								onClick={() => setOpenId(isOpen ? null : faq.id)}
								aria-expanded={isOpen}
							>
								<span className="text-[15px] font-[700] tracking-[-0.01em] text-[var(--ink)]">
									{faq.question}
								</span>
								<span
									className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--bg-2)] text-[var(--ink)] transition-transform duration-250"
									style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0)' }}
								>
									<Icon icon="mdi:plus" width={12} />
								</span>
							</button>
							<div
								className="overflow-hidden transition-[max-height] duration-350 ease-out"
								style={{ maxHeight: isOpen ? 240 : 0 }}
							>
								<p className="m-0 px-5 pb-[18px] text-[14px] font-[500] leading-[1.55] text-[var(--ink-3)]">
									{faq.answer}
								</p>
							</div>
						</div>
					);
				})}
			</div>
		</SectionShell>
	);
}
