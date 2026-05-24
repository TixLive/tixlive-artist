import { Chip } from '@heroui/react';

type Category = string;

interface CategoryFilterProps {
  active: Category;
  onChange: (category: Category) => void;
  /** Event types that actually have events; controls which tabs are shown. */
  availableTypes: string[];
}

export default function CategoryFilter({ active, onChange, availableTypes }: CategoryFilterProps) {
  // Only show "All" + types that actually have events
  const tabs = ['All', ...availableTypes];

  if (tabs.length <= 1) return null;

  return (
    <div
      className="sticky top-16 z-30 border-b border-[color-mix(in_srgb,var(--theme-text)_6%,transparent)] backdrop-blur-md"
      style={{ backgroundColor: 'color-mix(in srgb, var(--theme-bg) 92%, transparent)' }}
    >
      <nav
        className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3 sm:px-6"
        aria-label="Event categories"
        style={{ scrollbarWidth: 'none' }}
      >
        {tabs.map((cat) => {
          const isActive = cat === active;
          return (
            <Chip
              key={cat}
              as="button"
              variant={isActive ? 'solid' : 'bordered'}
              className="h-9 shrink-0 cursor-pointer px-4 font-[family-name:var(--font-body)] text-[0.8125rem] font-medium transition-colors duration-200"
              style={
                isActive
                  ? { backgroundColor: 'var(--brand-primary)', color: 'var(--theme-bg)', borderColor: 'var(--brand-primary)' }
                  : { borderColor: 'color-mix(in srgb, var(--theme-text) 15%, transparent)', color: 'var(--theme-text)' }
              }
              onClick={() => onChange(cat)}
            >
              {cat}
            </Chip>
          );
        })}
      </nav>
    </div>
  );
}

export type { Category };
