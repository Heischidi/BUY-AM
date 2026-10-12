'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import { Product } from '@/types';
import { useCart, money } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { cardHoverIn, cardHoverOut, animateAddToCart, animateButtonPress } from '@/lib/anime';

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
        <button
          className={`heart-button ${saved ? 'saved' : ''}`}
          onClick={() => toggle(product.id)}
          aria-label={`${saved ? 'Remove from' : 'Add to'} wishlist`}
        >
          {saved ? '♥️' : '♡'}
        </button>
      </div>

      <div className="product-info">
        <div className="product-category">
          {product.category?.name ?? ''}
        </div>
        <Link href={`/products/${product.slug}`}>
          <div className="product-name">{product.name}</div>
        </Link>
        <div className="product-bottom">
          <span className="price">
            {money(Number(product.price))}
            {product.unit && product.unit !== 'quantity' && product.unit !== 'item' && (
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginLeft: 4 }}>
                /{product.unit}
              </span>
            )}
          </span>
          {product.is_negotiable && (
            <button
              ref={priceBtnRef}
              className="price-button"
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
            </button>
          )}
        </div>
        <button ref={addBtnRef} className="add-button" onClick={handleAddToCart}>
          Add to cart
        </button>
      </div>
    </article>
  );
}
