import { Icon } from '@iconify/react';

interface SpecialMessageSectionProps {
	message: string;
}

export default function SpecialMessageSection({ message }: SpecialMessageSectionProps) {
	if (!message) return null;

	return (
		<section className="mt-10">
			<div className="rounded-2xl border border-[color-mix(in_srgb,var(--brand-accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--brand-accent)_8%,transparent)] p-5">
				<div className="mb-2 flex items-center gap-2">
					<Icon icon="mdi:heart" width={20} className="text-[var(--brand-accent)]" />
					<span className="font-[family-name:var(--font-display)] text-[0.875rem] font-[700] text-[var(--brand-accent)]">
						A Special Message
					</span>
				</div>
				<p className="whitespace-pre-line text-[0.875rem] leading-relaxed text-[var(--theme-text)]">
					{message}
				</p>
			</div>
		</section>
	);
}
