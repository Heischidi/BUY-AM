'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { wishlistApi } from '@/lib/api';
import { useAuth } from './useAuth';

interface WishlistContextType {
  wishlistIds: Set<number>;
  count: number;
  toggle: (productId: number) => Promise<void>;
  isSaved: (id: number) => boolean;
}

const WishlistContext = createContext<WishlistContextType>({
  wishlistIds: new Set(),
  count: 0,
  toggle: async () => {},
  isSaved: () => false,
});

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (token) {
      let isMounted = true;
      wishlistApi.get(token)
        .then((data: any) => {
          if (!isMounted) return;
          const items = data?.items || [];
          const ids = new Set<number>(items.map((i: any) => i.product_id));
          setWishlistIds(ids);
          setCount(data?.total ?? ids.size);
        })
        .catch(() => {
          // If 401 or network error, fallback to guest localStorage
          if (!isMounted) return;
          try {
            const stored = localStorage.getItem('buyam_wishlist');
            if (stored) {
              const ids = JSON.parse(stored) as number[];
              setWishlistIds(new Set(ids));
              setCount(ids.length);
            }
          } catch {}
        });
      return () => { isMounted = false; };
    } else {
      // Guest: use localStorage
      try {
        const stored = localStorage.getItem('buyam_wishlist');
        if (stored) {
          const ids = JSON.parse(stored) as number[];
          setWishlistIds(new Set(ids));
          setCount(ids.length);
        } else {
          setWishlistIds(new Set());
          setCount(0);
        }
      } catch {}
    }
  }, [token]);

  const toggle = useCallback(async (productId: number) => {
    const isCurrentlySaved = wishlistIds.has(productId);

    if (token) {
      if (isCurrentlySaved) {
        setWishlistIds(prev => { const s = new Set(prev); s.delete(productId); return s; });
        setCount(c => Math.max(0, c - 1));
        try {
          await wishlistApi.remove(productId, token);
        } catch {}
      } else {
        setWishlistIds(prev => new Set([...prev, productId]));
        setCount(c => c + 1);
        try {
          await wishlistApi.add(productId, token);
        } catch {}
      }
    } else {
      // Guest: toggle in localStorage
      try {
        const current = JSON.parse(localStorage.getItem('buyam_wishlist') || '[]') as number[];
        const updated = isCurrentlySaved ? current.filter(id => id !== productId) : [...current, productId];
        localStorage.setItem('buyam_wishlist', JSON.stringify(updated));
        setWishlistIds(new Set(updated));
        setCount(updated.length);
      } catch {}
    }
  }, [token, wishlistIds]);

  const isSaved = useCallback((id: number) => wishlistIds.has(id), [wishlistIds]);

  return (
    <WishlistContext.Provider value={{ wishlistIds, count, toggle, isSaved }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
