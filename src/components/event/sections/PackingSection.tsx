import { Icon } from '@iconify/react';
import type { IPackingItem } from '@/types';

interface PackingSectionProps {
	items: IPackingItem[];
}

export default function PackingSection({ items }: PackingSectionProps) {
	if (!items.length) return null;

	const essential = items.filter((i) => i.type === 'essential');
	const recommended = items.filter((i) => i.type === 'recommended');

	return (
		<section className="mt-10">
			<h2 className="mb-4 font-[family-name:var(--font-display)] text-[1.5rem] font-[700] text-[var(--theme-text)]">
				What to Bring
			</h2>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				{essential.length > 0 && (
					<div className="rounded-2xl bg-[var(--theme-surface)] p-4">
						<p className="mb-3 flex items-center gap-2 text-[0.75rem] font-semibold uppercase tracking-wider text-[var(--brand-accent)]">
							<Icon icon="mdi:alert-circle" width={18} />
							Essential
						</p>
						<ul className="space-y-2">
							{essential.map((item) => (
								<li key={item.id} className="flex items-start gap-2">
									<Icon
										icon="mdi:checkbox-marked-circle"
										width={16}
										className="mt-0.5 shrink-0 text-[var(--brand-accent)]"
									/>
									<span className="text-[0.8125rem] text-[var(--theme-text)]">
										{item.text}
									</span>
								</li>
							))}
						</ul>
					</div>
				)}

				{recommended.length > 0 && (
					<div className="rounded-2xl bg-[var(--theme-surface)] p-4">
						<p className="mb-3 flex items-center gap-2 text-[0.75rem] font-semibold uppercase tracking-wider text-[var(--theme-text-muted)]">
							<Icon icon="mdi:plus-circle" width={18} />
							Recommended
						</p>
						<ul className="space-y-2">
							{recommended.map((item) => (
								<li key={item.id} className="flex items-start gap-2">
									<Icon
										icon="mdi:circle-outline"
										width={16}
										className="mt-0.5 shrink-0 text-[var(--theme-text-muted)]"
									/>
									<span className="text-[0.8125rem] text-[var(--theme-text)]">
										{item.text}
									</span>
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</section>
	);
}
