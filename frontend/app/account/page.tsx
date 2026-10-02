'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useWishlist } from '@/hooks/useWishlist';
import { ordersApi, addressesApi, productsApi } from '@/lib/api';
import { Order, Address, Product } from '@/types';
import { money } from '@/hooks/useCart';
import ProductCard from '@/components/product/ProductCard';

export default function Account() {
  const { user, token, loading, logout, updateMe } = useAuth();
  const { wishlistIds } = useWishlist();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [isEditProfile, setIsEditProfile] = useState(false);

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=/account');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (!token) return;

    if (activeTab === 'orders') {
      ordersApi.list(token).then(res => setOrders(res as Order[]));
    } else if (activeTab === 'addresses') {
      addressesApi.list(token).then(res => setAddresses(res as Address[]));
    } else if (activeTab === 'wishlist' && wishlistIds.size > 0) {
      // Assuming a custom query could fetch multiple products by ID. For simplicity here:
      Promise.all(Array.from(wishlistIds).map(id => productsApi.get(id.toString())))
        .then(res => setWishlistProducts(res.filter(Boolean) as Product[]));
    }
  }, [activeTab, token, wishlistIds]);

  if (loading || !user) return null;

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      await authApi.updateMe(profileForm, token); // Need to add updateMe to api.ts or useAuth
      setIsEditProfile(false);
      window.location.reload();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="container" style={{ padding: '60px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
        <h1>My Account</h1>
        <button onClick={logout} className="secondary-button" style={{ borderColor: 'var(--red)', color: 'var(--red)' }}>
          Sign Out
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: 40 }}>
        {/* Sidebar Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button 
            onClick={() => setActiveTab('orders')} 
            style={{ textAlign: 'left', padding: '14px 20px', borderRadius: 16, background: activeTab === 'orders' ? 'var(--yellow)' : 'transparent', fontWeight: activeTab === 'orders' ? 800 : 500 }}
          >
            📦 My Orders
          </button>
          <button 
            onClick={() => setActiveTab('wishlist')} 
            style={{ textAlign: 'left', padding: '14px 20px', borderRadius: 16, background: activeTab === 'wishlist' ? 'var(--yellow)' : 'transparent', fontWeight: activeTab === 'wishlist' ? 800 : 500 }}
          >
            ♥️ Wishlist
          </button>
          <button 
            onClick={() => setActiveTab('addresses')} 
            style={{ textAlign: 'left', padding: '14px 20px', borderRadius: 16, background: activeTab === 'addresses' ? 'var(--yellow)' : 'transparent', fontWeight: activeTab === 'addresses' ? 800 : 500 }}
          >
            📍 Saved Addresses
          </button>
          <button 
            onClick={() => setActiveTab('profile')} 
            style={{ textAlign: 'left', padding: '14px 20px', borderRadius: 16, background: activeTab === 'profile' ? 'var(--yellow)' : 'transparent', fontWeight: activeTab === 'profile' ? 800 : 500 }}
          >
            👤 Profile Settings
          </button>
          {user.role === 'seller' && (
            <button 
              onClick={() => router.push('/seller')} 
              style={{ textAlign: 'left', padding: '14px 20px', borderRadius: 16, color: 'var(--green)', fontWeight: 800, marginTop: 20 }}
            >
              🏪 Seller Dashboard
            </button>
          )}
        </div>

        {/* Content Area */}
        <div style={{ background: 'var(--white)', padding: 40, borderRadius: 24, boxShadow: 'var(--shadow)' }}>
          
          {/* Orders */}
          {activeTab === 'orders' && (
            <div>
              <h2 style={{ fontSize: 28, marginBottom: 24 }}>Order History</h2>
              {orders.length === 0 ? (
                <div className="empty-state">
                  <strong>No orders yet</strong>
                  <span>When you buy something, it will appear here.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {orders.map(o => (
                    <div key={o.id} style={{ padding: 20, borderRadius: 16, border: '2px solid rgba(37,28,24,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 800, marginBottom: 4 }}>Order #{o.order_number}</div>
                        <div style={{ color: 'var(--muted)', fontSize: 14 }}>
                          {new Date(o.created_at).toLocaleDateString()} • {o.items.length} items
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--red)', marginBottom: 4 }}>
                          {money(Number(o.total))}
                        </div>
                        <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 800, background: o.status === 'delivered' ? 'var(--green)' : 'var(--yellow)', color: o.status === 'delivered' ? '#fff' : '#000' }}>
                          {o.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Wishlist */}
          {activeTab === 'wishlist' && (
            <div>
              <h2 style={{ fontSize: 28, marginBottom: 24 }}>My Wishlist</h2>
              {wishlistProducts.length === 0 ? (
                <div className="empty-state">
                  <strong>Your wishlist is empty</strong>
                  <span>Save items you love by clicking the heart icon.</span>
                </div>
              ) : (
                <div className="product-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  {wishlistProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Addresses */}
          {activeTab === 'addresses' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 28 }}>Saved Addresses</h2>
                <button className="primary-button" style={{ padding: '10px 16px', fontSize: 14 }}>+ Add New</button>
              </div>
              
              {addresses.length === 0 ? (
                <div className="empty-state">
                  <strong>No saved addresses</strong>
                  <span>Add an address for faster checkout.</span>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {addresses.map(addr => (
                    <div key={addr.id} style={{ padding: 20, borderRadius: 16, border: '2px solid rgba(37,28,24,0.08)' }}>
                      {addr.is_default && <span style={{ display: 'inline-block', padding: '4px 8px', background: 'var(--yellow)', borderRadius: 999, fontSize: 12, fontWeight: 800, marginBottom: 12 }}>DEFAULT</span>}
                      <div style={{ fontWeight: 800, marginBottom: 4 }}>{addr.full_name}</div>
                      <div style={{ color: 'var(--muted)', fontSize: 14 }}>{addr.phone}</div>
                      <div style={{ marginTop: 12, fontSize: 14 }}>
                        {addr.address_line}<br />
                        {addr.city}, {addr.state}<br />
                        {addr.country}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Profile */}
          {activeTab === 'profile' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 28 }}>Profile Settings</h2>
                {!isEditProfile && (
                  <button className="secondary-button" onClick={() => setIsEditProfile(true)}>Edit Profile</button>
                )}
              </div>

              {isEditProfile ? (
                <form onSubmit={handleProfileUpdate}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name</label>
                      <input value={profileForm.first_name} onChange={e => setProfileForm(f => ({ ...f, first_name: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input value={profileForm.last_name} onChange={e => setProfileForm(f => ({ ...f, last_name: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                    <button type="submit" className="primary-button">Save Changes</button>
                    <button type="button" className="secondary-button" onClick={() => setIsEditProfile(false)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <div>
                    <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 4 }}>Name</div>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>{user.first_name} {user.last_name}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 4 }}>Email Address</div>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>{user.email}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 4 }}>Phone Number</div>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>{user.phone || 'Not set'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 4 }}>Account Type</div>
                    <div style={{ fontWeight: 800, fontSize: 18, textTransform: 'capitalize' }}>{user.role}</div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
