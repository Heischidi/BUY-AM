// ─── Core Types ──────────────────────────────────────────────────────────────

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  username?: string;
  email: string;
  phone?: string;
  gender?: string;
  role: 'customer' | 'admin';
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

export interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number;
  discount_percentage?: number;
  discounted_price?: number;
  stock_quantity: number;
  unit?: string;
  status: string;
  featured: boolean;
  is_negotiable?: boolean;
  min_price?: number;
  max_price?: number;
  category?: Category;
  images: ProductImage[];
  created_at: string;
  description?: string;
  sku?: string;
}

export interface CustomerGoodsBought {
  order_id: number;
  order_number: string;
  order_status: string;
  product_id?: number;
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  subtotal: number;
  date?: string;
}

export interface AdminCustomer {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  is_active: boolean;
  created_at: string;
  orders_count: number;
  total_spent: number;
  goods_bought: CustomerGoodsBought[];
}

export interface FoodStatsPeriod {
  units: number;
  revenue: number;
  orders: number;
  label: string;
}

export interface AnalyticsData {
  summary: {
    total_revenue: number;
    total_orders: number;
    total_goods_sold: number;
    total_customers: number;
  };
  food_sold: {
    week: FoodStatsPeriod;
    month: FoodStatsPeriod;
    year: FoodStatsPeriod;
    all: FoodStatsPeriod;
  };
  sales_over_time: Array<{
    label: string;
    revenue: number;
    units: number;
    orders: number;
  }>;
  category_distribution: Array<{
    name: string;
    units: number;
    revenue: number;
    percentage: number;
  }>;
  unit_distribution: Array<{
    unit: string;
    units: number;
    revenue: number;
    percentage: number;
  }>;
  most_sold_goods: Array<{
    id: number;
    name: string;
    category: string;
    unit: string;
    units_sold: number;
    revenue: number;
    image?: string | null;
    stock_remaining: number;
  }>;
  timeframe: 'week' | 'month' | 'year' | 'all';
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


// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface DealAccepted {
  product_id: number;
  product_name: string;
  agreed_price: number;
  original_price: number;
  unit?: string;
  image?: string | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'bot';
  content: string;
  deal?: DealAccepted;
}

export interface ChatResponse {
  reply: string;
  session_token: string;
  products?: Partial<Product>[];
  deal?: DealAccepted;
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
