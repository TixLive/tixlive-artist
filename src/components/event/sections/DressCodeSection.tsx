import { Icon } from '@iconify/react';

interface DressCodeSectionProps {
	type?: string;
	recommended?: string;
	forbidden?: string;
}

export default function DressCodeSection({ type, recommended, forbidden }: DressCodeSectionProps) {
	if (!type && !recommended && !forbidden) return null;

	return (
		<section className="mt-8">
			<h2 className="mb-4 font-[family-name:var(--font-display)] text-[1.5rem] font-semibold text-[var(--theme-text)]">
				Dress Code
			</h2>
			<div className="rounded-xl bg-[var(--theme-surface)] p-4">
				{type && (
					<div className="mb-3 flex items-center gap-2">
						<Icon icon="mdi:hanger" width={20} className="text-[var(--brand-primary)]" />
						<span className="font-[family-name:var(--font-display)] text-[0.9375rem] font-semibold text-[var(--theme-text)]">
							{type}
						</span>
					</div>
				)}

				{recommended && (
					<div className="mb-3">
						<p className="mb-1 flex items-center gap-1.5 text-[0.75rem] font-medium uppercase tracking-wider text-emerald-600">
							<Icon icon="mdi:check" width={14} />
							Recommended
						</p>
						<p className="text-[0.8125rem] leading-relaxed text-[var(--theme-text-muted)]">
							{recommended}
						</p>
					</div>
				)}

				{forbidden && (
					<div>
						<p className="mb-1 flex items-center gap-1.5 text-[0.75rem] font-medium uppercase tracking-wider text-red-500">
							<Icon icon="mdi:close" width={14} />
							Not Allowed
						</p>
						<p className="text-[0.8125rem] leading-relaxed text-[var(--theme-text-muted)]">
							{forbidden}
						</p>
					</div>
				)}
			</div>
		</section>
	);
}
