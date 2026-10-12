'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/layout/Logo';

function LoginContent() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const data = await login(username, password);
      if (data && 'user' in data && data.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push(redirect);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login');
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
        
        <h2 style={{ textAlign: 'center' }}>Welcome back</h2>
        <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: 24 }}>
          Sign in to your Buy Am account
        </p>

        {error && (
          <div style={{ padding: '12px', borderRadius: 12, background: '#fee', color: 'var(--red)', marginBottom: 20, fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username or Email</label>
            <input 
              type="text" 
              required 
              placeholder="e.g. Mama Nkechi"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              required 
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <div style={{ margin: '14px 0 18px', padding: '10px 14px', borderRadius: 12, background: '#fffbeb', border: '1px solid #fde68a', fontSize: 13, color: '#92400e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              <strong>👑 Admin:</strong> Mama Nkechi
            </span>
            <button
              type="button"
              onClick={() => {
                setUsername('Mama Nkechi');
                setPassword('mamankechi123%');
              }}
              style={{ fontSize: 12, fontWeight: 800, color: 'var(--red)', cursor: 'pointer', background: 'transparent', border: 'none', textDecoration: 'underline' }}
            >
              Fill Mama Nkechi
            </button>
          </div>

          <button 
            type="submit" 
            className="primary-button" 
            style={{ width: '100%', padding: 16 }}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14 }}>
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" style={{ color: 'var(--red)', fontWeight: 800 }}>
            Create one
          </Link>
        </p>

        <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid #f1f1f1', textAlign: 'center' }}>
          <Link
            href="/staff"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 999,
              background: '#fef2f2',
              color: 'var(--red)',
              fontWeight: 800,
              fontSize: 13,
              textDecoration: 'none',
              border: '1px solid #fca5a5',
            }}
          >
            ⏰ Staff Member? Clock In / Clock Out Here →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="auth-page"><span className="spinner" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
