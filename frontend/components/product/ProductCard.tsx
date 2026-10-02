'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { useCart, money } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';

interface ProductCardProps {
  product: Product;
  onPriceClick?: (product: Product) => void;
}

export default function ProductCard({ product, onPriceClick }: ProductCardProps) {
  const { token } = useAuth();
  const { addItem, addToGuestCart } = useCart();
  const { isSaved, toggle } = useWishlist();

  const image = product.images?.[0]?.url;
  const saved = isSaved(product.id);

  const handleAddToCart = async () => {
    if (token) {
      await addItem(product.id);
    } else {
      addToGuestCart(product);
    }
  };

  return (
    <article className="product-card">
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
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
          Sold by: <span style={{ fontWeight: 600 }}>{product.seller?.business_name || 'Buy Am Direct'}</span>
        </div>
        <div className="product-bottom">
          <span className="price">{money(Number(product.price))}</span>
          <button
            className="price-button"
            onClick={() => onPriceClick?.(product)}
          >
            Price
          </button>
        </div>
        <button className="add-button" onClick={handleAddToCart}>
          Add to cart
        </button>
      </div>
    </article>
  );
}
