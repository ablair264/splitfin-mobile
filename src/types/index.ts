// src/types/index.ts

// User types
export interface User {
  id: string;
  email: string;
  displayName?: string;
  role: 'customer' | 'sales_agent' | 'brand_manager' | 'admin';
  photoURL?: string;
  createdAt: Date;
  lastLoginAt?: Date;
}

// Customer types
export interface Customer {
  id: string;
  customer_id: string;
  customer_name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  status?: 'active' | 'inactive' | 'pending';
  billing_address?: Address;
  shipping_address?: Address;
  sales_agent_id?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Address type
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

// Product/Item types
export interface Product {
  id: string;
  item_id: string;
  item_name: string;
  description?: string;
  sku: string;
  ean?: string;
  brand?: string;
  manufacturer?: string;
  stock_on_hand: number;
  available_stock: number;
  purchase_rate: number;
  rate: number; // selling price
  status: 'active' | 'inactive';
  image_url?: string;
  category_name?: string;
  reorder_level?: number;
  tags?: string[];
}

// Order types
export interface Order {
  id: string;
  order_number?: string;
  customer_id: string;
  customer_name: string;
  date: string;
  total: number;
  status?: 'pending' | 'processing' | 'completed' | 'cancelled';
  line_items: OrderLineItem[];
  shipping_address?: Address;
  billing_address?: Address;
  notes?: string;
  created_by?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface OrderLineItem {
  item_id: string;
  item_name: string;
  brand?: string;
  quantity: number;
  rate: number;
  total: number;
  discount?: number;
}

// Invoice types
export interface Invoice {
  id: string;
  invoice_number?: string;
  customer_id: string;
  customer_name: string;
  date: string;
  due_date?: string;
  total: number;
  balance: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  line_items?: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  item_id: string;
  item_name: string;
  quantity: number;
  rate: number;
  total: number;
}

// Cart types
export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

// Dashboard metrics
export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  outstandingInvoices: number;
  totalCustomers: number;
  marketplaceOrders?: number;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Products: undefined;
  Orders: undefined;
  Customers: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
