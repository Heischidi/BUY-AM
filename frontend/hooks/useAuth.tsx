'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, TokenResponse } from '@/types';
import { authApi, ApiError } from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<TokenResponse | void>;
  register: (data: RegisterData) => Promise<TokenResponse | void>;
  logout: () => void;
}

interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone?: string;
}

const AuthContext = createContext<AuthState>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('buyam_token');
    const storedUser = localStorage.getItem('buyam_user');
    if (stored && storedUser) {
      setToken(stored);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const persist = (data: TokenResponse) => {
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('buyam_token', data.access_token);
    localStorage.setItem('buyam_refresh', data.refresh_token);
    localStorage.setItem('buyam_user', JSON.stringify(data.user));
  };

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password) as TokenResponse;
    persist(data);
    return data;
  };

  const register = async (registerData: RegisterData) => {
    const data = await authApi.register(registerData) as TokenResponse;
    persist(data);
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('buyam_token');
    localStorage.removeItem('buyam_refresh');
    localStorage.removeItem('buyam_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
