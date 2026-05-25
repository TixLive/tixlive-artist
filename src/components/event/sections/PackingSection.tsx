import { Icon } from '@iconify/react';
import SectionShell from '@/components/event/sections/SectionShell';
import type { IPackingItem } from '@/types';

interface PackingSectionProps {
	items: IPackingItem[];
}

export default function PackingSection({ items }: PackingSectionProps) {
	if (!items.length) return null;

	const essential = items.filter((i) => i.type === 'essential');
	const recommended = items.filter((i) => i.type === 'recommended');

	return (
		<SectionShell label="What to Bring">
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				{essential.length > 0 && (
					<div className="rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-5">
						<p className="mb-4 flex items-center gap-2 font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[#D97706]">
							<Icon icon="mdi:alert-circle" width={14} />
							Essential
						</p>
						<ul className="space-y-3">
							{essential.map((item) => (
								<li key={item.id} className="flex items-start gap-2.5">
									<Icon
										icon="mdi:checkbox-marked-circle"
										width={16}
										className="mt-0.5 shrink-0 text-[var(--brand-accent)]"
									/>
									<span className="text-[0.875rem] leading-relaxed text-[var(--theme-text)]">
										{item.text}
									</span>
								</li>
							))}
						</ul>
					</div>
				)}

				{recommended.length > 0 && (
					<div className="rounded-2xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-5">
						<p className="mb-4 flex items-center gap-2 font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[color-mix(in_srgb,var(--theme-text)_45%,transparent)]">
							<Icon icon="mdi:plus-circle" width={14} />
							Recommended
						</p>
						<ul className="space-y-3">
							{recommended.map((item) => (
								<li key={item.id} className="flex items-start gap-2.5">
									<Icon
										icon="mdi:circle-outline"
										width={16}
										className="mt-0.5 shrink-0 text-[color-mix(in_srgb,var(--theme-text)_45%,transparent)]"
									/>
									<span className="text-[0.875rem] leading-relaxed text-[var(--theme-text)]">
										{item.text}
									</span>
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</SectionShell>
	);
}
