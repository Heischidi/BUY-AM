'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { sellersApi } from '@/lib/api';
import Logo from '@/components/layout/Logo';

export default function BusinessRegister() {
  const [userForm, setUserForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });
  
  const [businessForm, setBusinessForm] = useState({
    business_name: '',
    phone: '',
    address: '',
    bank_name: '',
    account_number: '',
    account_name: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // 1. Create the user account
      const authData: any = await register({
        ...userForm,
        phone: businessForm.phone,
      });
      
      // 2. Register the business profile
      await sellersApi.register(businessForm, authData.access_token);
      
      // 3. Update localStorage user role
      const storedUser = JSON.parse(localStorage.getItem('buyam_user') || '{}');
      storedUser.role = 'seller';
      localStorage.setItem('buyam_user', JSON.stringify(storedUser));
      
      // 4. Redirect to seller dashboard
      window.location.href = '/seller';
    } catch (err: any) {
      setError(err.message || 'Failed to register business');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 600 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <Logo />
        </div>
        
        <h2 style={{ textAlign: 'center' }}>Create a Business Account</h2>
        <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: 32 }}>
          Start selling to millions of Nigerians on Buy Am.
        </p>

        {error && (
          <div style={{ padding: '12px', borderRadius: 12, background: '#fee', color: 'var(--red)', marginBottom: 24, fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <h3 style={{ fontSize: 18, marginBottom: 16 }}>Personal Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label>First name</label>
              <input type="text" required value={userForm.first_name} onChange={e => setUserForm(f => ({ ...f, first_name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Last name</label>
              <input type="text" required value={userForm.last_name} onChange={e => setUserForm(f => ({ ...f, last_name: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email address</label>
              <input type="email" required value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" required value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} />
            </div>
          </div>

          <hr style={{ margin: '32px 0', border: 'none', borderTop: '1px solid rgba(37,28,24,0.1)' }} />
          
          <h3 style={{ fontSize: 18, marginBottom: 16 }}>Business Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Business Name</label>
              <input type="text" required value={businessForm.business_name} onChange={e => setBusinessForm(f => ({ ...f, business_name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Business Phone</label>
              <input type="tel" required value={businessForm.phone} onChange={e => setBusinessForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
          
          <div className="form-group">
            <label>Business Address</label>
            <input type="text" required value={businessForm.address} onChange={e => setBusinessForm(f => ({ ...f, address: e.target.value }))} />
          </div>

          <h4 style={{ fontSize: 16, marginTop: 24, marginBottom: 12 }}>Bank Info for Payouts</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Bank Name</label>
              <input type="text" placeholder="e.g. GTBank" required value={businessForm.bank_name} onChange={e => setBusinessForm(f => ({ ...f, bank_name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Account Number</label>
              <input type="text" maxLength={10} required value={businessForm.account_number} onChange={e => setBusinessForm(f => ({ ...f, account_number: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label>Account Name</label>
            <input type="text" required value={businessForm.account_name} onChange={e => setBusinessForm(f => ({ ...f, account_name: e.target.value }))} />
          </div>

          <button type="submit" className="primary-button" style={{ width: '100%', marginTop: 24, padding: 16 }} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Register Business'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14 }}>
          Already have a business account?{' '}
          <Link href="/auth/business/login" style={{ color: 'var(--red)', fontWeight: 800 }}>
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
