'use client';

import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface CardItem {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  badge: string;
  highlight: string;
  detail: string;
  accent: string;
  bgGradient: string;
  shadowColor: string;
}

const CARDS: CardItem[] = [
  {
    id: 'direct-brand',
    tag: 'Official Store',
    title: '100% Direct Brand',
    subtitle: 'From source to your door with zero middleman markup',
    badge: '✓ Verified Quality',
    highlight: 'Direct Wholesale',
    detail: 'Authentic items from top distributors across Nigeria',
    accent: '#ffc93c',
    bgGradient: 'linear-gradient(135deg, #e31e24 0%, #b9161b 100%)',
    shadowColor: 'rgba(227, 30, 36, 0.35)',
  },
  {
    id: 'mama-nkechi',
    tag: 'Mama Nkechi AI',
    title: 'You Fit Price Am!',
    subtitle: 'Smart AI negotiation engine that bargains like a market queen',
    badge: '👩🏾‍🦱 AI Powered',
    highlight: 'Real-time Deals',
    detail: 'Drop your price on eligible items & get instant discounts',
    accent: '#ffc93c',
    bgGradient: 'linear-gradient(135deg, #4c8c3c 0%, #356729 100%)',
    shadowColor: 'rgba(76, 140, 60, 0.35)',
  },
  {
    id: 'nationwide-delivery',
    tag: 'Nationwide Logistics',
    title: 'Fast Doorstep Delivery',
    subtitle: 'Reliable transit to all 36 states with end-to-end tracking',
    badge: '🚚 24-48 Hours',
    highlight: '36 States Covered',
    detail: 'Lagos • Abuja • Port Harcourt • Onitsha • Kano & beyond',
    accent: '#4c8c3c',
    bgGradient: 'linear-gradient(135deg, #251c18 0%, #150f0c 100%)',
    shadowColor: 'rgba(37, 28, 24, 0.35)',
  },
];

export default function HeroCardStack() {
  const [deck, setDeck] = useState(CARDS);
  const shouldReduceMotion = useReducedMotion();

  const cycleCard = () => {
    setDeck((prev) => {
      const copy = [...prev];
      const top = copy.shift();
      if (top) copy.push(top);
      return copy;
    });
  };

  return (
    <div className="relative flex w-full max-w-[440px] flex-col items-center">
      {/* Card stack container */}
      <div
        className="relative h-[300px] w-full cursor-pointer select-none sm:h-[340px]"
        onClick={cycleCard}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            cycleCard();
          }
        }}
        aria-label="Interactive marketplace showcase card stack. Click or press enter to cycle cards."
      >
        {deck.map((card, index) => {
          // Top card is at index 0
          const isTop = index === 0;
          const offset = index; // 0, 1, 2

          // Visual rotations and offsets for depth
          const rotateZ = shouldReduceMotion ? 0 : isTop ? 2 : offset === 1 ? -4 : 5;
          const yOffset = offset * 10;
          const scale = 1 - offset * 0.05;
          const zIndex = deck.length - index;

          return (
            <motion.div
              key={card.id}
              layout={!shouldReduceMotion}
              initial={false}
              animate={{
                y: yOffset,
                rotateZ,
                scale,
                zIndex,
                opacity: 1 - offset * 0.12,
              }}
              whileHover={
                isTop && !shouldReduceMotion
                  ? { y: yOffset - 8, scale: scale * 1.02, rotateZ: 0 }
                  : undefined
              }
              whileTap={
                isTop && !shouldReduceMotion
                  ? { scale: scale * 0.98 }
                  : undefined
              }
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 22,
                mass: 0.8,
              }}
              className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-[28px] p-5 text-white sm:rounded-[36px] sm:p-7"
              style={{
                background: card.bgGradient,
                boxShadow: isTop
                  ? `0 24px 44px -8px ${card.shadowColor}, 0 8px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.2)`
                  : '0 8px 24px rgba(0,0,0,0.15)',
              }}
            >
              {/* Background decorative circles */}
              <div
                className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full opacity-30"
                style={{ background: card.accent }}
              />
              <div
                className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full opacity-25"
                style={{ background: card.accent }}
              />

              {/* Card Header */}
              <div className="relative z-10 flex items-center justify-between">
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest sm:px-3.5 sm:text-xs"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.18)',
                    color: '#ffffff',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  {card.tag}
                </span>

                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-slate-900 shadow-sm sm:px-3 sm:text-xs"
                  style={{ backgroundColor: card.accent }}
                >
                  {card.badge}
                </span>
              </div>

              {/* Card Body */}
              <div className="relative z-10 my-auto pt-2 sm:pt-3">
                <h3
                  className="text-balance text-2xl font-extrabold leading-[1.05] tracking-tight sm:text-3xl md:text-4xl"
                  style={{ fontFamily: '"Baloo 2", cursive' }}
                >
                  {card.title}
                </h3>
                <p className="mt-1.5 text-xs font-medium leading-snug text-white/90 sm:mt-2 sm:text-sm">
                  {card.subtitle}
                </p>
              </div>

              {/* Card Footer */}
              <div className="relative z-10 flex items-center justify-between border-t border-white/15 pt-2.5 sm:pt-3.5">
                <div>
                  <small className="block text-[10px] font-bold uppercase tracking-wider text-white/70 sm:text-[11px]">
                    {card.highlight}
                  </small>
                  <span className="text-[11px] font-medium text-white/90 sm:text-xs">
                    {card.detail}
                  </span>
                </div>

                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white shadow-sm transition-transform duration-200 group-hover:scale-110 sm:h-9 sm:w-9 sm:text-sm"
                  title="Next card"
                >
                  ↻
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Floating Interactive Deck Cue */}
      <div className="mt-5 flex items-center gap-2">
        {deck.map((c, i) => (
          <span
            key={c.id}
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: i === 0 ? 24 : 8,
              backgroundColor: i === 0 ? 'var(--red)' : 'rgba(37, 28, 24, 0.2)',
            }}
          />
        ))}
        <span className="ml-2 text-xs font-bold text-[var(--muted)]">
          Tap card to cycle ✨
        </span>
      </div>
    </div>
  );
}
