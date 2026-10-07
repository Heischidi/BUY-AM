/**
 * lib/anime.ts
 * Reusable Anime.js v4 animation utilities for Buy Am.
 * Uses the Anime.js v4 named-export API.
 * All animations respect prefers-reduced-motion.
 */

import { animate, createTimeline, stagger } from 'animejs';
import type { JSAnimation } from 'animejs';

/** True when the user has requested reduced motion */
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── Durations ────────────────────────────────────────────────────────────────
export const DUR = {
  fast: 240,
  normal: 380,
  slow: 560,
} as const;

// ─── Easings (v4 string format) ───────────────────────────────────────────────
const EASE = {
  out: 'outExpo',
  outCubic: 'outCubic',
  outBack: 'outBack(1.4)',
  inOut: 'inOutQuart',
} as const;

// ─── Hero Entrance ────────────────────────────────────────────────────────────
export function animateHeroEntrance(targets: Element[]): void {
  if (prefersReducedMotion() || !targets.length) return;
  animate(targets, {
    opacity: [0, 1],
    translateY: [40, 0],
    duration: DUR.slow,
    ease: EASE.out,
    delay: stagger(90, { start: 120 }),
  });
}

// ─── Staggered Reveal ────────────────────────────────────────────────────────
export function animateStaggerReveal(
  targets: Element[],
  options: { delay?: number; stagger?: number; fromY?: number } = {}
): void {
  if (prefersReducedMotion() || !targets.length) return;
  const { delay: startDelay = 0, stagger: staggerMs = 70, fromY = 28 } = options;
  animate(targets, {
    opacity: [0, 1],
    translateY: [fromY, 0],
    duration: DUR.normal,
    ease: EASE.out,
    delay: stagger(staggerMs, { start: startDelay }),
  });
}

// ─── Card Hover ───────────────────────────────────────────────────────────────
export function cardHoverIn(el: Element): void {
  if (prefersReducedMotion()) return;
  animate(el, { translateY: -6, scale: 1.015, duration: DUR.fast, ease: EASE.outCubic });
}

export function cardHoverOut(el: Element): void {
  if (prefersReducedMotion()) return;
  animate(el, { translateY: 0, scale: 1, duration: DUR.fast, ease: EASE.outCubic });
}

// ─── Add-to-Cart Burst ────────────────────────────────────────────────────────
export function animateAddToCart(btn: Element): void {
  if (prefersReducedMotion()) return;
  createTimeline({ defaults: { ease: EASE.outBack } })
    .add(btn, { scale: 0.88, duration: 100 })
    .add(btn, { scale: 1, duration: DUR.fast });
}

// ─── Cart Badge Bounce ────────────────────────────────────────────────────────
export function animateCartBadge(badge: Element): void {
  if (prefersReducedMotion()) return;
  createTimeline({ defaults: { ease: EASE.outBack } })
    .add(badge, { scale: 0, duration: 1 })
    .add(badge, { scale: 1.4, duration: 180 })
    .add(badge, { scale: 1, duration: 160 });
}

// ─── Cart Drawer ──────────────────────────────────────────────────────────────
export function animateDrawerOpen(drawer: Element): void {
  if (prefersReducedMotion()) return;
  animate(drawer, {
    translateX: ['105%', '0%'],
    duration: DUR.slow,
    ease: EASE.out,
  });
}

export function animateDrawerClose(drawer: Element, onComplete?: () => void): void {
  if (prefersReducedMotion()) {
    onComplete?.();
    return;
  }
  const cb = onComplete
    ? (_self: JSAnimation) => { onComplete(); }
    : undefined;
  animate(drawer, {
    translateX: '105%',
    duration: DUR.normal,
    ease: EASE.inOut,
    ...(cb ? { onComplete: cb } : {}),
  });
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function animateModalIn(backdrop: Element, modal: Element): void {
  if (prefersReducedMotion()) return;
  animate(backdrop, { opacity: [0, 1], duration: DUR.normal, ease: EASE.out });
  animate(modal, {
    opacity: [0, 1],
    scale: [0.92, 1],
    translateY: [16, 0],
    duration: DUR.normal,
    ease: EASE.outBack,
  });
}

export function animateModalOut(backdrop: Element, modal: Element, onComplete?: () => void): void {
  if (prefersReducedMotion()) {
    onComplete?.();
    return;
  }
  animate(backdrop, { opacity: 0, duration: DUR.fast, ease: EASE.inOut });
  const cb = onComplete
    ? (_self: JSAnimation) => { onComplete(); }
    : undefined;
  animate(modal, {
    opacity: 0,
    scale: 0.94,
    translateY: 12,
    duration: DUR.fast,
    ease: EASE.inOut,
    ...(cb ? { onComplete: cb } : {}),
  });
}

// ─── Button Press ─────────────────────────────────────────────────────────────
export function animateButtonPress(btn: Element): void {
  if (prefersReducedMotion()) return;
  createTimeline({ defaults: { ease: EASE.outBack } })
    .add(btn, { scale: 0.92, duration: 80 })
    .add(btn, { scale: 1, duration: DUR.fast });
}

// ─── Scroll Reveal (IntersectionObserver) ────────────────────────────────────
let _observer: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver {
  if (_observer) return _observer;
  _observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          const delay = Number(el.dataset.revealDelay ?? 0);
          if (!prefersReducedMotion()) {
            animate(el, {
              opacity: [0, 1],
              translateY: [32, 0],
              duration: DUR.slow,
              ease: EASE.out,
              delay,
            });
          } else {
            el.style.opacity = '1';
            el.style.transform = 'none';
          }
          _observer!.unobserve(el);
        }
      });
    },
    { threshold: 0.12 }
  );
  return _observer;
}

/**
 * Register an element for scroll-triggered reveal.
 * CSS must initially hide it: opacity:0; transform:translateY(32px)
 */
export function registerScrollReveal(el: Element | null, delay = 0): void {
  if (!el || typeof window === 'undefined') return;
  (el as HTMLElement).dataset.revealDelay = String(delay);
  getObserver().observe(el);
}

export function unregisterScrollReveal(el: Element | null): void {
  if (!el || !_observer) return;
  _observer.unobserve(el);
}
