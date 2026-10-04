// API Client for Buy Am
// All calls go through this client — no hardcoded URLs elsewhere
// API calls use a relative path; Next.js rewrites proxy /api/* → FastAPI backend.

const API_URL = '';

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
};

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const error = await response.json();
      message = error.detail || error.message || message;
    } catch {}
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ─── Auth ──────────────────────────────────────────────────────

export const authApi = {
  register: (data: { first_name: string; last_name: string; email: string; password: string; phone?: string }) =>
    request('/auth/register', { method: 'POST', body: data }),

  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: { email, password } }),

  refresh: (refresh_token: string) =>
    request('/auth/refresh', { method: 'POST', body: { refresh_token } }),

  me: (token: string) =>
    request('/auth/me', { token }),

  updateMe: (data: Partial<{ first_name: string; last_name: string; phone: string }>, token: string) =>
    request('/auth/me', { method: 'PATCH', body: data, token }),
};

// ─── Products ──────────────────────────────────────────────────

export const productsApi = {
  list: (params: Record<string, string | number | boolean | undefined> = {}) => {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join('&');
    return request(`/products${qs ? `?${qs}` : ''}`);
  },

  search: (q: string, params: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams({ q, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])) });
    return request(`/products/search?${qs}`);
  },

  get: (slug: string) => request(`/products/${slug}`),

  featured: (limit = 12) => request(`/products/featured?limit=${limit}`),

  create: (data: unknown, token: string) =>
    request('/products', { method: 'POST', body: data, token }),

  update: (id: number, data: unknown, token: string) =>
    request(`/products/${id}`, { method: 'PATCH', body: data, token }),

  delete: (id: number, token: string) =>
    request(`/products/${id}`, { method: 'DELETE', token }),
};

// ─── Categories ────────────────────────────────────────────────

export const categoriesApi = {
  list: () => request('/categories'),
  get: (slug: string) => request(`/categories/${slug}`),
};

// ─── Cart ──────────────────────────────────────────────────────

export const cartApi = {
  get: (token: string) => request('/cart', { token }),

  addItem: (productId: number, quantity: number, token: string) =>
    request('/cart/items', { method: 'POST', body: { product_id: productId, quantity }, token }),

  updateItem: (itemId: number, quantity: number, token: string) =>
    request(`/cart/items/${itemId}`, { method: 'PATCH', body: { quantity }, token }),

  removeItem: (itemId: number, token: string) =>
    request(`/cart/items/${itemId}`, { method: 'DELETE', token }),

  clear: (token: string) =>
    request('/cart', { method: 'DELETE', token }),
};

// ─── Wishlist ──────────────────────────────────────────────────

export const wishlistApi = {
  get: (token: string) => request('/wishlist', { token }),
  add: (productId: number, token: string) =>
    request(`/wishlist/${productId}`, { method: 'POST', token }),
  remove: (productId: number, token: string) =>
    request(`/wishlist/${productId}`, { method: 'DELETE', token }),
};

// ─── Orders ────────────────────────────────────────────────────

export const ordersApi = {
  list: (token: string) => request('/orders', { token }),
  get: (id: number, token: string) => request(`/orders/${id}`, { token }),
  create: (data: unknown, token: string) =>
    request('/orders', { method: 'POST', body: data, token }),
};

// ─── Payments ──────────────────────────────────────────────────

export const paymentsApi = {
  initialize: (orderId: number, token: string) =>
    request(`/payments/initialize?order_id=${orderId}`, { method: 'POST', token }),
  verify: (reference: string, token: string) =>
    request(`/payments/verify/${reference}`, { token }),
};

// ─── Procurement ───────────────────────────────────────────────

export const procurementApi = {
  submit: (data: unknown, token?: string) =>
    request('/procurement/requests', { method: 'POST', body: data, token }),
  myRequests: (token: string) => request('/procurement/requests/my', { token }),
};

// ─── Sellers ───────────────────────────────────────────────────

export const sellersApi = {
  register: (data: unknown, token: string) =>
    request('/sellers', { method: 'POST', body: data, token }),
  getMe: (token: string) => request('/sellers/me', { token }),
  updateMe: (data: unknown, token: string) =>
    request('/sellers/me', { method: 'PATCH', body: data, token }),
};

// ─── Addresses ─────────────────────────────────────────────────

export const addressesApi = {
  list: (token: string) => request('/users/addresses', { token }),
  add: (data: unknown, token: string) =>
    request('/users/addresses', { method: 'POST', body: data, token }),
  delete: (id: number, token: string) =>
    request(`/users/addresses/${id}`, { method: 'DELETE', token }),
};

// ─── AI / Amara ────────────────────────────────────────────────

export const aiApi = {
  chat: (message: string, sessionToken?: string, token?: string) =>
    request('/ai/chat', {
      method: 'POST',
      body: { message, session_token: sessionToken },
      token,
    }),
};

export { ApiError };
