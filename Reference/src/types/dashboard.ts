// src/types/dashboard.ts

// Customer period metrics (for selected period)
export interface CustomerPeriodMetrics {
  total_spent: number;
  order_count: number;
  last_order_date: string | null;
}

// Customer lifetime metrics (from metrics map)
export interface CustomerLifetimeMetrics {
  order_count?: number;
  first_order_date?: string;
  last_order_date?: string;
  total_invoiced?: number;
  average_order_value?: number;
  total_paid?: number;
  total_spent?: number;
  payment_performance?: number;
  customer_lifetime_days?: number;
  days_since_last_order?: number | null;
  invoice_count?: number;
}

// Customer
export interface DashboardCustomer {
  id: string;
  customer_id: string;
  customer_name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  status?: string;
  billing_address?: any;
  shipping_address?: any;
  lifetime_metrics: CustomerLifetimeMetrics;
  period_metrics: CustomerPeriodMetrics;
  [key: string]: any; // for extra fields
}

// Order line item
export interface DashboardOrderLineItem {
  item_id: string;
  item_name?: string;
  name?: string; // Backend might send either name or item_name
  brand: string;
  quantity: number;
  total: number;
  [key: string]: any;
}

// Order
export interface DashboardOrder {
  id: string;
  order_number?: string;
  customer_id: string;
  customer_name: string;
  date: string;
  total: number;
  status?: string;
  is_marketplace_order?: boolean;
  marketplace_source?: string;
  line_items: DashboardOrderLineItem[];
  [key: string]: any;
}

// Invoice
export interface DashboardInvoice {
  id: string;
  invoice_number?: string;
  customer_id: string;
  customer_name: string;
  date: string;
  due_date?: string;
  total: number;
  balance: number;
  status: string;
  [key: string]: any;
}

// Brand
export interface DashboardBrand {
  name: string;
  revenue: number;
  quantity: number;
  orderCount: number;
}

// Top Item
export interface DashboardTopItem {
  id: string;
  name: string;
  item_name?: string; // Backend might send either name or item_name
  quantity: number;
  revenue: number;
  brand: string;
  [key: string]: any; // Allow additional properties
}

// Agent Performance
export interface DashboardAgentPerformance {
  agentId: string;
  agentName: string;
  totalRevenue: number;
  totalOrders: number;
  uniqueCustomers: number;
}

// Dashboard Metrics
export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  outstandingInvoices: number;
  totalCustomers: number;
  marketplaceOrders: number;
}

export interface AgentPerformanceData {
  top_customers?: any[];
  top_items?: any[];
  [key: string]: any;
}

export interface AgentInvoicesData {
  invoices?: DashboardInvoice[];
  total_outstanding?: number;
  total_overdue?: number;
  [key: string]: any;
}

// Main Dashboard Data
export interface DashboardData {
  metrics: DashboardMetrics;
  customers?: DashboardCustomer[]; // Optional for agents
  orders: DashboardOrder[];
  invoices?: DashboardInvoice[] | AgentInvoicesData; // Can be array or object
  brands?: DashboardBrand[];
  topItems?: DashboardTopItem[];
  agentPerformance?: DashboardAgentPerformance[];
  performance?: AgentPerformanceData; // Agent-specific
  overview?: any;
  revenue?: any;
  ordersSummary?: any;
  commission?: any;
  role: string;
  dateRange: string;
  loadTime: number;
  dataSource: string;
  lastUpdated: string;
  [key: string]: any;
}

// API Response wrapper
export interface APIResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: string;
}

// Dashboard hook return type
export interface UseDashboardReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
  isStale?: boolean;
  isCached?: boolean;
  clearCache?: () => void;
}

// Dashboard hook options
export interface UseDashboardOptions {
  userId?: string;
  dateRange?: string;
  customDateRange?: {
    start: string;
    end: string;
  };
  autoRefresh?: boolean;
  refreshInterval?: number;
}