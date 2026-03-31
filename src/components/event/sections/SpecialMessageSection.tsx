import { Icon } from '@iconify/react';

interface SpecialMessageSectionProps {
	message: string;
}

export default function SpecialMessageSection({ message }: SpecialMessageSectionProps) {
	if (!message) return null;

	return (
		<section className="mt-8">
			<div className="rounded-xl border border-[color-mix(in_srgb,var(--brand-primary)_30%,transparent)] bg-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)] p-5">
				<div className="mb-2 flex items-center gap-2">
					<Icon icon="mdi:heart" width={20} className="text-[var(--brand-primary)]" />
					<span className="font-[family-name:var(--font-display)] text-[0.875rem] font-semibold text-[var(--brand-primary)]">
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
