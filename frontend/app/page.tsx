'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { productsApi, categoriesApi } from '@/lib/api';
import { Product, Category } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import CategoryGrid from '@/components/product/CategoryGrid';
import ProcurementModal from '@/components/ui/ProcurementModal';
import Link from 'next/link';

function HomeContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [heroSearch, setHeroSearch] = useState('');
  const [showProcurement, setShowProcurement] = useState(false);

  useEffect(() => {
    // We expect the backend list endpoint to return a list directly for categories
    categoriesApi.list().then(res => setCategories(res as Category[])).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const fetchProducts = async () => {
      try {
        if (q) {
          const res = await productsApi.search(q);
          setProducts((res as any).items || res);
        } else {
          const params = activeCategory !== 'all' ? { category: activeCategory } : {};
          const res = await productsApi.list(params);
          setProducts((res as any).items || res);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [q, activeCategory]);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      router.push(`/?q=${encodeURIComponent(heroSearch.trim())}`);
    }
  };

  const handleCategorySelect = (slug: string) => {
    if (q) {
      router.push('/'); // Clear search query when selecting a category
    }
    setActiveCategory(slug);
  };

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">Nigeria&apos;s Marketplace</span>
            <h1>
              Buy it at <span>Buy Am.</span>
            </h1>
            <p className="hero-copy">
              From fresh groceries to electronics, building materials to bulk procurement — find everything you need from trusted Nigerian sellers. Delivered to your door.
            </p>

            <form className="hero-search" onSubmit={handleHeroSearch}>
              <span style={{ marginLeft: 6, fontSize: 22 }} aria-hidden="true">⌕</span>
              <input
                type="text"
                placeholder="What are you looking for?"
                value={heroSearch}
                onChange={e => setHeroSearch(e.target.value)}
              />
              <button className="search-button" type="submit">Search market</button>
            </form>

            <div className="hero-buttons">
              <button
                className="secondary-button"
                onClick={() => document.getElementById('products')?.scrollIntoView()}
              >
                Browse categories ↓
              </button>
              <button
                className="secondary-button"
                style={{ borderColor: 'var(--ink)', color: 'var(--ink)' }}
                onClick={() => setShowProcurement(true)}
              >
                Bulk Procurement 📦
              </button>
            </div>
          </div>

          <div className="hero-art">
            <div className="market-card">
              <div className="market-copy">
                <small>Trusted Sellers</small>
                <strong>100%<br />Naija<br />Market</strong>
              </div>
              <div className="basket" />
            </div>
          </div>
        </div>
      </section>

      <section id="categories" className="section" style={{ background: 'var(--white)' }}>
        <div className="container">
          <div className="section-heading">
            <div>
              <h2>Explore the market</h2>
              <p>Find exactly what you need across our vibrant marketplace categories.</p>
            </div>
          </div>

          <CategoryGrid
            categories={categories}
            activeCategory={activeCategory}
            onSelect={handleCategorySelect}
          />

          <div className="trust-strip">
            <div className="trust-card">
              <div className="trust-icon">🛡️</div>
              <div>
                <strong>Secure Payments</strong>
                <span>100% protected transactions</span>
              </div>
            </div>
            <div className="trust-card">
              <div className="trust-icon">🚚</div>
              <div>
                <strong>Nationwide Delivery</strong>
                <span>Fast and reliable shipping</span>
              </div>
            </div>
            <div className="trust-card">
              <div className="trust-icon">🤝</div>
              <div>
                <strong>Verified Sellers</strong>
                <span>Trusted businesses only</span>
              </div>
            </div>
            <div className="trust-card">
              <div className="trust-icon">👩🏾‍🦱</div>
              <div>
                <strong>Amara AI</strong>
                <span>Smart shopping assistant</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="products" className="section">
        <div className="container">
          <div className="products-toolbar">
            <h2 style={{ fontSize: 32, margin: 0 }}>
              {q ? `Search results for "${q}"` : activeCategory === 'all' ? 'Featured Products' : `${categories.find(c => c.slug === activeCategory)?.name || 'Category'} Products`}
            </h2>
            <div className="result-count">
              {loading ? 'Loading...' : `${products.length} product${products.length !== 1 ? 's' : ''}`}
            </div>
            {(q || activeCategory !== 'all') && (
              <button
                className="clear-filter"
                onClick={() => {
                  router.push('/');
                  setActiveCategory('all');
                }}
              >
                Clear filters ✕
              </button>
            )}
          </div>

          <div className="product-grid">
            {loading ? (
              Array(8).fill(0).map((_, i) => (
                <article key={i} className="product-card" style={{ opacity: 0.6 }}>
                  <div className="product-image" />
                  <div className="product-info">
                    <div style={{ height: 16, background: '#eee', width: '40%', marginBottom: 12 }} />
                    <div style={{ height: 24, background: '#eee', width: '80%', marginBottom: 16 }} />
                    <div style={{ height: 20, background: '#eee', width: '30%', marginBottom: 16 }} />
                    <div style={{ height: 40, background: '#eee', borderRadius: 13 }} />
                  </div>
                </article>
              ))
            ) : products.length > 0 ? (
              products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPriceClick={(p) => alert(`Price for ${p.name} is ₦${p.price}`)}
                />
              ))
            ) : (
              <div className="empty-state">
                <strong>No products found</strong>
                <span>Try adjusting your search or checking a different category.</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {showProcurement && <ProcurementModal onClose={() => setShowProcurement(false)} />}
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '100px 0', textAlign: 'center' }}><span className="spinner" style={{ borderColor: 'var(--red)', borderTopColor: 'transparent' }} /></div>}>
      <HomeContent />
    </Suspense>
  );
}
