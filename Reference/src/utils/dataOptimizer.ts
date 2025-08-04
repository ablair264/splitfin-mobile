import { DashboardData } from '../types/dashboard';

export const optimizeDataForAI = (data: any, options: {
  maxArrayLength?: number;
  maxDepth?: number;
  excludeFields?: string[];
  includeFields?: string[] | null;
} = {}) => {
  const {
    maxArrayLength = 100,
    maxDepth = 3,
    excludeFields = [],
    includeFields = null,
  } = options;

  function truncateArray(arr: any[], maxLength: number): any[] {
    if (!Array.isArray(arr)) return arr;
    if (arr.length <= maxLength) return arr;
    
    const keepStart = Math.floor(maxLength * 0.7);
    const keepEnd = Math.floor(maxLength * 0.3);
    
    return [
      ...arr.slice(0, keepStart),
      { _truncated: true, totalItems: arr.length },
      ...arr.slice(-keepEnd)
    ];
  }

  function optimizeObject(obj: any, currentDepth: number = 0): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (currentDepth >= maxDepth) return { _truncated: true };
    
    const optimized: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (excludeFields.includes(key)) continue;
      if (includeFields && !includeFields.includes(key)) continue;
      
      if (Array.isArray(value)) {
        optimized[key] = truncateArray(value, maxArrayLength);
      } else if (value && typeof value === 'object') {
        optimized[key] = optimizeObject(value, currentDepth + 1);
      } else {
        optimized[key] = value;
      }
    }
    
    return optimized;
  }

  return optimizeObject(data);
};

export const optimizeDashboardData = (dashboardData: DashboardData) => {
  if (!dashboardData) return {};
  
  // Filter invoices by status for summary
  const outstandingInvoices = dashboardData.invoices?.filter(inv => inv.status !== 'paid') || [];
  const overdueInvoices = dashboardData.invoices?.filter(inv => 
    inv.status !== 'paid' && inv.due_date && new Date(inv.due_date) < new Date()
  ) || [];
  const paidInvoices = dashboardData.invoices?.filter(inv => inv.status === 'paid') || [];
  
  return {
    dateRange: dashboardData.dateRange,
    role: dashboardData.role,
    userId: dashboardData.userId,
    
    // Metrics
    metrics: dashboardData.metrics,
    
    // Limited orders
    orders: dashboardData.orders?.slice(0, 10).map(order => ({
      id: order.id,
      order_number: order.order_number,
      customer_name: order.customer_name,
      date: order.date,
      total: order.total,
      status: order.status
    })) || [],
    
    // Summary of invoices (using filtered arrays)
    invoices: {
      summary: {
        outstanding: outstandingInvoices.length,
        overdue: overdueInvoices.length,
        paid: paidInvoices.length,
        total: dashboardData.metrics?.outstandingInvoices || 0
      }
    },
    
    // Limited performance data
    performance: {
      brands: dashboardData.brands?.slice(0, 5) || [],
      top_customers: dashboardData.customers?.slice(0, 5).map(c => ({
        id: c.id,
        name: c.customer_name,
        total_spent: c.lifetime_metrics?.total_spent || 0
      })) || [],
      top_items: dashboardData.topItems?.slice(0, 5) || []
    },
    
    // Agent performance (now an array)
    agentPerformance: dashboardData.agentPerformance ? {
      summary: {
        totalAgents: dashboardData.agentPerformance.length,
        totalRevenue: dashboardData.agentPerformance.reduce((sum, agent) => sum + agent.totalRevenue, 0),
        totalOrders: dashboardData.agentPerformance.reduce((sum, agent) => sum + agent.totalOrders, 0)
      },
      agents: dashboardData.agentPerformance.slice(0, 3)
    } : null,
    
    // Commission (if available)
    commission: dashboardData.commission || null
  };
};

export const getDataSizeInMB = (data: any): number => {
  const jsonString = JSON.stringify(data);
  const sizeInBytes = new TextEncoder().encode(jsonString).length;
  return sizeInBytes / (1024 * 1024);
};

export const validateDataSize = (data: any, maxSizeMB: number = 10) => {
  const sizeMB = getDataSizeInMB(data);
  
  if (sizeMB > maxSizeMB) {
    console.warn(`Data size (${sizeMB.toFixed(2)}MB) exceeds limit (${maxSizeMB}MB)`);
    return {
      isValid: false,
      size: sizeMB,
      message: `Data too large: ${sizeMB.toFixed(2)}MB (max: ${maxSizeMB}MB)`,
    };
  }
  
  return {
    isValid: true,
    size: sizeMB,
  };
};