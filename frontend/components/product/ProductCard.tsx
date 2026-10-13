'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import { Product } from '@/types';
import { useCart, money } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { cardHoverIn, cardHoverOut, animateAddToCart, animateButtonPress } from '@/lib/anime';
import { motion, useReducedMotion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  onPriceClick?: (product: Product) => void;
}

export default function ProductCard({ product, onPriceClick }: ProductCardProps) {
  const { token } = useAuth();
  const { addItem, addToGuestCart } = useCart();
  const { isSaved, toggle } = useWishlist();

  const cardRef = useRef<HTMLElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const priceBtnRef = useRef<HTMLButtonElement>(null);

  const image = product.images?.[0]?.url;
  const saved = isSaved(product.id);
  const shouldReduceMotion = useReducedMotion();

  const handleAddToCart = async () => {
    if (addBtnRef.current) animateAddToCart(addBtnRef.current);
    if (token) {
      await addItem(product.id);
    } else {
      addToGuestCart(product);
    }
  };

  return (
    <article
      className="product-card"
      ref={cardRef}
      onMouseEnter={() => cardRef.current && cardHoverIn(cardRef.current)}
      onMouseLeave={() => cardRef.current && cardHoverOut(cardRef.current)}
    >
      <div className="product-image">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 650px) 50vw, (max-width: 900px) 33vw, 25vw"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#f1dfc9' }} />
        )}
        {product.discount_percentage && product.discount_percentage > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '999px',
              zIndex: 3,
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.4)',
              letterSpacing: '0.02em',
            }}
          >
            -{product.discount_percentage}% OFF
          </span>
        )}
        <motion.button
          className={`heart-button ${saved ? 'saved' : ''}`}
          onClick={() => toggle(product.id)}
          whileTap={!shouldReduceMotion ? { scale: 0.72 } : undefined}
          animate={!shouldReduceMotion && saved ? { scale: [1, 1.35, 1] } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 450, damping: 15 }}
          aria-label={`${saved ? 'Remove from' : 'Add to'} wishlist`}
        >
          <span style={{ display: 'inline-block', transition: 'color 0.15s ease' }}>
            {saved ? '♥️' : '♡'}
          </span>
        </motion.button>
      </div>

      <div className="product-info">
        <div className="product-category">
          {product.category?.name ?? ''}
        </div>
        <Link href={`/products/${product.slug}`}>
          <div className="product-name">{product.name}</div>
        </Link>
        <div className="product-bottom">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
            {product.discount_percentage && product.discount_percentage > 0 ? (
              <>
                <span className="price" style={{ color: 'var(--red)', fontWeight: 800 }}>
                  {money(product.discounted_price ?? Math.round(Number(product.price) * (1 - product.discount_percentage / 100)))}
                  {product.unit && product.unit !== 'quantity' && product.unit !== 'item' && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginLeft: 4 }}>
                      /{product.unit}
                    </span>
                  )}
                </span>
                <span style={{ fontSize: 12, textDecoration: 'line-through', color: 'var(--muted)', fontWeight: 600 }}>
                  {money(Number(product.price))}
                </span>
              </>
            ) : (
              <span className="price">
                {money(Number(product.price))}
                {product.unit && product.unit !== 'quantity' && product.unit !== 'item' && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginLeft: 4 }}>
                    /{product.unit}
                  </span>
                )}
              </span>
            )}
          </div>
          {product.is_negotiable && (
            <motion.button
              ref={priceBtnRef}
              className="price-button"
              whileHover={!shouldReduceMotion ? { scale: 1.04 } : undefined}
              whileTap={!shouldReduceMotion ? { scale: 0.94 } : undefined}
              onClick={() => {
                if (priceBtnRef.current) animateButtonPress(priceBtnRef.current);
                onPriceClick?.(product);
                
                // Open Mama Nkechi assistant and start bargaining
                window.dispatchEvent(
                  new CustomEvent('open-bargain-chat', {
                    detail: { product }
                  })
                );
              }}
            >
              You fit price am
            </motion.button>
          )}
        </div>
        <motion.button
          ref={addBtnRef}
          className="add-button"
          whileHover={!shouldReduceMotion ? { scale: 1.02 } : undefined}
          whileTap={!shouldReduceMotion ? { scale: 0.96 } : undefined}
          onClick={handleAddToCart}
        >
          Add to cart
        </motion.button>
      </div>
    </article>
  );
}
