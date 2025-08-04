// types/salesAgentMetrics.ts
// Type definitions for enhanced sales agent metrics

export interface EnhancedSalesAgentCounters {
  // Standard metrics (existing)
  total_orders_count: number;
  total_orders_value: number;
  orders_shipped_count: number;
  new_customers_count: number;
  
  top_5_customers: Array<{
    customer_id: string;
    customer_name: string;
    order_count: number;
    total_spent: number;
  }>;
  
  top_5_items: Array<{
    item_id: string;
    item_name: string;
    sku: string;
    quantity: number;
    revenue: number;
  }>;
  
  // Enhanced metrics (new)
  average_order_value: number;
  total_commission_earned: number;
  payment_collection_rate: number; // Percentage
  outstanding_amount: number;
  
  customer_segments: {
    new: number;
    low: number;
    medium: number;
    high: number;
  };
  
  repeat_customer_rate: number; // Percentage
  customer_retention_rate: number; // Percentage
  
  top_5_brands: Array<{
    brand: string;
    order_count: number;
    total_revenue: number;
    quantity_sold: number;
  }>;
  
  top_5_regions: Array<{
    region: string;
    customer_count: number;
    total_revenue: number;
  }>;
  
  daily_order_trend: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
  
  average_fulfillment_time: number; // Days
  on_time_delivery_rate: number; // Percentage
  
  category_breakdown: Array<{
    category: string;
    revenue: number;
    percentage: number;
  }>;
  
  // Metadata
  date_range: string;
  calculated_at: any; // Firestore Timestamp
}

// Helper type for chart data
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

// Customer segment colors
export const SEGMENT_COLORS = {
  new: '#79d5e9',
  low: '#4daeac',
  medium: '#61bc8e',
  high: '#fbbf24'
} as const;

// Date range options
export type DateRange = 
  | '7_days'
  | '30_days'
  | '90_days'
  | 'this_week'
  | 'last_week'
  | 'this_month' 
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year'
  | 'last_year';

// Metric card types
export type MetricType = 
  | 'totalOrders'
  | 'totalRevenue'
  | 'totalCommission'
  | 'averageOrderValue'
  | 'ordersShipped'
  | 'newCustomers'
  | 'repeatCustomerRate'
  | 'retentionRate'
  | 'paymentCollectionRate'
  | 'outstandingAmount';