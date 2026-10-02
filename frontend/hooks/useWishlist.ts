'use client';

import { useState, useEffect } from 'react';
import { wishlistApi } from '@/lib/api';
import { useAuth } from './useAuth';

export function useWishlist() {
  const { token } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (token) {
      fetchWishlist();
    } else {
      // Guest: use localStorage
      const stored = localStorage.getItem('buyam_wishlist');
      if (stored) {
        const ids = JSON.parse(stored) as number[];
        setWishlistIds(new Set(ids));
        setCount(ids.length);
      }
    }
  }, [token]);

  const fetchWishlist = async () => {
    try {
      const data = await wishlistApi.get(token!) as { items: { product_id: number }[]; total: number };
      const ids = new Set(data.items.map(i => i.product_id));
      setWishlistIds(ids);
      setCount(data.total);
    } catch {}
  };

  const toggle = async (productId: number) => {
    const isSaved = wishlistIds.has(productId);

    if (token) {
      if (isSaved) {
        await wishlistApi.remove(productId, token);
        setWishlistIds(prev => { const s = new Set(prev); s.delete(productId); return s; });
        setCount(c => c - 1);
      } else {
        await wishlistApi.add(productId, token);
        setWishlistIds(prev => new Set([...prev, productId]));
        setCount(c => c + 1);
      }
    } else {
      // Guest: toggle in localStorage
      const current = JSON.parse(localStorage.getItem('buyam_wishlist') || '[]') as number[];
      const updated = isSaved ? current.filter(id => id !== productId) : [...current, productId];
      localStorage.setItem('buyam_wishlist', JSON.stringify(updated));
      setWishlistIds(new Set(updated));
      setCount(updated.length);
    }
  };

  return { wishlistIds, count, toggle, isSaved: (id: number) => wishlistIds.has(id) };
}
