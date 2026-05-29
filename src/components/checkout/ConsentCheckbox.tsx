import { ReactNode } from 'react';

interface ConsentCheckboxProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
	onBlur?: () => void;
	error?: string;
	children: ReactNode;
}

/** Pill checkbox used for the checkout consent rows (email confirmation, terms). */
export default function ConsentCheckbox({ checked, onChange, onBlur, error, children }: ConsentCheckboxProps) {
	return (
		<div className="space-y-1.5">
			<label className="flex items-start gap-2.5 rounded-[12px] bg-[var(--bg-2)] px-3 py-2.5 text-[12.5px] leading-[1.45] text-[var(--ink-2)]">
				<input
					type="checkbox"
					checked={checked}
					onChange={(e) => onChange(e.target.checked)}
					onBlur={onBlur}
					className="mt-0.5 shrink-0 accent-[var(--ink)]"
				/>
				<span className="flex-1">{children}</span>
			</label>
			{error && <p className="px-2 text-[12px] text-[#DC2626]">{error}</p>}
		</div>
	);
}
