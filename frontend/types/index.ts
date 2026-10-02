// ─── Core Types ──────────────────────────────────────────────────────────────

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'seller' | 'admin';
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  active: boolean;
}

export interface ProductImage {
  id: number;
  url: string;
  alt_text?: string;
  sort_order: number;
}

export interface SellerPublic {
  id: number;
  business_name: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number;
  stock_quantity: number;
  status: string;
  featured: boolean;
  category?: Category;
  images: ProductImage[];
  seller?: SellerPublic;
  created_at: string;
  description?: string;
  sku?: string;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  product?: Product;
}

export interface Cart {
  id: number;
  items: CartItem[];
  subtotal: number;
  item_count: number;
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────

export interface WishlistItem {
  id: number;
  product_id: number;
  product?: Product;
  created_at: string;
}

export interface Wishlist {
  items: WishlistItem[];
  total: number;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export interface OrderItem {
  id: number;
  product_id?: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: number;
  order_number: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_reference?: string;
  shipping_address?: Record<string, string>;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

// ─── Procurement ──────────────────────────────────────────────────────────────

export interface ProcurementRequest {
  id: number;
  item_description: string;
  quantity: number;
  budget?: number;
  delivery_location: string;
  required_date?: string;
  notes?: string;
  status: string;
  created_at: string;
}

// ─── Seller ───────────────────────────────────────────────────────────────────

export interface Seller {
  id: number;
  user_id: number;
  business_name: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant' | 'bot';
  content: string;
}

export interface ChatResponse {
  reply: string;
  session_token: string;
  products?: Partial<Product>[];
}

// ─── Address ──────────────────────────────────────────────────────────────────

export interface Address {
  id: number;
  full_name: string;
  phone?: string;
  address_line: string;
  city: string;
  state: string;
  country: string;
  postal_code?: string;
  is_default: boolean;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
