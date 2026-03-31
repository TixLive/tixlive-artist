import type { IAgendaItem } from '@/types';

interface ProgramSectionProps {
	items: IAgendaItem[];
}

export default function ProgramSection({ items }: ProgramSectionProps) {
	if (!items.length) return null;

	return (
		<section className="mt-8">
			<h2 className="mb-4 font-[family-name:var(--font-display)] text-[1.5rem] font-semibold text-[var(--theme-text)]">
				Program
			</h2>
			<div className="relative space-y-0">
				{items.map((item, idx) => (
					<div key={item.id} className="relative flex gap-4 pb-4 last:pb-0">
						{/* Timeline line */}
						<div className="flex w-14 shrink-0 flex-col items-center">
							{item.start_time && (
								<span className="font-[family-name:var(--font-data)] text-[0.8125rem] font-medium tabular-nums text-[var(--brand-primary)]">
									{item.start_time}
								</span>
							)}
							{/* Dot */}
							<div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--brand-primary)]" />
							{/* Connecting line */}
							{idx < items.length - 1 && (
								<div className="w-px flex-1 bg-[color-mix(in_srgb,var(--brand-primary)_25%,transparent)]" />
							)}
						</div>

						{/* Content */}
						<div className="min-w-0 flex-1 pb-2">
							<p className="font-[family-name:var(--font-display)] text-[0.9375rem] font-semibold text-[var(--theme-text)]">
								{item.title}
							</p>
							{item.description && (
								<p className="mt-1 text-[0.8125rem] leading-relaxed text-[var(--theme-text-muted)]">
									{item.description}
								</p>
							)}
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
