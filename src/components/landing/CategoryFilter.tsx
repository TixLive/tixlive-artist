import { Chip } from '@heroui/react';

const CATEGORIES = ['All', 'Concert', 'Conference', 'Sports'] as const;
type Category = (typeof CATEGORIES)[number];

interface CategoryFilterProps {
  active: Category;
  onChange: (category: Category) => void;
}

export default function CategoryFilter({ active, onChange }: CategoryFilterProps) {
  return (
    <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md">
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
              className="shrink-0 cursor-pointer text-sm font-medium transition"
              style={
                isActive
                  ? { backgroundColor: 'var(--brand-primary)', color: '#fff', borderColor: 'var(--brand-primary)' }
                  : {}
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
