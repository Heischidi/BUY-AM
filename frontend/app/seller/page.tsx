'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { sellersApi, productsApi, categoriesApi } from '@/lib/api';
import { Seller, Product } from '@/types';
import { money } from '@/hooks/useCart';

export default function SellerDashboard() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '',
    stock_quantity: '1',
  });
  
  // Registration Form
  const [form, setForm] = useState({
    business_name: '',
    description: '',
    phone: '',
    email: '',
    address: '',
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=/seller');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'seller' && token) {
      sellersApi.getMe(token).then(res => setSeller(res as Seller)).catch(console.error);
      productsApi.list().then(res => setProducts((res as any).items.filter((p: Product) => p.seller?.id === seller?.id)));
      categoriesApi.list().then(res => setCategories(res as any[]));
    }
  }, [user, token, seller?.id]);

  if (loading || !user) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await sellersApi.register(form, token);
      window.location.reload(); // Refresh to get updated token/role
    } catch (err) {
      console.error(err);
    }
  };

  if (user.role !== 'seller') {
    return (
      <div className="container" style={{ padding: '60px 0', maxWidth: 600 }}>
        <div style={{ background: 'var(--white)', padding: 40, borderRadius: 24, boxShadow: 'var(--shadow)' }}>
          <h1 style={{ fontSize: 32, marginBottom: 16 }}>Become a Seller</h1>
          <p style={{ color: 'var(--muted)', marginBottom: 32 }}>
            Join thousands of businesses selling on Buy Am. Fill out the form below to register your store.
          </p>

          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Business Name</label>
              <input required value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Business Description</label>
              <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Business Phone</label>
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Business Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label>Business Address</label>
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <button className="primary-button" style={{ width: '100%', marginTop: 12, padding: 16 }}>
              Register Business
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!seller) return <div className="container" style={{ padding: '100px 0' }}><span className="spinner" style={{ borderColor: 'var(--red)', borderTopColor: 'transparent' }} /></div>;

  return (
    <div className="container" style={{ padding: '60px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
        <div>
          <h1>Seller Dashboard</h1>
          <div style={{ color: 'var(--muted)', marginTop: 4 }}>{seller.business_name}</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="secondary-button" onClick={() => router.push('/account')}>
            Go to Customer Account
          </button>
          <button className="primary-button" style={{ background: 'var(--green)' }} onClick={() => { setActiveTab('products'); setIsAddingProduct(true); }}>
            + Add Product
          </button>
        </div>
      </div>

      {seller.verification_status === 'pending' && (
        <div style={{ background: 'var(--yellow)', padding: '16px 24px', borderRadius: 16, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>⏳</span>
          <div>
            <strong style={{ display: 'block' }}>Account pending verification</strong>
            <span style={{ fontSize: 14 }}>You can add products, but they won&apos;t be visible until your account is approved.</span>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: 40 }}>
        {/* Sidebar Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button 
            onClick={() => setActiveTab('dashboard')} 
            style={{ textAlign: 'left', padding: '14px 20px', borderRadius: 16, background: activeTab === 'dashboard' ? 'var(--yellow)' : 'transparent', fontWeight: activeTab === 'dashboard' ? 800 : 500 }}
          >
            📊 Overview
          </button>
          <button 
            onClick={() => setActiveTab('products')} 
            style={{ textAlign: 'left', padding: '14px 20px', borderRadius: 16, background: activeTab === 'products' ? 'var(--yellow)' : 'transparent', fontWeight: activeTab === 'products' ? 800 : 500 }}
          >
            🛍️ Products
          </button>
          <button 
            onClick={() => setActiveTab('orders')} 
            style={{ textAlign: 'left', padding: '14px 20px', borderRadius: 16, background: activeTab === 'orders' ? 'var(--yellow)' : 'transparent', fontWeight: activeTab === 'orders' ? 800 : 500 }}
          >
            📦 Orders
          </button>
          <button 
            onClick={() => setActiveTab('settings')} 
            style={{ textAlign: 'left', padding: '14px 20px', borderRadius: 16, background: activeTab === 'settings' ? 'var(--yellow)' : 'transparent', fontWeight: activeTab === 'settings' ? 800 : 500 }}
          >
            ⚙️ Store Settings
          </button>
        </div>

        {/* Content Area */}
        <div style={{ background: 'var(--white)', padding: 40, borderRadius: 24, boxShadow: 'var(--shadow)' }}>
          
          {activeTab === 'dashboard' && (
            <div>
              <h2 style={{ fontSize: 28, marginBottom: 24 }}>Overview</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <div style={{ padding: 24, borderRadius: 16, background: 'var(--cream)', border: '1px solid rgba(37,28,24,0.08)' }}>
                  <div style={{ color: 'var(--muted)', marginBottom: 8 }}>Total Sales</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--red)' }}>{money(0)}</div>
                </div>
                <div style={{ padding: 24, borderRadius: 16, background: 'var(--cream)', border: '1px solid rgba(37,28,24,0.08)' }}>
                  <div style={{ color: 'var(--muted)', marginBottom: 8 }}>Active Products</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--green)' }}>{products.length}</div>
                </div>
                <div style={{ padding: 24, borderRadius: 16, background: 'var(--cream)', border: '1px solid rgba(37,28,24,0.08)' }}>
                  <div style={{ color: 'var(--muted)', marginBottom: 8 }}>Pending Orders</div>
                  <div style={{ fontSize: 32, fontWeight: 800 }}>0</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 28 }}>My Products</h2>
                {!isAddingProduct && products.length > 0 && (
                  <button className="primary-button" onClick={() => setIsAddingProduct(true)}>Add Product</button>
                )}
              </div>
              
              {isAddingProduct ? (
                <div style={{ background: 'var(--cream)', padding: 24, borderRadius: 16 }}>
                  <h3 style={{ marginBottom: 16 }}>Add New Product</h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!token) return;
                    setUploading(true);
                    try {
                      let image_url = '';
                      if (imageFile) {
                        const formData = new FormData();
                        formData.append('file', imageFile);
                        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');
                        
                        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
                        if (!cloudName) throw new Error("Cloudinary not configured");
                        
                        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                          method: 'POST',
                          body: formData,
                        });
                        const data = await res.json();
                        image_url = data.secure_url;
                      }

                      await productsApi.create({
                        ...productForm,
                        category_id: parseInt(productForm.category_id),
                        price: parseFloat(productForm.price),
                        stock_quantity: parseInt(productForm.stock_quantity),
                        image_url: image_url || undefined
                      }, token);
                      setIsAddingProduct(false);
                      setImageFile(null);
                      // Reload products
                      const res = await productsApi.list();
                      setProducts((res as any).items.filter((p: Product) => p.seller?.id === seller?.id));
                    } catch (err) {
                      console.error(err);
                      alert("Failed to create product. Check if Cloudinary credentials are set.");
                    } finally {
                      setUploading(false);
                    }
                  }}>
                    <div className="form-group">
                      <label>Product Image</label>
                      <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
                    </div>
                    <div className="form-group">
                      <label>Product Name</label>
                      <input required value={productForm.name} onChange={e => setProductForm(f => ({...f, name: e.target.value}))} />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Category / Tag</label>
                        <select required value={productForm.category_id} onChange={e => setProductForm(f => ({...f, category_id: e.target.value}))} style={{ width: '100%', padding: '14px 16px', borderRadius: 16, border: '2px solid rgba(37,28,24,0.1)', background: 'var(--white)' }}>
                          <option value="">Select a category</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Price (₦)</label>
                        <input type="number" required min="0" step="0.01" value={productForm.price} onChange={e => setProductForm(f => ({...f, price: e.target.value}))} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Stock Quantity</label>
                      <input type="number" required min="0" value={productForm.stock_quantity} onChange={e => setProductForm(f => ({...f, stock_quantity: e.target.value}))} />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea rows={3} value={productForm.description} onChange={e => setProductForm(f => ({...f, description: e.target.value}))} />
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                      <button type="submit" className="primary-button" disabled={uploading}>
                        {uploading ? 'Uploading...' : 'Save Product'}
                      </button>
                      <button type="button" className="secondary-button" onClick={() => setIsAddingProduct(false)} disabled={uploading}>Cancel</button>
                    </div>
                  </form>
                </div>
              ) : products.length === 0 ? (
                <div className="empty-state">
                  <strong>No products yet</strong>
                  <span>Start adding products to your store.</span>
                  <button className="primary-button" style={{ marginTop: 16 }} onClick={() => setIsAddingProduct(true)}>Add Product</button>
                </div>
              ) : (
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(37,28,24,0.1)' }}>
                      <th style={{ padding: '12px 8px' }}>Product</th>
                      <th style={{ padding: '12px 8px' }}>Price</th>
                      <th style={{ padding: '12px 8px' }}>Stock</th>
                      <th style={{ padding: '12px 8px' }}>Status</th>
                      <th style={{ padding: '12px 8px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(37,28,24,0.05)' }}>
                        <td style={{ padding: '16px 8px', fontWeight: 600 }}>{p.name}</td>
                        <td style={{ padding: '16px 8px' }}>{money(Number(p.price))}</td>
                        <td style={{ padding: '16px 8px' }}>{p.stock_quantity}</td>
                        <td style={{ padding: '16px 8px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 800, background: p.status === 'active' ? 'rgba(76,140,60,0.1)' : 'rgba(227,30,36,0.1)', color: p.status === 'active' ? 'var(--green)' : 'var(--red)' }}>
                            {p.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px 8px' }}>
                          <button style={{ color: 'var(--ink)', fontWeight: 800, fontSize: 14 }}>Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <h2 style={{ fontSize: 28, marginBottom: 24 }}>Store Orders</h2>
              <div className="empty-state">
                <strong>No orders yet</strong>
                <span>When customers buy your products, they will appear here.</span>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 style={{ fontSize: 28, marginBottom: 24 }}>Store Settings</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div>
                  <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 4 }}>Business Name</div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>{seller.business_name}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 4 }}>Verification Status</div>
                  <div style={{ fontWeight: 800, fontSize: 18, textTransform: 'capitalize' }}>{seller.verification_status}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 4 }}>Description</div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{seller.description || 'No description provided'}</div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
