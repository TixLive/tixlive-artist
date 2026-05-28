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
	const [openId, setOpenId] = useState<number | null>(null);

	if (!items.length) return null;

	return (
		<SectionShell label={t('sections.faq')}>
			<div className="space-y-3">
				{items.map((faq) => {
					const isOpen = openId === faq.id;
					return (
						<div
							key={faq.id}
							className="overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)]"
						>
							<button
								className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--theme-text)_4%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] focus-visible:ring-inset"
								onClick={() => setOpenId(isOpen ? null : faq.id)}
								aria-expanded={isOpen}
							>
								<span className="font-[family-name:var(--font-display)] text-[1.0625rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)]">
									{faq.question}
								</span>
								<span
									className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
										isOpen
											? 'bg-[var(--brand-accent)] text-[var(--theme-bg)]'
											: 'bg-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] text-[var(--theme-text-muted)]'
									}`}
								>
									<Icon
										icon="mdi:chevron-down"
										width={18}
										className={`transition-transform duration-200 ${
											isOpen ? 'rotate-180' : ''
										}`}
									/>
								</span>
							</button>
							{isOpen && (
								<div className="px-5 pb-5">
									<p className="text-[0.875rem] leading-relaxed text-[var(--theme-text-muted)]">
										{faq.answer}
									</p>
								</div>
							)}
						</div>
					);
				})}
			</div>
		</SectionShell>
	);
}
