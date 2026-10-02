'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/layout/Logo';

export default function BusinessLogin() {
  const [form, setForm] = useState({
    username: '', // email
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(form.username, form.password);
      router.push('/seller');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <Logo />
        </div>
        
        <h2 style={{ textAlign: 'center' }}>Business Portal</h2>
        <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: 32 }}>
          Sign in to manage your Buy Am store.
        </p>

        {error && (
          <div style={{ padding: '12px', borderRadius: 12, background: '#fee', color: 'var(--red)', marginBottom: 24, fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Business Email address</label>
            <input 
              type="email" 
              required 
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              required 
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            />
          </div>

          <button 
            type="submit" 
            className="primary-button" 
            style={{ width: '100%', marginTop: 12, padding: 16 }}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : 'Sign in to Store'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14 }}>
          New to Buy Am?{' '}
          <Link href="/auth/business/register" style={{ color: 'var(--red)', fontWeight: 800 }}>
            Register your business
          </Link>
        </p>
      </div>
    </div>
  );
}
