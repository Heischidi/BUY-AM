'use client';

import { Category } from '@/types';
import { motion, useReducedMotion } from 'motion/react';

interface CategoryGridProps {
  categories: Category[];
  activeCategory: string;
  onSelect: (slug: string) => void;
}

const ALL_TILE = { id: 0, name: 'All products', slug: 'all', icon: '✨', active: true };

export default function CategoryGrid({ categories, activeCategory, onSelect }: CategoryGridProps) {
  const tiles = [ALL_TILE, ...categories];
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="category-grid" id="categoryGrid">
      {tiles.map((cat) => {
        const isActive = activeCategory === cat.slug;

        return (
          <motion.button
            key={cat.slug}
            className={`category-tile ${isActive ? 'active' : ''}`}
            data-category={cat.slug}
            onClick={() => {
              onSelect(cat.slug);
              document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
            }}
            whileHover={
              !shouldReduceMotion
                ? { y: -6, rotate: -1, scale: 1.02 }
                : undefined
            }
            whileTap={
              !shouldReduceMotion
                ? { scale: 0.96 }
                : undefined
            }
            transition={{
              type: 'spring',
              stiffness: 340,
              damping: 24,
            }}
            style={{ position: 'relative' }}
          >
            {/* Fluid active indicator ring/glow */}
            {isActive && (
              <motion.div
                layoutId="category-active-ring"
                className="pointer-events-none absolute inset-0 rounded-[22px]"
                style={{
                  border: '3px solid var(--ink)',
                  boxShadow: '0 0 0 4px rgba(227, 30, 36, 0.25)',
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 26,
                  mass: 0.8,
                }}
              />
            )}

            <motion.span
              className="category-icon"
              animate={isActive && !shouldReduceMotion ? { scale: [1, 1.22, 1.08] } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 16 }}
            >
              {cat.icon}
            </motion.span>

            <span className="category-name">{cat.name}</span>

            {/* Active Pill Badge */}
            {isActive && (
              <motion.span
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ink)] text-[10px] font-black text-white shadow-xs"
              >
                ✓
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
