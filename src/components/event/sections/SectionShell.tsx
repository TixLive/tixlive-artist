import type { ReactNode } from 'react';

interface SectionShellProps {
	label: string;
	/** Optional sub-heading line displayed under the title (var(--ink-3), 13.5px). */
	sub?: string;
	/** Optional right-aligned element (e.g. a price range or count). */
	rightSlot?: ReactNode;
	id?: string;
	children: ReactNode;
}

/**
 * Section wrapper for event sub-sections. Heading is 22–28px Manrope 800,
 * subhead muted on second line, optional right slot floats baseline-aligned.
 */
export default function SectionShell({ label, sub, rightSlot, id, children }: SectionShellProps) {
	return (
		<section id={id}>
			<div className="mb-[18px] flex flex-wrap items-end justify-between gap-3">
				<div className="flex min-w-0 flex-col gap-0.5">
					<h2
						className="m-0 text-[var(--ink)]"
						style={{
							fontSize: 'clamp(22px, 2.4vw, 28px)',
							fontWeight: 800,
							letterSpacing: '-0.024em',
							lineHeight: 1.15,
						}}
					>
						{label}
					</h2>
					{sub && <span className="text-[13.5px] font-[500] text-[var(--ink-3)]">{sub}</span>}
				</div>
				{rightSlot}
			</div>
			{children}
		</section>
	);
}
