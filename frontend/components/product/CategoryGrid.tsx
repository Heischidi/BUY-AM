'use client';

import { Category } from '@/types';

interface CategoryGridProps {
  categories: Category[];
  activeCategory: string;
  onSelect: (slug: string) => void;
}

const ALL_TILE = { id: 0, name: 'All products', slug: 'all', icon: '✨', active: true };

export default function CategoryGrid({ categories, activeCategory, onSelect }: CategoryGridProps) {
  const tiles = [ALL_TILE, ...categories];

  return (
    <div className="category-grid" id="categoryGrid">
      {tiles.map((cat) => (
        <button
          key={cat.slug}
          className={`category-tile ${activeCategory === cat.slug ? 'active' : ''}`}
          data-category={cat.slug}
          onClick={() => {
            onSelect(cat.slug);
            document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <span className="category-icon">{cat.icon}</span>
          <span className="category-name">{cat.name}</span>
        </button>
      ))}
    </div>
  );
}
