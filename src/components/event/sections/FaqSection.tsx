import { useState } from 'react';
import { Icon } from '@iconify/react';
import type { IFaq } from '@/types';

interface FaqSectionProps {
	items: IFaq[];
}

export default function FaqSection({ items }: FaqSectionProps) {
	const [openId, setOpenId] = useState<number | null>(null);

	if (!items.length) return null;

	return (
		<section className="mt-8">
			<h2 className="mb-4 font-[family-name:var(--font-display)] text-[1.5rem] font-semibold text-[var(--theme-text)]">
				FAQ
			</h2>
			<div className="divide-y divide-[color-mix(in_srgb,var(--theme-text)_10%,transparent)] rounded-xl border border-[color-mix(in_srgb,var(--theme-text)_10%,transparent)]">
				{items.map((faq) => {
					const isOpen = openId === faq.id;
					return (
						<div key={faq.id}>
							<button
								className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--theme-surface)] focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-inset"
								onClick={() => setOpenId(isOpen ? null : faq.id)}
								aria-expanded={isOpen}
							>
								<span className="font-[family-name:var(--font-body)] text-[0.875rem] font-medium text-[var(--theme-text)]">
									{faq.question}
								</span>
								<Icon
									icon="mdi:chevron-down"
									width={20}
									className={`shrink-0 text-[var(--theme-text-muted)] transition-transform duration-200 ${
										isOpen ? 'rotate-180' : ''
									}`}
								/>
							</button>
							{isOpen && (
								<div className="px-4 pb-4">
									<p className="text-[0.8125rem] leading-relaxed text-[var(--theme-text-muted)]">
										{faq.answer}
									</p>
								</div>
							)}
						</div>
					);
				})}
			</div>
		</section>
	);
}
