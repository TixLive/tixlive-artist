import { useTranslation } from 'next-i18next';

type Category = string;

interface CategoryFilterProps {
	active: Category;
	onChange: (category: Category) => void;
	/** Event types that actually have events; controls which tabs are shown. */
	availableTypes: string[];
}

export default function CategoryFilter({ active, onChange, availableTypes }: CategoryFilterProps) {
	const { t } = useTranslation('common');
	const tabs = ['All', ...availableTypes];

	if (tabs.length <= 1) return null;

	return (
		<div className="mx-auto max-w-[1200px] px-4 pb-5 pt-10 sm:px-5 md:px-8">
			<nav
				className="flex gap-2 overflow-x-auto"
				aria-label={t('landing.categories_label')}
				style={{ scrollbarWidth: 'none' }}
			>
				{tabs.map((cat) => {
					const isActive = cat === active;
					return (
						<button
							key={cat}
							onClick={() => onChange(cat)}
							className={`shrink-0 rounded-full px-[22px] py-[11px] text-[14px] font-[600] tracking-[-0.008em] transition-colors duration-150 ${
								isActive
									? 'bg-[var(--ink)] text-white'
									: 'bg-[var(--bg-2)] text-[var(--ink)] hover:bg-[var(--bg-3)]'
							}`}
						>
							{cat === 'All' ? t('landing.category_all') : cat}
						</button>
					);
				})}
			</nav>
		</div>
	);
}

export type { Category };
