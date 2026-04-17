'use client'

import { Category } from '@/lib/types'

interface CategoryTabsProps {
  categories: Category[]
  activeCategory: string | null
  onSelect: (categoryId: string | null) => void
}

export function CategoryTabs({ categories, activeCategory, onSelect }: CategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 px-1">
      {/* All tab */}
      <button
        onClick={() => onSelect(null)}
        className={`btn-press shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
          activeCategory === null
            ? 'bg-accent text-white shadow-lg shadow-accent/25'
            : 'bg-surface-hover text-muted hover:text-foreground'
        }`}
      >
        <span>🏷️</span>
        <span>Tất cả</span>
      </button>

      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`btn-press shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            activeCategory === cat.id
              ? 'text-white shadow-lg'
              : 'bg-surface-hover text-muted hover:text-foreground'
          }`}
          style={
            activeCategory === cat.id
              ? { backgroundColor: cat.color, boxShadow: `0 4px 14px ${cat.color}40` }
              : undefined
          }
        >
          <span>{cat.icon}</span>
          <span>{cat.name}</span>
        </button>
      ))}
    </div>
  )
}
