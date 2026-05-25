import type { ReactNode } from 'react';

interface SectionShellProps {
	/** Section heading text (display font). */
	label: string;
	/** Optional right-aligned element (e.g. a price range or a link). */
	rightSlot?: ReactNode;
	/** Optional anchor id for in-page navigation. */
	id?: string;
	children: ReactNode;
}

/**
 * Shared V2 section wrapper: renders the `<section>`, the editorial heading row,
 * and the spacing beneath it. Carries NO outer margin — the event page controls
 * vertical rhythm via a flex-gap column. Every event-type section renders through
 * this so headings stay visually consistent.
 */
export default function SectionShell({ label, rightSlot, id, children }: SectionShellProps) {
	return (
		<section id={id}>
			<div className="mb-5 flex items-baseline justify-between gap-4">
				<h2 className="font-[family-name:var(--font-display)] text-[1.75rem] font-[700] tracking-[-0.02em] text-[var(--theme-text)] sm:text-[2rem]">
					{label}
				</h2>
				{rightSlot}
			</div>
			{children}
		</section>
	);
}
