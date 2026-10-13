'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { useCart, money } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { animateDrawerOpen, animateDrawerClose, animateCartBadge } from '@/lib/anime';

export default function CartDrawer() {
  const {
    cart, isOpen, closeCart, updateItem, removeItem,
    guestCart, removeFromGuestCart, changeGuestQty,
  } = useCart();
  const { token } = useAuth();
  const router = useRouter();

  const drawerRef = useRef<HTMLElement>(null);
  const prevCountRef = useRef(0);

  // Animate open/close via Anime.js to manage inline transform styles
  useEffect(() => {
    if (drawerRef.current) {
      if (isOpen) {
        animateDrawerOpen(drawerRef.current);
      } else {
        animateDrawerClose(drawerRef.current);
      }
    }
  }, [isOpen]);

  // Bounce cart badge when item count increases
  const itemCount =
    token
      ? (cart?.items?.reduce((s, i) => s + i.quantity, 0) ?? 0)
      : guestCart.reduce((s, i) => s + i.quantity, 0);

  useEffect(() => {
    if (itemCount > prevCountRef.current) {
      const badge = document.querySelector('.cart-icon-badge');
      if (badge) animateCartBadge(badge);
    }
    prevCountRef.current = itemCount;
  }, [itemCount]);

  const handleCheckout = () => {
    closeCart();
    if (token) {
      router.push('/checkout');
    } else {
      router.push('/auth/login?redirect=/checkout');
    }
  };

  const renderAuthCart = () => {
    if (!cart?.items.length) {
      return (
        <div className="empty-state">
          <strong>Your cart is empty</strong>
          <span>Add something useful, beautiful or tasty from the market.</span>
        </div>
      );
    }

    return cart.items.map(item => {
      const img = item.product?.images?.[0]?.url || '/placeholder.jpg';
      const isBargained = item.product && Number(item.unit_price) < Number(item.product.price);
      return (
        <div className="cart-item" key={item.id}>
          <div style={{ position: 'relative', width: 64, height: 64 }}>
            <Image src={img} alt={item.product?.name || 'Product'} fill style={{ objectFit: 'cover', borderRadius: 12 }} />
          </div>
          <div>
            <strong>{item.product?.name}</strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <small>{money(Number(item.unit_price))}</small>
              {isBargained && (
                <span style={{ fontSize: 10, background: 'rgba(46, 125, 50, 0.14)', color: '#2e7d32', padding: '1px 6px', borderRadius: 6, fontWeight: 800 }}>
                  🏷️ Price Am Deal
                </span>
              )}
            </div>
            <div className="quantity-control">
              <button onClick={() => updateItem(item.id, item.quantity - 1)} aria-label="Decrease">−</button>
              <span>{item.quantity}</span>
              <button onClick={() => updateItem(item.id, item.quantity + 1)} aria-label="Increase">+</button>
            </div>
          </div>
          <button className="remove-item" onClick={() => removeItem(item.id)}>Remove</button>
        </div>
      );
    });
  };

  const renderGuestCart = () => {
    if (!guestCart.length) {
      return (
        <div className="empty-state">
          <strong>Your cart is empty</strong>
          <span>Add something useful, beautiful or tasty from the market.</span>
        </div>
      );
    }

    return guestCart.map(item => (
      <div className="cart-item" key={item.id}>
        {item.image ? (
          <div style={{ position: 'relative', width: 64, height: 64 }}>
            <Image src={item.image} alt={item.name} fill style={{ objectFit: 'cover', borderRadius: 12 }} />
          </div>
        ) : (
          <div style={{ width: 64, height: 64, borderRadius: 12, background: '#f1dfc9' }} />
        )}
        <div>
          <strong>{item.name}</strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <small>{money(item.price)}</small>
            {item.originalPrice && item.price < item.originalPrice && (
              <span style={{ fontSize: 10, background: 'rgba(46, 125, 50, 0.14)', color: '#2e7d32', padding: '1px 6px', borderRadius: 6, fontWeight: 800 }}>
                🏷️ Price Am Deal
              </span>
            )}
          </div>
          <div className="quantity-control">
            <button onClick={() => changeGuestQty(item.id, -1)} aria-label="Decrease">−</button>
            <span>{item.quantity}</span>
            <button onClick={() => changeGuestQty(item.id, 1)} aria-label="Increase">+</button>
          </div>
        </div>
        <button className="remove-item" onClick={() => removeFromGuestCart(item.id)}>Remove</button>
      </div>
    ));
  };

  const subtotal = token
    ? Number(cart?.subtotal ?? 0)
    : guestCart.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <>
      <div className={`cart-backdrop ${isOpen ? 'open' : ''}`} onClick={closeCart} />
      <aside
        ref={drawerRef}
        className={`cart-drawer ${isOpen ? 'open' : ''}`}
        aria-label="Shopping cart"
      >
        <div className="drawer-header">
          <h2>Your cart</h2>
          <button className="close-button" onClick={closeCart} aria-label="Close cart">×</button>
        </div>

        <div className="cart-items">
          {token ? renderAuthCart() : renderGuestCart()}
        </div>

        <div className="cart-footer">
          <div className="subtotal">
            <span>Subtotal</span>
            <span>{money(subtotal)}</span>
          </div>
          <button className="checkout-button" onClick={handleCheckout}>
            Continue to checkout
          </button>
        </div>
      </aside>
    </>
  );
}
