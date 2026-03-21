import { Chip } from '@heroui/react';

const CATEGORIES = ['All', 'Concert', 'Conference', 'Sports'] as const;
type Category = (typeof CATEGORIES)[number];

interface CategoryFilterProps {
  active: Category;
  onChange: (category: Category) => void;
}

export default function CategoryFilter({ active, onChange }: CategoryFilterProps) {
  return (
    <div
      className="sticky top-0 z-30 backdrop-blur-md"
      style={{ backgroundColor: 'color-mix(in srgb, var(--theme-bg) 90%, transparent)' }}
    >
      <nav
        className="flex gap-2 overflow-x-auto px-4 py-3 sm:px-6"
        aria-label="Event categories"
        style={{ scrollbarWidth: 'none' }}
      >
        {CATEGORIES.map((cat) => {
          const isActive = cat === active;
          return (
            <Chip
              key={cat}
              as="button"
              variant={isActive ? 'solid' : 'bordered'}
              className="h-10 shrink-0 cursor-pointer px-4 text-sm font-medium transition"
              style={
                isActive
                  ? { backgroundColor: 'var(--brand-primary)', color: '#fff', borderColor: 'var(--brand-primary)' }
                  : { borderColor: 'color-mix(in srgb, var(--theme-text) 20%, transparent)', color: 'var(--theme-text)' }
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
