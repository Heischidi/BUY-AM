'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from './Logo';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { animateStaggerReveal } from '@/lib/anime';

export default function Navbar() {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const { itemCount, openCart } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { user, logout } = useAuth();

  const actionsRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  // Staggered reveal of nav action items on first mount
  useEffect(() => {
    if (hasAnimated.current || !actionsRef.current) return;
    const items = Array.from(actionsRef.current.children) as Element[];
    animateStaggerReveal(items, { delay: 300, stagger: 60, fromY: -12 });
    hasAnimated.current = true;
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="topbar">
      <div className="container nav">
        <Logo />

        <form className="nav-search" onSubmit={handleSearch} id="navSearch">
          <span aria-hidden="true">⌕</span>
          <input
            id="navSearchInput"
            type="search"
            placeholder="Search for products, services or categories"
            aria-label="Search products"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button className="search-button" type="submit">Search</button>
        </form>

        <Link className="seller-link" href="/seller">Sell on Buy Am</Link>

        <div className="nav-actions" ref={actionsRef}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link
                href="/account"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '999px',
                  background: 'var(--white)',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                👤 {user.first_name}
              </Link>
              <button
                onClick={logout}
                style={{
                  padding: '8px 14px',
                  borderRadius: '999px',
                  background: 'rgba(37,28,24,0.07)',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              style={{
                padding: '10px 18px',
                borderRadius: '999px',
                background: 'var(--white)',
                fontWeight: 700,
                fontSize: '14px',
              }}
            >
              Sign in
            </Link>
          )}

          <button
            className="icon-button"
            onClick={() => router.push('/account#wishlist')}
            aria-label="Wishlist"
          >
            ♡
            <span className="count">{wishlistCount}</span>
          </button>

          <button className="icon-button" onClick={openCart} aria-label="Shopping cart">
            🛒
            <span className="count cart-icon-badge">{itemCount}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
