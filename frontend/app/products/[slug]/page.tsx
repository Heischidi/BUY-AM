'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Product } from '@/types';
import { productsApi } from '@/lib/api';
import { useCart, money } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const { addItem, addToGuestCart, openCart } = useCart();
  const { toggle, isSaved } = useWishlist();
  const { token } = useAuth();

  useEffect(() => {
    productsApi.get(slug)
      .then(res => setProduct(res as Product))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
        <span className="spinner" style={{ borderColor: 'var(--red)', borderTopColor: 'transparent', width: 40, height: 40 }} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container empty-state" style={{ margin: '100px auto' }}>
        <strong>Product not found</strong>
        <span>This product might have been removed or doesn&apos;t exist.</span>
        <button className="primary-button" style={{ marginTop: 20 }} onClick={() => router.push('/')}>
          Back to market
        </button>
      </div>
    );
  }

  const saved = isSaved(product.id);
  const image = product.images?.[0]?.url;

  const handleAddToCart = async () => {
    if (token) {
      await addItem(product.id, quantity);
    } else {
      for (let i = 0; i < quantity; i++) {
        addToGuestCart(product);
      }
    }
    openCart();
  };

  return (
    <div className="container" style={{ padding: '60px 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'start' }}>
        
        {/* Left: Images */}
        <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', background: '#f1dfc9', aspectRatio: '1/1' }}>
          {image ? (
            <Image src={image} alt={product.name} fill style={{ objectFit: 'cover' }} />
          ) : null}
          <button
            className={`heart-button ${saved ? 'saved' : ''}`}
            onClick={() => toggle(product.id)}
            style={{ width: 50, height: 50, fontSize: 24, top: 20, right: 20 }}
          >
            {saved ? '♥️' : '♡'}
          </button>
        </div>

        {/* Right: Info */}
        <div>
          <div className="product-category" style={{ fontSize: 14, marginBottom: 8 }}>
            {product.category?.name}
          </div>
          <h1 style={{ fontSize: 48, marginBottom: 16 }}>{product.name}</h1>
          
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--red)', marginBottom: 24 }}>
            {money(Number(product.price))}
          </div>

          <p style={{ color: 'var(--muted)', fontSize: 18, lineHeight: 1.6, marginBottom: 32 }}>
            {product.description || 'No description available for this product.'}
          </p>

          <div style={{ padding: '24px', borderRadius: '24px', background: 'var(--white)', border: '2px solid rgba(37,28,24,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{ fontWeight: 800 }}>Quantity</div>
              <div className="quantity-control" style={{ margin: 0 }}>
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: 32, height: 32 }}>−</button>
                <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 800 }}>{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} style={{ width: 32, height: 32 }}>+</button>
              </div>
              <span style={{ color: 'var(--muted)', fontSize: 14 }}>
                {product.stock_quantity} available
              </span>
            </div>

            <button 
              className="primary-button" 
              style={{ width: '100%', fontSize: 18, padding: 18 }}
              onClick={handleAddToCart}
            >
              Add {quantity} to Cart — {money(Number(product.price) * quantity)}
            </button>
          </div>

          {product.seller && (
            <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--yellow)', display: 'grid', placeItems: 'center', fontSize: 24 }}>
                🏪
              </div>
              <div>
                <div style={{ fontSize: 14, color: 'var(--muted)' }}>Sold by</div>
                <div style={{ fontWeight: 800 }}>{product.seller.business_name}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
