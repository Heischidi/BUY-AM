'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { adminApi, categoriesApi } from '@/lib/api';
import { money } from '@/hooks/useCart';
import { AdminCustomer, AnalyticsData, Category } from '@/types';

interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  stock_quantity: number;
  unit: string;
  status: string;
  featured: boolean;
  is_negotiable: boolean;
  min_price?: number | null;
  max_price?: number | null;
  category?: { id: number; name: string } | null;
  image?: string | null;
  description?: string;
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

const SAMPLE_PRESET_IMAGES = [
  { label: 'Ankara Fabric', url: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=900&q=80', unit: 'yard' },
  { label: 'Suit Cashmere', url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=900&q=80', unit: 'yard' },
  { label: 'Smoked Fish', url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=900&q=80', unit: 'kg' },
  { label: 'Beef Steak', url: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=900&q=80', unit: 'kg' },
  { label: 'Pantry Staples', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80', unit: 'quantity' },
  { label: 'Lounge Chair', url: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=900&q=80', unit: 'quantity' },
];

export default function AdminPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  // Navigation tab: products | customers | analytics | orders
  const [activeTab, setActiveTab] = useState<'products' | 'customers' | 'analytics' | 'orders'>('products');

  // Products state
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const [fetching, setFetching] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterNegotiable, setFilterNegotiable] = useState<'all' | 'negotiable' | 'fixed'>('all');
  const [filterUnit, setFilterUnit] = useState<string>('all');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerGenderFilter, setCustomerGenderFilter] = useState<string>('all');
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<'week' | 'month' | 'year' | 'all'>('month');

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [isPriceAmModalOpen, setIsPriceAmModalOpen] = useState(false);
  const [priceAmProduct, setPriceAmProduct] = useState<AdminProduct | null>(null);
  const [priceAmMin, setPriceAmMin] = useState<string>('');
  const [priceAmMax, setPriceAmMax] = useState<string>('');
  const [selectedCustomerForGoods, setSelectedCustomerForGoods] = useState<AdminCustomer | null>(null);

  // Product Form fields
  const [prodFormName, setProdFormName] = useState('');
  const [prodFormCategory, setProdFormCategory] = useState<number | ''>('');
  const [prodFormDescription, setProdFormDescription] = useState('');
  const [prodFormStock, setProdFormStock] = useState('10');
  const [prodFormUnit, setProdFormUnit] = useState('quantity');
  const [prodFormCustomUnit, setProdFormCustomUnit] = useState('');
  const [prodFormImage, setProdFormImage] = useState('');
  const [prodFormFeatured, setProdFormFeatured] = useState(false);
  // Price Am form controls
  const [prodFormIsNegotiable, setProdFormIsNegotiable] = useState(false);
  const [prodFormPrice, setProdFormPrice] = useState('');
  const [prodFormMinPrice, setProdFormMinPrice] = useState('');
  const [prodFormMaxPrice, setProdFormMaxPrice] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  // Authentication check
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login?redirect=/admin');
      }
    }
  }, [user, loading, router]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load Admin Data
  const loadData = async () => {
    if (!token || user?.role !== 'admin') return;
    setFetching(true);
    try {
      const [prods, cats, ords, custs, anly] = await Promise.all([
        adminApi.products({ limit: 200 }, token) as Promise<AdminProduct[]>,
        categoriesApi.list() as Promise<Category[]>,
        adminApi.orders(token) as Promise<AdminOrder[]>,
        adminApi.customers({ limit: 100 }, token) as Promise<AdminCustomer[]>,
        adminApi.analytics(analyticsTimeframe, token) as Promise<AnalyticsData>,
      ]);
      setProducts(prods || []);
      setCategories(cats || []);
      setOrders(ords || []);
      setCustomers(custs || []);
      setAnalytics(anly || null);
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

  // Reload analytics when timeframe changes
  useEffect(() => {
    if (token && user?.role === 'admin') {
      adminApi.analytics(analyticsTimeframe, token)
        .then(res => setAnalytics(res as AnalyticsData))
        .catch(console.error);
    }
  }, [analyticsTimeframe, token, user]);

  // Open Product Modal (Upload or Edit)
  const openProductModal = (product?: AdminProduct) => {
    if (product) {
      setEditingProduct(product);
      setProdFormName(product.name);
      setProdFormCategory(product.category?.id || '');
      setProdFormDescription(product.description || '');
      setProdFormStock(String(product.stock_quantity));
      const u = product.unit || 'quantity';
      if (['quantity', 'yard', 'kg', 'bundle', 'crate', 'basket', 'pack'].includes(u.toLowerCase())) {
        setProdFormUnit(u.toLowerCase());
        setProdFormCustomUnit('');
      } else {
        setProdFormUnit('custom');
        setProdFormCustomUnit(u);
      }
      setProdFormImage(product.image || '');
      setProdFormFeatured(product.featured);
      setProdFormIsNegotiable(product.is_negotiable);
      setProdFormPrice(String(product.price));
      setProdFormMinPrice(product.min_price ? String(product.min_price) : '');
      setProdFormMaxPrice(product.max_price ? String(product.max_price) : String(product.price));
    } else {
      setEditingProduct(null);
      setProdFormName('');
      setProdFormCategory(categories[0]?.id || '');
      setProdFormDescription('');
      setProdFormStock('20');
      setProdFormUnit('quantity');
      setProdFormCustomUnit('');
      setProdFormImage('');
      setProdFormFeatured(false);
      setProdFormIsNegotiable(false);
      setProdFormPrice('15000');
      setProdFormMinPrice('12000');
      setProdFormMaxPrice('15000');
    }
    setIsProductModalOpen(true);
  };

  // Open Quick Price Am Modal
  const openPriceAmModal = (product: AdminProduct) => {
    setPriceAmProduct(product);
    setPriceAmMin(product.min_price ? String(product.min_price) : String(Math.round(product.price * 0.8)));
    setPriceAmMax(product.max_price ? String(product.max_price) : String(product.price));
    setIsPriceAmModalOpen(true);
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!prodFormName.trim()) {
      showToast('⚠️ Please enter a product name');
      return;
    }

    const effectiveUnit = prodFormUnit === 'custom' ? (prodFormCustomUnit.trim() || 'quantity') : prodFormUnit;
    const stockQty = parseInt(prodFormStock) || 0;

    // Price calculations:
    // If Price Am is on, whatever is set as maximum is what should be displayed as price of the product on the main page!
    let finalPrice = parseFloat(prodFormPrice) || 0;
    let minP = prodFormMinPrice ? parseFloat(prodFormMinPrice) : null;
    let maxP = prodFormMaxPrice ? parseFloat(prodFormMaxPrice) : null;

    if (prodFormIsNegotiable) {
      if (!maxP || maxP <= 0) {
        showToast('⚠️ Please enter a Maximum Amount for Price Am');
        return;
      }
      if (!minP || minP <= 0) {
        showToast('⚠️ Please enter a Minimum Amount for Price Am');
        return;
      }
      if (minP > maxP) {
        showToast('⚠️ Minimum price cannot be higher than Maximum price');
        return;
      }
      finalPrice = maxP; // Storefront price is set to maximum!
    }

    const payload = {
      name: prodFormName.trim(),
      category_id: prodFormCategory ? Number(prodFormCategory) : null,
      description: prodFormDescription.trim(),
      stock_quantity: stockQty,
      unit: effectiveUnit,
      price: finalPrice,
      is_negotiable: prodFormIsNegotiable,
      min_price: prodFormIsNegotiable ? minP : null,
      max_price: prodFormIsNegotiable ? maxP : null,
      image_url: prodFormImage.trim() || null,
      featured: prodFormFeatured,
    };

    setSavingProduct(true);
    try {
      if (editingProduct) {
        await adminApi.updateProduct(editingProduct.id, payload, token);
        showToast(`✅ "${payload.name}" updated successfully!`);
      } else {
        await adminApi.createProduct(payload, token);
        showToast(`🎉 "${payload.name}" uploaded successfully!`);
      }
      setIsProductModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast(`❌ Failed to save product: ${err.message || 'Error occurred'}`);
    } finally {
      setSavingProduct(false);
    }
  };

  // Quick Toggle Price Am
  const handleToggleNegotiable = async (product: AdminProduct) => {
    if (!token || togglingId) return;
    const nextVal = !product.is_negotiable;

    // If turning ON and no min/max exists, open the quick config modal
    if (nextVal && (!product.min_price || !product.max_price)) {
      openPriceAmModal(product);
      return;
    }

    setTogglingId(product.id);
    const minP = nextVal ? product.min_price : null;
    const maxP = nextVal ? product.max_price : null;

    // Optimistic update
    setProducts(prev =>
      prev.map(p =>
        p.id === product.id
          ? { ...p, is_negotiable: nextVal, price: nextVal && maxP ? maxP : p.price }
          : p
      )
    );

    try {
      await adminApi.toggleNegotiable(product.id, nextVal, token, minP, maxP);
      showToast(
        nextVal
          ? `🔥 Price Am enabled for "${product.name}"! Mama Nkechi will bargain with customers.`
          : `ℹ️ Price Am disabled for "${product.name}". Price is fixed.`
      );
    } catch (err) {
      console.error('Error toggling negotiable:', err);
      loadData();
      showToast('❌ Failed to update Price Am status.');
    } finally {
      setTogglingId(null);
    }
  };

  // Save Quick Price Am Modal
  const handleSavePriceAmModal = async () => {
    if (!priceAmProduct || !token) return;
    const minP = parseFloat(priceAmMin);
    const maxP = parseFloat(priceAmMax);

    if (!minP || !maxP || minP <= 0 || maxP <= 0) {
      showToast('⚠️ Please enter valid minimum and maximum prices');
      return;
    }
    if (minP > maxP) {
      showToast('⚠️ Minimum price cannot be greater than Maximum price');
      return;
    }

    try {
      await adminApi.toggleNegotiable(priceAmProduct.id, true, token, minP, maxP);
      showToast(`🔥 Price Am configured for "${priceAmProduct.name}"! Display price: ₦${maxP.toLocaleString()}`);
      setIsPriceAmModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      showToast('❌ Failed to save Price Am settings');
    }
  };

  // Delete product
  const handleDeleteProduct = async (product: AdminProduct) => {
    if (!token) return;
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return;

    try {
      await adminApi.deleteProduct(product.id, token);
      showToast(`🗑️ "${product.name}" deleted.`);
      setProducts(prev => prev.filter(p => p.id !== product.id));
    } catch (err) {
      console.error(err);
      showToast('❌ Failed to delete product.');
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.category?.name && p.category.name.toLowerCase().includes(search.toLowerCase())) ||
        (p.unit && p.unit.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;

      if (filterNegotiable === 'negotiable' && !p.is_negotiable) return false;
      if (filterNegotiable === 'fixed' && p.is_negotiable) return false;

      if (filterUnit !== 'all' && (p.unit || 'quantity').toLowerCase() !== filterUnit.toLowerCase()) {
        return false;
      }

      return true;
    });
  }, [products, search, filterNegotiable, filterUnit]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const q = customerSearch.toLowerCase();
      const matchesSearch =
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (customerGenderFilter !== 'all') {
        if (c.gender?.toLowerCase() !== customerGenderFilter.toLowerCase()) return false;
      }

      return true;
    });
  }, [customers, customerSearch, customerGenderFilter]);

  const stats = useMemo(() => {
    const total = products.length;
    const negotiable = products.filter(p => p.is_negotiable).length;
    const fixed = total - negotiable;
    const inStock = products.filter(p => p.stock_quantity > 0).length;
    return { total, negotiable, fixed, inStock };
  }, [products]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <span className="spinner" style={{ borderColor: 'var(--red)', borderTopColor: 'transparent', width: 44, height: 44 }} />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="container" style={{ padding: '80px 20px', maxWidth: 600, textAlign: 'center' }}>
        <div style={{ background: 'var(--white)', padding: 40, borderRadius: 24, boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontSize: 32, marginBottom: 12 }}>Admin Portal Restricted</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 24, fontSize: 16 }}>
            You need store administrator privileges to manage products, customers, and view business analytics.
          </p>
          <Link href="/auth/login?redirect=/admin" className="primary-button" style={{ display: 'inline-block', padding: '14px 28px' }}>
            Sign in as Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '36px 0 70px' }}>
      {/* Toast Notification */}
      {toastMessage && <div className="admin-toast">{toastMessage}</div>}

      {/* Admin Header */}
      <div className="admin-header-row" style={{ marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>👑</span>
            <span style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--red)', background: '#fee2e2', padding: '4px 12px', borderRadius: 999 }}>
              Buy Am Central Command
            </span>
          </div>
          <h1 style={{ fontSize: 38, margin: 0 }}>Marketplace Administration</h1>
          <p style={{ color: 'var(--muted)', margin: '6px 0 0', fontSize: 16 }}>
            Manage inventory units, Price Am AI negotiation limits, customer orders, and sales data.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="admin-action-btn-primary"
            onClick={() => openProductModal()}
          >
            <span style={{ fontSize: 18 }}>➕</span> Upload New Product
          </button>
          <Link href="/" className="secondary-button" style={{ padding: '11px 20px', fontSize: 14 }}>
            🏪 Storefront
          </Link>
        </div>
      </div>

      {/* High-level Summary KPI Strip */}
      <div className="admin-stats-grid" style={{ marginBottom: 28 }}>
        <div className="admin-stat-card">
          <div className="stat-label">Total Inventory</div>
          <div className="stat-val">{stats.total}</div>
          <div className="stat-sub">{stats.inStock} items in stock</div>
        </div>

        <div className="admin-stat-card highlight">
          <div className="stat-label">Price Am Active 🔥</div>
          <div className="stat-val" style={{ color: 'var(--green)' }}>{stats.negotiable}</div>
          <div className="stat-sub">Mama Nkechi pricing live</div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-label">Registered Customers</div>
          <div className="stat-val">{customers.length}</div>
          <div className="stat-sub">Accounts created</div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-val" style={{ color: 'var(--red)', fontSize: 28 }}>
            {analytics ? money(analytics.summary.total_revenue) : '₦…'}
          </div>
          <div className="stat-sub">{orders.length} orders processed</div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="admin-tabs-nav" style={{ gap: 12, marginBottom: 28 }}>
        <button
          className={`admin-tab-btn-pill ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          🏷️ Products & Price Am ({products.length})
        </button>
        <button
          className={`admin-tab-btn-pill ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          👥 Registered Customers ({customers.length})
        </button>
        <button
          className={`admin-tab-btn-pill ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Analysis & Data
        </button>
        <button
          className={`admin-tab-btn-pill ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📦 Store Orders ({orders.length})
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB 1: PRODUCTS & PRICE AM UPLOADS
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'products' && (
        <div className="admin-products-panel">
          {/* Filters Bar */}
          <div className="admin-filters-bar">
            <div className="admin-search-wrap">
              <span aria-hidden="true" style={{ fontSize: 18, color: 'var(--muted)' }}>⌕</span>
              <input
                type="search"
                placeholder="Search products by title, category, or unit (yard, kg, qty)..."
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
                🔥 Price Am ({stats.negotiable})
              </button>
              <button
                type="button"
                className={`filter-pill ${filterNegotiable === 'fixed' ? 'active' : ''}`}
                onClick={() => setFilterNegotiable('fixed')}
              >
                Fixed Price ({stats.fixed})
              </button>
            </div>

            {/* Measurement Unit Filter */}
            <div className="admin-filter-pills">
              <button
                type="button"
                className={`filter-pill ${filterUnit === 'all' ? 'active' : ''}`}
                onClick={() => setFilterUnit('all')}
              >
                All Units
              </button>
              <button
                type="button"
                className={`filter-pill ${filterUnit === 'yard' ? 'active' : ''}`}
                onClick={() => setFilterUnit('yard')}
              >
                ✂️ Yards (Fabric)
              </button>
              <button
                type="button"
                className={`filter-pill ${filterUnit === 'kg' ? 'active' : ''}`}
                onClick={() => setFilterUnit('kg')}
              >
                🐟 / 🥩 Kg (Food)
              </button>
              <button
                type="button"
                className={`filter-pill ${filterUnit === 'quantity' ? 'active' : ''}`}
                onClick={() => setFilterUnit('quantity')}
              >
                📦 Quantity / Pcs
              </button>
            </div>
          </div>

          {fetching ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <span className="spinner" style={{ borderColor: 'var(--red)', borderTopColor: 'transparent', width: 38, height: 38 }} />
              <div style={{ marginTop: 14, color: 'var(--muted)', fontSize: 15 }}>Loading product catalog…</div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <strong>No products matching criteria</strong>
              <span>Try adjusting your search terms or click &ldquo;Upload New Product&rdquo; above.</span>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Stock & Measured In</th>
                    <th>Store Display Price</th>
                    <th style={{ textAlign: 'center' }}>Price Am (Mama Nkechi)</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(prod => {
                    const u = (prod.unit || 'quantity').toLowerCase();
                    return (
                      <tr key={prod.id} className={prod.is_negotiable ? 'row-negotiable' : ''}>
                        {/* Product Column */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 52, height: 52, position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#f1dfc9', flexShrink: 0 }}>
                              {prod.image ? (
                                <Image src={prod.image} alt={prod.name} fill style={{ objectFit: 'cover' }} />
                              ) : null}
                            </div>
                            <div>
                              <Link href={`/products/${prod.slug}`} className="admin-prod-link" target="_blank">
                                {prod.name} ↗
                              </Link>
                              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                                ID #{prod.id} • {prod.status} {prod.featured ? '• ⭐ Featured' : ''}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td>
                          <span className="category-tag">
                            {prod.category?.name || 'General'}
                          </span>
                        </td>

                        {/* Stock & Unit */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: prod.stock_quantity > 0 ? 'var(--ink)' : 'var(--red)' }}>
                              {prod.stock_quantity} available
                            </span>
                            <span className={`unit-badge ${u}`}>
                              Measured in: {prod.unit || 'quantity'}
                            </span>
                          </div>
                        </td>

                        {/* Price */}
                        <td>
                          <div>
                            <span style={{ fontWeight: 800, color: 'var(--red)', fontSize: 17 }}>
                              {money(Number(prod.price))}
                            </span>
                            {prod.unit && prod.unit !== 'quantity' && (
                              <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 4 }}>
                                /{prod.unit}
                              </span>
                            )}
                            {prod.is_negotiable && (
                              <div style={{ fontSize: 11, color: '#b45309', fontWeight: 700, marginTop: 2 }}>
                                (Max / Initial display)
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Price Am Switch & Min/Max */}
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              className={`toggle-switch-btn ${prod.is_negotiable ? 'on' : 'off'}`}
                              onClick={() => handleToggleNegotiable(prod)}
                              disabled={togglingId === prod.id}
                              title={prod.is_negotiable ? "Disable Price Am" : "Enable Price Am"}
                            >
                              <span className="toggle-slider" />
                              <span className="toggle-label">{prod.is_negotiable ? 'ON' : 'OFF'}</span>
                            </button>

                            {prod.is_negotiable ? (
                              <button
                                type="button"
                                className="price-am-chip"
                                onClick={() => openPriceAmModal(prod)}
                                title="Click to edit Min & Max bargaining limits"
                              >
                                <span>Mama Nkechi: ₦{prod.min_price?.toLocaleString() || '…'} – ₦{prod.max_price?.toLocaleString() || '…'}</span>
                                <span style={{ fontSize: 10 }}>✏️</span>
                              </button>
                            ) : (
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>
                                Fixed Price Only
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => openProductModal(prod)}
                              className="secondary-button"
                              style={{ padding: '6px 14px', fontSize: 13, borderRadius: 999 }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(prod)}
                              className="secondary-button"
                              style={{ padding: '6px 12px', fontSize: 13, borderRadius: 999, color: 'var(--red)', borderColor: '#fca5a5' }}
                              title="Delete Product"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 2: REGISTERED CUSTOMERS
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'customers' && (
        <div className="admin-customers-panel">
          {/* Customers Summary Cards */}
          <div className="admin-stats-grid" style={{ marginBottom: 20 }}>
            <div className="admin-stat-card">
              <div className="stat-label">Total Registered Customers</div>
              <div className="stat-val">{customers.length}</div>
              <div className="stat-sub">Verified buyers on Buy Am</div>
            </div>
            <div className="admin-stat-card">
              <div className="stat-label">Female Customers 👩</div>
              <div className="stat-val" style={{ color: '#be185d' }}>
                {customers.filter(c => c.gender?.toLowerCase() === 'female').length}
              </div>
              <div className="stat-sub">Accounts registered</div>
            </div>
            <div className="admin-stat-card">
              <div className="stat-label">Male Customers 👨</div>
              <div className="stat-val" style={{ color: '#1d4ed8' }}>
                {customers.filter(c => c.gender?.toLowerCase() === 'male').length}
              </div>
              <div className="stat-sub">Accounts registered</div>
            </div>
            <div className="admin-stat-card highlight">
              <div className="stat-label">Customer Total Spend</div>
              <div className="stat-val" style={{ color: 'var(--green)', fontSize: 26 }}>
                {money(customers.reduce((acc, c) => acc + c.total_spent, 0))}
              </div>
              <div className="stat-sub">Across all customer orders</div>
            </div>
          </div>

          {/* Search & Gender filter */}
          <div className="admin-filters-bar">
            <div className="admin-search-wrap">
              <span aria-hidden="true" style={{ fontSize: 18, color: 'var(--muted)' }}>⌕</span>
              <input
                type="search"
                placeholder="Search customers by name, email, or phone number..."
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
              />
            </div>

            <div className="admin-filter-pills">
              <button
                type="button"
                className={`filter-pill ${customerGenderFilter === 'all' ? 'active' : ''}`}
                onClick={() => setCustomerGenderFilter('all')}
              >
                All Genders ({customers.length})
              </button>
              <button
                type="button"
                className={`filter-pill ${customerGenderFilter === 'female' ? 'active' : ''}`}
                onClick={() => setCustomerGenderFilter('female')}
              >
                👩 Female ({customers.filter(c => c.gender?.toLowerCase() === 'female').length})
              </button>
              <button
                type="button"
                className={`filter-pill ${customerGenderFilter === 'male' ? 'active' : ''}`}
                onClick={() => setCustomerGenderFilter('male')}
              >
                👨 Male ({customers.filter(c => c.gender?.toLowerCase() === 'male').length})
              </button>
            </div>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="empty-state">
              <strong>No customers found</strong>
              <span>No registered customers match your current filter criteria.</span>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Email Address</th>
                    <th>Phone Number</th>
                    <th>Gender</th>
                    <th>Total Spent</th>
                    <th>Goods Bought</th>
                    <th style={{ textAlign: 'right' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map(cust => {
                    const g = (cust.gender || 'Not specified').toLowerCase();
                    const genderClass = g === 'female' ? 'female' : g === 'male' ? 'male' : 'other';
                    const genderIcon = g === 'female' ? '👩' : g === 'male' ? '👨' : '👤';

                    return (
                      <tr key={cust.id}>
                        {/* Name */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fee2e2', color: 'var(--red)', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                              {cust.first_name[0] || 'U'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: 15 }}>{cust.name}</div>
                              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Joined {cust.created_at}</div>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td>
                          <span style={{ fontSize: 14, color: 'var(--ink)' }}>{cust.email}</span>
                        </td>

                        {/* Phone */}
                        <td>
                          <span style={{ fontSize: 14, fontWeight: 600 }}>{cust.phone}</span>
                        </td>

                        {/* Gender */}
                        <td>
                          <span className={`gender-badge ${genderClass}`}>
                            {genderIcon} {cust.gender}
                          </span>
                        </td>

                        {/* Total Spent */}
                        <td>
                          <div style={{ fontWeight: 800, color: 'var(--green)', fontSize: 15 }}>
                            {money(cust.total_spent)}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                            {cust.orders_count} order{cust.orders_count !== 1 ? 's' : ''}
                          </div>
                        </td>

                        {/* Goods Bought Preview */}
                        <td>
                          <div className="goods-bought-preview">
                            {cust.goods_bought.length === 0 ? (
                              <span style={{ color: 'var(--muted)', fontSize: 13 }}>No purchases yet</span>
                            ) : (
                              <>
                                <span className="goods-bought-chip">
                                  {cust.goods_bought[0].quantity} {cust.goods_bought[0].unit} of {cust.goods_bought[0].product_name}
                                </span>
                                {cust.goods_bought.length > 1 && (
                                  <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>
                                    + {cust.goods_bought.length - 1} more item{cust.goods_bought.length - 1 !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </td>

                        {/* Action */}
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="secondary-button"
                            style={{ padding: '6px 14px', fontSize: 13, borderRadius: 999 }}
                            onClick={() => setSelectedCustomerForGoods(cust)}
                          >
                            View Goods 📦
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 3: ANALYSIS & DATA (STATISTICS & DIAGRAMS)
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'analytics' && (
        <div className="admin-analytics-panel">
          {/* Timeframe Controller Banner */}
          <div className="analytics-highlight-banner">
            <div>
              <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8 }}>
                Live Marketplace Intelligence
              </span>
              <h2 style={{ fontSize: 26, margin: '4px 0 0', color: '#ffffff' }}>
                System Sales & Inventory Analytics
              </h2>
            </div>

            <div className="timeframe-pill-group">
              <button
                type="button"
                className={`timeframe-pill-btn ${analyticsTimeframe === 'week' ? 'active' : ''}`}
                onClick={() => setAnalyticsTimeframe('week')}
              >
                Weekly
              </button>
              <button
                type="button"
                className={`timeframe-pill-btn ${analyticsTimeframe === 'month' ? 'active' : ''}`}
                onClick={() => setAnalyticsTimeframe('month')}
              >
                Monthly
              </button>
              <button
                type="button"
                className={`timeframe-pill-btn ${analyticsTimeframe === 'year' ? 'active' : ''}`}
                onClick={() => setAnalyticsTimeframe('year')}
              >
                Yearly
              </button>
              <button
                type="button"
                className={`timeframe-pill-btn ${analyticsTimeframe === 'all' ? 'active' : ''}`}
                onClick={() => setAnalyticsTimeframe('all')}
              >
                All Time
              </button>
            </div>
          </div>

          {/* Highlight: Food & Groceries Sold Specialty Box */}
          {analytics && (
            <div className="food-sold-card" style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 32 }}>🐟🥩</span>
                  <div>
                    <h3 style={{ fontSize: 20, margin: 0, color: '#065f46' }}>
                      Food & Groceries Sold Breakdown (Fish, Meat, Staples)
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, color: '#047857' }}>
                      Monitored sales volume measured in kg and packs across time periods
                    </p>
                  </div>
                </div>
                <span style={{ background: '#059669', color: '#ffffff', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 800 }}>
                  High Demand Category
                </span>
              </div>

              <div className="food-sold-grid">
                <div className="food-sold-item">
                  <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#047857', marginBottom: 4 }}>
                    Sold This Week
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#065f46' }}>
                    {analytics.food_sold.week.units} Units / Kg
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#059669', marginTop: 2 }}>
                    {money(analytics.food_sold.week.revenue)}
                  </div>
                </div>

                <div className="food-sold-item" style={{ background: '#ecfdf5', borderColor: '#34d399' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#047857', marginBottom: 4 }}>
                    Sold This Month 🔥
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#065f46' }}>
                    {analytics.food_sold.month.units} Units / Kg
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#059669', marginTop: 2 }}>
                    {money(analytics.food_sold.month.revenue)}
                  </div>
                </div>

                <div className="food-sold-item">
                  <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#047857', marginBottom: 4 }}>
                    Sold This Year
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#065f46' }}>
                    {analytics.food_sold.year.units} Units / Kg
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#059669', marginTop: 2 }}>
                    {money(analytics.food_sold.year.revenue)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DIAGRAMS SECTION: BAR CHART & PIE CHART */}
          <div className="charts-grid-2col">
            {/* 1. Bar Chart: Sales & Volume over time */}
            <div className="chart-card">
              <div className="chart-card-header">
                <div>
                  <h3 style={{ fontSize: 20, margin: 0 }}>📊 Sales Revenue Over Time</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--muted)' }}>
                    {analyticsTimeframe === 'week' ? 'Daily sales breakdown for this week' : analyticsTimeframe === 'year' ? 'Monthly performance across this year' : 'Weekly trajectory for this month'}
                  </p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, background: '#fee2e2', color: 'var(--red)', padding: '4px 10px', borderRadius: 999 }}>
                  Bar Chart
                </span>
              </div>

              {analytics && analytics.sales_over_time.length > 0 ? (
                <div>
                  {/* SVG Bar Chart Graphic */}
                  <div style={{ height: 210, display: 'flex', alignItems: 'flex-end', gap: 12, paddingBottom: 24, borderBottom: '2px solid rgba(37, 28, 24, 0.08)' }}>
                    {(() => {
                      const maxRev = Math.max(...analytics.sales_over_time.map(s => s.revenue), 1000);
                      return analytics.sales_over_time.map((item, idx) => {
                        const heightPct = Math.max(12, Math.round((item.revenue / maxRev) * 100));
                        return (
                          <div
                            key={idx}
                            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}
                          >
                            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--red)', marginBottom: 4 }}>
                              {item.revenue > 0 ? `₦${Math.round(item.revenue / 1000)}k` : '0'}
                            </span>
                            <div
                              className="bar-column"
                              style={{
                                width: '100%',
                                maxWidth: 44,
                                height: `${heightPct}%`,
                                background: idx % 2 === 0 ? 'var(--red)' : '#f97316',
                                borderRadius: '8px 8px 3px 3px',
                                boxShadow: '0 4px 12px rgba(227, 30, 36, 0.2)',
                              }}
                              title={`${item.label}: ₦${item.revenue.toLocaleString()} (${item.units} units sold)`}
                            />
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginTop: 8 }}>
                              {item.label}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 13, color: 'var(--muted)' }}>
                    <span>Showing revenue trajectory (₦)</span>
                    <span style={{ fontWeight: 700 }}>Total Units Sold: {analytics.summary.total_goods_sold}</span>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
                  Loading sales chart data…
                </div>
              )}
            </div>

            {/* 2. Pie Chart / Category & Measurement Unit Distribution */}
            <div className="chart-card">
              <div className="chart-card-header">
                <div>
                  <h3 style={{ fontSize: 20, margin: 0 }}>🥧 Category Distribution</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--muted)' }}>
                    Goods sales breakdown by product categories
                  </p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: 999 }}>
                  Pie Chart
                </span>
              </div>

              {analytics && analytics.category_distribution.length > 0 ? (
                <div>
                  {/* SVG Pie Chart / Donut representation */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, margin: '14px 0' }}>
                    <svg width="140" height="140" viewBox="0 0 42 42" style={{ transform: 'rotate(-90deg)', borderRadius: '50%' }}>
                      {(() => {
                        let accumulatedPercent = 0;
                        const colors = ['#e31e24', '#ffc93c', '#4c8c3c', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6'];
                        return analytics.category_distribution.map((cat, idx) => {
                          const strokeDasharray = `${cat.percentage} ${100 - cat.percentage}`;
                          const strokeDashoffset = -accumulatedPercent;
                          accumulatedPercent += cat.percentage;
                          return (
                            <circle
                              key={idx}
                              cx="21"
                              cy="21"
                              r="15.91549430918954"
                              fill="transparent"
                              stroke={colors[idx % colors.length]}
                              strokeWidth="7"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                            />
                          );
                        });
                      })()}
                    </svg>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                      {analytics.category_distribution.slice(0, 4).map((cat, idx) => {
                        const colors = ['#e31e24', '#ffc93c', '#4c8c3c', '#3b82f6'];
                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ width: 10, height: 10, borderRadius: '50%', background: colors[idx] }} />
                              <span style={{ fontWeight: 700 }}>{cat.name}</span>
                            </div>
                            <span style={{ fontWeight: 800, color: 'var(--ink)' }}>{cat.percentage}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Measurement Unit Breakdown: Yards vs Kg vs Quantity */}
                  <div style={{ borderTop: '1px solid rgba(37, 28, 24, 0.08)', paddingTop: 14, marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
                      Measurement Units Ratio (Yards vs Kg vs Pcs)
                    </div>
                    <div style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', background: '#e2e8f0' }}>
                      {analytics.unit_distribution.map((u, i) => {
                        const uColors: Record<string, string> = { yard: '#a21caf', kg: '#047857', quantity: '#2563eb' };
                        const col = uColors[u.unit.toLowerCase()] || '#f59e0b';
                        return (
                          <div
                            key={i}
                            style={{ width: `${u.percentage}%`, background: col }}
                            title={`${u.unit}: ${u.units} items (${u.percentage}%)`}
                          />
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, fontWeight: 700 }}>
                      <span style={{ color: '#a21caf' }}>✂️ Yards (Fabric)</span>
                      <span style={{ color: '#047857' }}>🐟🥩 Kg (Food)</span>
                      <span style={{ color: '#2563eb' }}>📦 Quantity/Pcs</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
                  Loading category distribution…
                </div>
              )}
            </div>
          </div>

          {/* MOST SOLD GOODS LEADERBOARD */}
          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3 style={{ fontSize: 22, margin: 0 }}>🏆 Most Sold Goods Leaderboard</h3>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--muted)' }}>
                  Top-performing products ranked by total volume sold and generated revenue
                </p>
              </div>
              <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 800 }}>
                Top Performers
              </span>
            </div>

            {analytics && analytics.most_sold_goods.length > 0 ? (
              <div className="admin-table-container">
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>Rank</th>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Units Sold</th>
                      <th>Revenue Generated</th>
                      <th style={{ textAlign: 'right' }}>Stock Left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.most_sold_goods.map((prod, idx) => {
                      const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'rank-other';
                      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;
                      return (
                        <tr key={idx}>
                          <td>
                            <span className={`rank-badge ${rankClass}`}>{medal}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 44, height: 44, position: 'relative', borderRadius: 10, overflow: 'hidden', background: '#f1dfc9', flexShrink: 0 }}>
                                {prod.image ? (
                                  <Image src={prod.image} alt={prod.name} fill style={{ objectFit: 'cover' }} />
                                ) : null}
                              </div>
                              <span style={{ fontWeight: 800, fontSize: 15 }}>{prod.name}</span>
                            </div>
                          </td>
                          <td>
                            <span className="category-tag">{prod.category}</span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 800, color: 'var(--ink)', fontSize: 15 }}>
                              {prod.units_sold} {prod.unit || 'units'}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 800, color: 'var(--red)', fontSize: 16 }}>
                              {money(prod.revenue)}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{ fontWeight: 700, color: prod.stock_remaining > 0 ? 'var(--green)' : 'var(--red)' }}>
                              {prod.stock_remaining} remaining
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
                No sales data registered yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 4: ORDERS
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'orders' && (
        <div className="admin-orders-panel">
          {orders.length === 0 ? (
            <div className="empty-state">
              <strong>No orders found</strong>
              <span>Customer transactions will appear here as soon as they complete checkout.</span>
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

      {/* ══════════════════════════════════════════════════════════════
          MODAL 1: PRODUCT UPLOAD & EDIT
      ══════════════════════════════════════════════════════════════ */}
      {isProductModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsProductModalOpen(false)}>
          <div className="admin-modal-content" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h2 style={{ fontSize: 26, margin: 0 }}>
                  {editingProduct ? '✏️ Edit Product' : '🛍️ Upload New Product'}
                </h2>
                <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 14 }}>
                  Fill in product details, amount available, measurement unit, and Price Am settings.
                </p>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setIsProductModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct}>
              {/* Product Name */}
              <div className="admin-form-group">
                <label className="admin-form-label">Product Name / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ankara Wax Fabric, Fresh Catfish, Prime Beef Steak"
                  className="admin-form-input"
                  value={prodFormName}
                  onChange={e => setProdFormName(e.target.value)}
                />
              </div>

              {/* Category */}
              <div className="admin-form-group">
                <label className="admin-form-label">Category</label>
                <select
                  className="admin-form-select"
                  value={prodFormCategory}
                  onChange={e => setProdFormCategory(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon || '📁'} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Available & Unit of Measurement */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Amount Available (Stock) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="admin-form-input"
                    value={prodFormStock}
                    onChange={e => setProdFormStock(e.target.value)}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">What It&apos;s Measured In *</label>
                  <select
                    className="admin-form-select"
                    value={prodFormUnit}
                    onChange={e => setProdFormUnit(e.target.value)}
                  >
                    <option value="quantity">Quantity / Pieces / Items</option>
                    <option value="yard">Yard (Fabrics & Materials for sewing)</option>
                    <option value="kg">Kg (Food, Fish, Meat, Vegetables)</option>
                    <option value="pack">Pack</option>
                    <option value="bundle">Bundle</option>
                    <option value="crate">Crate</option>
                    <option value="basket">Basket</option>
                    <option value="custom">Other (Custom Unit)</option>
                  </select>
                </div>
              </div>

              {/* Quick Preset Unit Buttons */}
              <div className="admin-form-group" style={{ marginTop: -8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
                  Quick select measurement unit:
                </span>
                <div className="unit-selector-grid">
                  {[
                    { label: '✂️ Yard (Fabric)', val: 'yard' },
                    { label: '🐟 / 🥩 Kg (Fish / Meat)', val: 'kg' },
                    { label: '📦 Quantity / Pcs', val: 'quantity' },
                    { label: '🧺 Basket', val: 'basket' },
                    { label: '📦 Pack', val: 'pack' },
                  ].map(btn => (
                    <button
                      key={btn.val}
                      type="button"
                      className={`unit-select-btn ${prodFormUnit === btn.val ? 'active' : ''}`}
                      onClick={() => setProdFormUnit(btn.val)}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Unit Input if selected */}
              {prodFormUnit === 'custom' && (
                <div className="admin-form-group">
                  <label className="admin-form-label">Specify Custom Unit Name</label>
                  <input
                    type="text"
                    placeholder="e.g. rolls, bags, litres, bowls"
                    className="admin-form-input"
                    value={prodFormCustomUnit}
                    onChange={e => setProdFormCustomUnit(e.target.value)}
                  />
                </div>
              )}

              {/* ═══════════ PRICE AM FEATURE SECTION ═══════════ */}
              <div className="price-am-box">
                <div className="price-am-box-header">
                  <div>
                    <strong style={{ fontSize: 16, color: '#92400e', display: 'flex', alignItems: 'center', gap: 6 }}>
                      🔥 Price Am Feature (Mama Nkechi Bargaining AI)
                    </strong>
                    <span style={{ fontSize: 13, color: '#78350f' }}>
                      Allow customers to bargain and negotiate this product with Mama Nkechi
                    </span>
                  </div>

                  <button
                    type="button"
                    className={`toggle-switch-btn ${prodFormIsNegotiable ? 'on' : 'off'}`}
                    onClick={() => setProdFormIsNegotiable(v => !v)}
                  >
                    <span className="toggle-slider" />
                    <span className="toggle-label">{prodFormIsNegotiable ? 'YES' : 'NO'}</span>
                  </button>
                </div>

                {prodFormIsNegotiable ? (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 14 }}>
                      <div>
                        <label className="admin-form-label" style={{ color: '#78350f' }}>
                          Minimum Amount (₦) *
                        </label>
                        <input
                          type="number"
                          required
                          placeholder="e.g. 10000"
                          className="admin-form-input"
                          style={{ borderColor: '#f59e0b', background: '#fff' }}
                          value={prodFormMinPrice}
                          onChange={e => setProdFormMinPrice(e.target.value)}
                        />
                        <span style={{ fontSize: 11, color: '#92400e', marginTop: 4, display: 'block' }}>
                          Mama Nkechi will NOT sell below this floor price.
                        </span>
                      </div>

                      <div>
                        <label className="admin-form-label" style={{ color: '#78350f' }}>
                          Maximum Amount (₦) *
                        </label>
                        <input
                          type="number"
                          required
                          placeholder="e.g. 15000"
                          className="admin-form-input"
                          style={{ borderColor: '#f59e0b', background: '#fff' }}
                          value={prodFormMaxPrice}
                          onChange={e => {
                            setProdFormMaxPrice(e.target.value);
                            setProdFormPrice(e.target.value); // Sync to display price!
                          }}
                        />
                        <span style={{ fontSize: 11, color: '#92400e', marginTop: 4, display: 'block' }}>
                          Starting negotiation price & display price on storefront.
                        </span>
                      </div>
                    </div>

                    <div className="price-am-indicator-notice">
                      💡 <strong>Important Storefront Rule:</strong> Whatever you set as the <strong>Maximum Amount</strong> (₦{Number(prodFormMaxPrice || 0).toLocaleString()}) is what will be displayed as the official price of the product on the storefront!
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: 12 }}>
                    <label className="admin-form-label" style={{ color: '#78350f' }}>
                      Standard Product Price (₦) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 15000"
                      className="admin-form-input"
                      style={{ background: '#fff' }}
                      value={prodFormPrice}
                      onChange={e => setProdFormPrice(e.target.value)}
                    />
                    <span style={{ fontSize: 12, color: '#92400e', marginTop: 4, display: 'block' }}>
                      Fixed price checkout with no AI bargaining.
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="admin-form-group">
                <label className="admin-form-label">Description</label>
                <textarea
                  rows={3}
                  placeholder="Detailed product description, origin, fabric quality or freshness..."
                  className="admin-form-textarea"
                  value={prodFormDescription}
                  onChange={e => setProdFormDescription(e.target.value)}
                />
              </div>

              {/* Image URL & Presets */}
              <div className="admin-form-group">
                <label className="admin-form-label">Product Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  className="admin-form-input"
                  value={prodFormImage}
                  onChange={e => setProdFormImage(e.target.value)}
                />

                <div style={{ marginTop: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
                    Or click a sample market product image:
                  </span>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                    {SAMPLE_PRESET_IMAGES.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setProdFormImage(img.url);
                          setProdFormUnit(img.unit);
                        }}
                        style={{ padding: '4px 10px', fontSize: 12, borderRadius: 8, background: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                      >
                        {img.label} ({img.unit})
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(37, 28, 24, 0.08)' }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsProductModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="admin-action-btn-primary"
                >
                  {savingProduct ? 'Saving Product…' : editingProduct ? 'Save Changes' : 'Upload Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL 2: QUICK PRICE AM CONFIGURATION
      ══════════════════════════════════════════════════════════════ */}
      {isPriceAmModalOpen && priceAmProduct && (
        <div className="admin-modal-backdrop" onClick={() => setIsPriceAmModalOpen(false)}>
          <div className="admin-modal-content" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h2 style={{ fontSize: 24, margin: 0 }}>🔥 Configure Price Am</h2>
                <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 14 }}>
                  Set Mama Nkechi bargaining boundaries for &ldquo;{priceAmProduct.name}&rdquo;.
                </p>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setIsPriceAmModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="admin-form-label">
                  Minimum Amount (₦) — Floor Price
                </label>
                <input
                  type="number"
                  className="admin-form-input"
                  placeholder="e.g. 10000"
                  value={priceAmMin}
                  onChange={e => setPriceAmMin(e.target.value)}
                />
                <span style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, display: 'block' }}>
                  The lowest amount Mama Nkechi can negotiate down to.
                </span>
              </div>

              <div>
                <label className="admin-form-label">
                  Maximum Amount (₦) — Storefront Display Price
                </label>
                <input
                  type="number"
                  className="admin-form-input"
                  placeholder="e.g. 15000"
                  value={priceAmMax}
                  onChange={e => setPriceAmMax(e.target.value)}
                />
                <span style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, display: 'block' }}>
                  Starting price displayed on the storefront.
                </span>
              </div>

              <div className="price-am-indicator-notice">
                Whatever is set as <strong>Maximum (₦{Number(priceAmMax || 0).toLocaleString()})</strong> will be the displayed price on the main page.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsPriceAmModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-action-btn-primary"
                  onClick={handleSavePriceAmModal}
                >
                  Save & Enable Price Am
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL 3: CUSTOMER GOODS BOUGHT BREAKDOWN
      ══════════════════════════════════════════════════════════════ */}
      {selectedCustomerForGoods && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedCustomerForGoods(null)}>
          <div className="admin-modal-content" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h2 style={{ fontSize: 24, margin: 0 }}>
                  🛍️ Goods Bought: {selectedCustomerForGoods.name}
                </h2>
                <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 14 }}>
                  {selectedCustomerForGoods.email} • {selectedCustomerForGoods.phone} • {selectedCustomerForGoods.gender}
                </p>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setSelectedCustomerForGoods(null)}
              >
                ✕
              </button>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: 12, marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 800 }}>TOTAL ORDERS</span>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>{selectedCustomerForGoods.orders_count}</div>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 800 }}>TOTAL SPENT</span>
                  <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--green)' }}>
                    {money(selectedCustomerForGoods.total_spent)}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 800 }}>CUSTOMER SINCE</span>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{selectedCustomerForGoods.created_at}</div>
                </div>
              </div>

              {selectedCustomerForGoods.goods_bought.length === 0 ? (
                <div className="empty-state">
                  <strong>No items purchased yet</strong>
                  <span>This customer has not placed an order yet.</span>
                </div>
              ) : (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Quantity & Unit</th>
                        <th>Unit Price</th>
                        <th>Subtotal</th>
                        <th>Order Ref</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCustomerForGoods.goods_bought.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 800 }}>{item.product_name}</td>
                          <td>
                            <span className="unit-badge">
                              {item.quantity} {item.unit}
                            </span>
                          </td>
                          <td>{money(item.unit_price)}</td>
                          <td style={{ fontWeight: 800, color: 'var(--red)' }}>{money(item.subtotal)}</td>
                          <td style={{ fontSize: 12, color: 'var(--muted)' }}>#{item.order_number}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ marginTop: 20, textAlign: 'right' }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setSelectedCustomerForGoods(null)}
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
