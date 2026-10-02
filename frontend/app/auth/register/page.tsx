'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/layout/Logo';

export default function Register() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
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
      await register(form);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to register');
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
        
        <h2 style={{ textAlign: 'center' }}>Create account</h2>
        <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: 32 }}>
          Join Nigeria&apos;s premier marketplace
        </p>

        {error && (
          <div style={{ padding: '12px', borderRadius: 12, background: '#fee', color: 'var(--red)', marginBottom: 24, fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>First name</label>
              <input 
                type="text" 
                required 
                value={form.first_name}
                onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Last name</label>
              <input 
                type="text" 
                required 
                value={form.last_name}
                onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email address</label>
            <input 
              type="email" 
              required 
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label>Phone number</label>
            <input 
              type="tel" 
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
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
            {loading ? <span className="spinner" /> : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14 }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: 'var(--red)', fontWeight: 800 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
