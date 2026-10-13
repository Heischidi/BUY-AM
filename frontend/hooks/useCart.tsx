'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Cart, CartItem, Product } from '@/types';
import { cartApi } from '@/lib/api';
import { useAuth } from './useAuth';

interface CartState {
  cart: Cart | null;
  isOpen: boolean;
  loading: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (productId: number, quantity?: number, customPrice?: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  itemCount: number;
  // Guest cart (localStorage fallback)
  guestCart: { id: number; name: string; price: number; originalPrice?: number; image: string; quantity: number }[];
  addToGuestCart: (product: Product, customPrice?: number) => void;
  removeFromGuestCart: (productId: number) => void;
  changeGuestQty: (productId: number, delta: number) => void;
}

const CartContext = createContext<CartState>({} as CartState);

function money(v: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(v);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [guestCart, setGuestCart] = useState<{ id: number; name: string; price: number; originalPrice?: number; image: string; quantity: number }[]>([]);

  // Load guest cart from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('buyam_guest_cart');
    if (stored) setGuestCart(JSON.parse(stored));
  }, []);

  // Fetch backend cart when authenticated
  useEffect(() => {
    if (token) {
      fetchCart();
    } else {
      setCart(null);
    }
  }, [token]);

  const saveGuestCart = (items: typeof guestCart) => {
    setGuestCart(items);
    localStorage.setItem('buyam_guest_cart', JSON.stringify(items));
  };

  const fetchCart = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await cartApi.get(token) as Cart;
      setCart(data);
    } catch {} finally {
      setLoading(false);
    }
  }, [token]);

  const addItem = async (productId: number, quantity = 1, customPrice?: number) => {
    if (!token) return;
    const data = await cartApi.addItem(productId, quantity, token, customPrice) as Cart;
    setCart(data);
    setIsOpen(true);
  };

  const updateItem = async (itemId: number, quantity: number) => {
    if (!token) return;
    const data = await cartApi.updateItem(itemId, quantity, token) as Cart;
    setCart(data);
  };

  const removeItem = async (itemId: number) => {
    if (!token) return;
    const data = await cartApi.removeItem(itemId, token) as Cart;
    setCart(data);
  };

  const clearCart = async () => {
    if (!token) return;
    await cartApi.clear(token);
    setCart(null);
  };

  // Guest cart operations
  const addToGuestCart = (product: Product, customPrice?: number) => {
    const existing = guestCart.find(i => i.id === product.id);
    const image = product.images?.[0]?.url || '';
    const originalPrice = Number(product.price);
    const effectivePrice = customPrice !== undefined
      ? customPrice
      : product.discount_percentage && product.discount_percentage > 0
        ? (product.discounted_price ?? Math.round(originalPrice * (1 - product.discount_percentage / 100)))
        : originalPrice;
    if (existing) {
      saveGuestCart(guestCart.map(i => i.id === product.id ? { ...i, price: effectivePrice, originalPrice, quantity: i.quantity + 1 } : i));
    } else {
      saveGuestCart([...guestCart, { id: product.id, name: product.name, price: effectivePrice, originalPrice, image, quantity: 1 }]);
    }
    setIsOpen(true);
  };

  const removeFromGuestCart = (productId: number) => {
    saveGuestCart(guestCart.filter(i => i.id !== productId));
  };

  const changeGuestQty = (productId: number, delta: number) => {
    const updated = guestCart.map(i => i.id === productId ? { ...i, quantity: i.quantity + delta } : i).filter(i => i.quantity > 0);
    saveGuestCart(updated);
  };

  const itemCount = token
    ? (cart?.item_count ?? 0)
    : guestCart.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart, isOpen, loading,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem, updateItem, removeItem, clearCart,
      itemCount,
      guestCart, addToGuestCart, removeFromGuestCart, changeGuestQty,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
export { money };
