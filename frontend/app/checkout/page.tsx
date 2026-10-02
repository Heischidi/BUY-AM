'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCart, money } from '@/hooks/useCart';
import { ordersApi, paymentsApi } from '@/lib/api';

export default function Checkout() {
  const { user, token, loading: authLoading } = useAuth();
  const { cart, clearCart } = useCart();
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address_line: '',
    city: '',
    state: '',
    country: 'Nigeria',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/checkout');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        full_name: `${user.first_name} ${user.last_name}`,
        phone: user.phone || '',
      }));
    }
  }, [user]);

  if (authLoading || !user) return null;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container empty-state" style={{ margin: '100px auto' }}>
        <strong>Your cart is empty</strong>
        <span>Add some items to checkout.</span>
        <button className="primary-button" style={{ marginTop: 20 }} onClick={() => router.push('/')}>
          Browse market
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Create order
      const order = await ordersApi.create({
        shipping_address: form,
      }, token!) as any;

      // 2. Clear cart
      await clearCart();

      // 3. Initialize Paystack payment
      const paymentRes = await paymentsApi.initialize(order.id, token!) as any;
      
      // 4. Redirect to Paystack
      window.location.href = paymentRes.authorization_url;
      
    } catch (err: any) {
      setError(err.message || 'Failed to process order');
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '60px 0' }}>
      <h1 style={{ marginBottom: 32 }}>Checkout</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 40, alignItems: 'start' }}>
        {/* Form */}
        <div style={{ background: 'var(--white)', padding: 32, borderRadius: 24, boxShadow: 'var(--shadow)' }}>
          <h2 style={{ fontSize: 24, marginBottom: 24 }}>Shipping Details</h2>
          
          {error && (
            <div style={{ padding: '12px', borderRadius: 12, background: '#fee', color: 'var(--red)', marginBottom: 24, fontSize: 14 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} id="checkoutForm">
            <div className="form-group">
              <label>Full Name</label>
              <input required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input required type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Street Address</label>
              <input required value={form.address_line} onChange={e => setForm(f => ({ ...f, address_line: e.target.value }))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input required value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>State</label>
                <input required value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
              </div>
            </div>
          </form>
        </div>

        {/* Summary */}
        <div style={{ background: 'var(--white)', padding: 32, borderRadius: 24, border: '2px solid rgba(37,28,24,0.08)' }}>
          <h2 style={{ fontSize: 24, marginBottom: 24 }}>Order Summary</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            {cart.items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span>{item.quantity}x {item.product?.name}</span>
                <strong>{money(Number(item.unit_price) * item.quantity)}</strong>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid rgba(37,28,24,0.1)', paddingTop: 16, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: 'var(--muted)' }}>
              <span>Subtotal</span>
              <span>{money(Number(cart.subtotal))}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, color: 'var(--muted)' }}>
              <span>Delivery (Flat rate)</span>
              <span>{money(1500)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 800 }}>
              <span>Total</span>
              <span style={{ color: 'var(--red)' }}>{money(Number(cart.subtotal) + 1500)}</span>
            </div>
          </div>

          <button 
            type="submit" 
            form="checkoutForm"
            className="primary-button" 
            style={{ width: '100%', padding: 18, fontSize: 16, background: 'var(--green)' }}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : 'Pay with Paystack'}
          </button>
        </div>
      </div>
    </div>
  );
}
