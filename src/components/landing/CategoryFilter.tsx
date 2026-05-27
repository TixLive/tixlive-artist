import { Chip } from '@heroui/react';
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
  // Only show "All" + types that actually have events
  const tabs = ['All', ...availableTypes];

  if (tabs.length <= 1) return null;

  return (
    <div
      className="sticky top-16 z-30 border-b border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] backdrop-blur-md"
      style={{ backgroundColor: 'color-mix(in srgb, var(--theme-bg) 92%, transparent)' }}
    >
      <nav
        className="mx-auto flex max-w-[1120px] gap-2 overflow-x-auto px-4 py-3 sm:px-6"
        aria-label={t('landing.categories_label')}
        style={{ scrollbarWidth: 'none' }}
      >
        {tabs.map((cat) => {
          const isActive = cat === active;
          return (
            <Chip
              key={cat}
              as="button"
              variant={isActive ? 'solid' : 'bordered'}
              radius="full"
              className={`h-10 shrink-0 cursor-pointer px-5 font-[family-name:var(--font-body)] text-[0.8125rem] font-[600] transition-all duration-200 ${
                isActive ? 'shadow-[0_4px_12px_color-mix(in_srgb,var(--brand-primary)_28%,transparent)]' : ''
              }`}
              style={
                isActive
                  ? { backgroundColor: 'var(--brand-primary)', color: 'var(--theme-bg)', borderColor: 'var(--brand-primary)' }
                  : {
                      backgroundColor: 'var(--theme-surface)',
                      borderColor: 'color-mix(in srgb, var(--theme-text) 8%, transparent)',
                      color: 'var(--theme-text)',
                    }
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
