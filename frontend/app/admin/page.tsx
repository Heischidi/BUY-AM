'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { adminApi } from '@/lib/api';
import { money } from '@/hooks/useCart';

interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  stock_quantity: number;
  status: string;
  featured: boolean;
  is_negotiable: boolean;
  category?: { id: number; name: string } | null;
  image?: string | null;
  created_at: string;
}

interface AdminOrder {
  id: number;
  order_number: string;
  total: string;
  status: string;
  payment_status: string;
  created_at: string;
}

export default function AdminPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');
  const [filterNegotiable, setFilterNegotiable] = useState<'all' | 'negotiable' | 'fixed'>('all');
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Authentication & Admin check
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login?redirect=/admin');
      } else if (user.role !== 'admin') {
        // Not admin
      }
    }
  }, [user, loading, router]);

  const loadData = async () => {
    if (!token || user?.role !== 'admin') return;
    setFetching(true);
    try {
      const prods = (await adminApi.products({ limit: 150 }, token)) as AdminProduct[];
      setProducts(prods || []);
      const ords = (await adminApi.orders(token)) as AdminOrder[];
      setOrders(ords || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (token && user?.role === 'admin') {
      loadData();
    }
  }, [token, user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleNegotiable = async (product: AdminProduct) => {
    if (!token || togglingId) return;
    const nextVal = !product.is_negotiable;
    setTogglingId(product.id);

    // Optimistic update
    setProducts(prev =>
      prev.map(p => (p.id === product.id ? { ...p, is_negotiable: nextVal } : p))
    );

    try {
      await adminApi.toggleNegotiable(product.id, nextVal, token);
      showToast(
        nextVal
          ? `✅ "${product.name}" now has Price Am feature (Mama Nkechi enabled)!`
          : `ℹ️ Price Am disabled for "${product.name}".`
      );
    } catch (err) {
      console.error('Error toggling negotiable:', err);
      // Revert optimistic update
      setProducts(prev =>
        prev.map(p => (p.id === product.id ? { ...p, is_negotiable: product.is_negotiable } : p))
      );
      showToast('❌ Failed to update Price Am status. Please try again.');
    } finally {
      setTogglingId(null);
    }
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.category?.name && p.category.name.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;

      if (filterNegotiable === 'negotiable') return p.is_negotiable;
      if (filterNegotiable === 'fixed') return !p.is_negotiable;
      return true;
    });
  }, [products, search, filterNegotiable]);

  const stats = useMemo(() => {
    const total = products.length;
    const negotiable = products.filter(p => p.is_negotiable).length;
    const fixed = total - negotiable;
    return { total, negotiable, fixed };
  }, [products]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <span className="spinner" style={{ borderColor: 'var(--red)', borderTopColor: 'transparent', width: 40, height: 40 }} />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="container" style={{ padding: '80px 20px', maxWidth: 600, textAlign: 'center' }}>
        <div style={{ background: 'var(--white)', padding: 40, borderRadius: 24, boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontSize: 28, marginBottom: 12 }}>Admin Access Required</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
            Only store administrators can configure products and the &ldquo;Price Am&rdquo; bargaining feature.
          </p>
          <Link href="/auth/login?redirect=/admin" className="primary-button" style={{ display: 'inline-block', padding: '12px 24px' }}>
            Sign in as Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '32px 0 60px' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div className="admin-toast">
          {toastMessage}
        </div>
      )}

      {/* Admin Header */}
      <div className="admin-header-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 24 }}>👑</span>
            <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--red)', background: '#fee2e2', padding: '4px 10px', borderRadius: 999 }}>
              Admin Dashboard
            </span>
          </div>
          <h1 style={{ fontSize: 36, margin: 0 }}>Store & Price Am Controls</h1>
          <p style={{ color: 'var(--muted)', margin: '4px 0 0', fontSize: 15 }}>
            Select which products customers can bargain for with Mama Nkechi.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" className="secondary-button" style={{ padding: '10px 18px', fontSize: 14 }}>
            🏪 View Storefront
          </Link>
          <Link href="/account" className="secondary-button" style={{ padding: '10px 18px', fontSize: 14 }}>
            👤 My Account
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-label">Total Catalog</div>
          <div className="stat-val">{stats.total}</div>
          <div className="stat-sub">Products in store</div>
        </div>

        <div className="admin-stat-card highlight">
          <div className="stat-label">Price Am Enabled 🔥</div>
          <div className="stat-val" style={{ color: 'var(--green)' }}>{stats.negotiable}</div>
          <div className="stat-sub">Customers fit price with Mama Nkechi</div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-label">Fixed Price Only</div>
          <div className="stat-val">{stats.fixed}</div>
          <div className="stat-sub">Standard checkout only</div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-label">Total Orders</div>
          <div className="stat-val">{orders.length}</div>
          <div className="stat-sub">Processed transactions</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs-nav">
        <button
          className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          🏷️ Manage Products & Price Am
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📦 Store Orders ({orders.length})
        </button>
      </div>

      {/* TAB 1: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="admin-products-panel">
          {/* Controls Bar */}
          <div className="admin-filters-bar">
            <div className="admin-search-wrap">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Search products by title or category..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="admin-filter-pills">
              <button
                type="button"
                className={`filter-pill ${filterNegotiable === 'all' ? 'active' : ''}`}
                onClick={() => setFilterNegotiable('all')}
              >
                All ({products.length})
              </button>
              <button
                type="button"
                className={`filter-pill ${filterNegotiable === 'negotiable' ? 'active' : ''}`}
                onClick={() => setFilterNegotiable('negotiable')}
              >
                🔥 Price Am Active ({stats.negotiable})
              </button>
              <button
                type="button"
                className={`filter-pill ${filterNegotiable === 'fixed' ? 'active' : ''}`}
                onClick={() => setFilterNegotiable('fixed')}
              >
                Fixed Price ({stats.fixed})
              </button>
            </div>
          </div>

          {fetching ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <span className="spinner" style={{ borderColor: 'var(--red)', borderTopColor: 'transparent', width: 36, height: 36 }} />
              <div style={{ marginTop: 12, color: 'var(--muted)', fontSize: 15 }}>Loading store products…</div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <strong>No products found</strong>
              <span>Try adjusting your search or filter keywords.</span>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th style={{ textAlign: 'center' }}>Price Am (Mama Nkechi)</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(prod => (
                    <tr key={prod.id} className={prod.is_negotiable ? 'row-negotiable' : ''}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 48, height: 48, position: 'relative', borderRadius: 10, overflow: 'hidden', background: '#f1dfc9', flexShrink: 0 }}>
                            {prod.image ? (
                              <Image src={prod.image} alt={prod.name} fill style={{ objectFit: 'cover' }} />
                            ) : null}
                          </div>
                          <div>
                            <Link href={`/products/${prod.slug}`} className="admin-prod-link" target="_blank">
                              {prod.name} ↗
                            </Link>
                            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                              ID #{prod.id} • {prod.status}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="category-tag">
                          {prod.category?.name || 'Uncategorized'}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontWeight: 800, color: 'var(--red)', fontSize: 16 }}>
                          {money(Number(prod.price))}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: 14, fontWeight: 700, color: prod.stock_quantity > 0 ? 'var(--ink)' : 'var(--red)' }}>
                          {prod.stock_quantity} left
                        </span>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <button
                            type="button"
                            className={`toggle-switch-btn ${prod.is_negotiable ? 'on' : 'off'}`}
                            onClick={() => handleToggleNegotiable(prod)}
                            disabled={togglingId === prod.id}
                            title={prod.is_negotiable ? "Click to disable Price Am" : "Click to enable Price Am"}
                          >
                            <span className="toggle-slider" />
                            <span className="toggle-label">
                              {prod.is_negotiable ? 'ON' : 'OFF'}
                            </span>
                          </button>
                          <span style={{ fontSize: 11, fontWeight: 700, color: prod.is_negotiable ? 'var(--green)' : 'var(--muted)' }}>
                            {prod.is_negotiable ? '🔥 Negotiable' : 'Fixed Price'}
                          </span>
                        </div>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <Link
                          href={`/products/${prod.slug}`}
                          className="secondary-button"
                          style={{ padding: '6px 12px', fontSize: 13, borderRadius: 999 }}
                          target="_blank"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ORDERS */}
      {activeTab === 'orders' && (
        <div className="admin-orders-panel">
          {orders.length === 0 ? (
            <div className="empty-state">
              <strong>No orders found</strong>
              <span>Customer orders will appear here as soon as they checkout.</span>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Order Status</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 800 }}>#{o.order_number}</td>
                      <td style={{ color: 'var(--muted)', fontSize: 14 }}>
                        {new Date(o.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ fontWeight: 800, color: 'var(--red)' }}>
                        {money(Number(o.total))}
                      </td>
                      <td>
                        <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 800, background: o.status === 'delivered' ? 'var(--green)' : 'var(--yellow)', color: o.status === 'delivered' ? '#fff' : '#000' }}>
                          {o.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 800, background: o.payment_status === 'paid' ? '#dcfce7' : '#fee2e2', color: o.payment_status === 'paid' ? '#166534' : '#991b1b' }}>
                          {o.payment_status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
