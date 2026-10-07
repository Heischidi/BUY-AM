'use client';

import { useEffect, useRef } from 'react';
import { registerScrollReveal, unregisterScrollReveal } from '@/lib/anime';

/**
 * useScrollReveal
 * Attaches an IntersectionObserver-based scroll-triggered entrance animation
 * to the returned ref. The element must have initial CSS: opacity:0; transform:translateY(32px).
 *
 * @param delay - optional stagger delay in ms (default 0)
 */
export function useScrollReveal<T extends Element = HTMLDivElement>(delay = 0) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    registerScrollReveal(el, delay);
    return () => unregisterScrollReveal(el);
  }, [delay]);

  return ref;
}
