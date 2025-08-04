// src/utils/dashboardHelpers.ts
// Helper functions for dashboard calculations and data processing

import { DateRangeConfig, TrendData, ChartDataPoint } from '../types/dashboard.enhanced';

/**
 * Calculate trend data by comparing current value with previous period
 */
export const calculateTrend = (
  currentValue: number,
  previousValue: number,
  dateRange: string
): TrendData => {
  const percentageChange = previousValue === 0 
    ? 100 
    : ((currentValue - previousValue) / previousValue) * 100;
  
  return {
    direction: percentageChange > 0 ? 'up' : percentageChange < 0 ? 'down' : 'stable',
    percentage: Math.abs(percentageChange),
    absoluteChange: currentValue - previousValue,
    period: getPreviousPeriodLabel(dateRange),
    previousValue
  };
};

/**
 * Get label for previous period based on date range
 */
export const getPreviousPeriodLabel = (dateRange: string): string => {
  switch (dateRange) {
    case '7_days':
      return 'previous week';
    case '30_days':
      return 'previous month';
    case '90_days':
      return 'previous quarter';
    case '1_year':
      return 'previous year';
    case 'custom':
      return 'previous period';
    default:
      return 'previous period';
  }
};

/**
 * Calculate date range for previous period
 */
export const getPreviousPeriodDates = (
  startDate: Date,
  endDate: Date
): { start: Date; end: Date } => {
  const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const previousEnd = new Date(startDate);
  previousEnd.setDate(previousEnd.getDate() - 1);
  
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - daysDiff);
  
  return { start: previousStart, end: previousEnd };
};

/**
 * Generate chart data from orders or transactions
 */
export const generateChartData = (
  data: any[],
  dateField: string,
  valueField: string,
  aggregationType: 'sum' | 'count' | 'average' = 'sum'
): ChartDataPoint[] => {
  interface AggregatedData {
    values: number[];
    count: number;
  }
  
  const aggregated: Record<string, AggregatedData> = data.reduce((acc, item) => {
    const date = new Date(item[dateField]).toLocaleDateString();
    
    if (!acc[date]) {
      acc[date] = { values: [], count: 0 };
    }
    
    acc[date].values.push(item[valueField] || 0);
    acc[date].count++;
    
    return acc;
  }, {} as Record<string, AggregatedData>);
  
  return (Object.entries(aggregated) as [string, AggregatedData][]).map(([date, aggregatedData]) => {
    let value: number;
    
    switch (aggregationType) {
      case 'count':
        value = aggregatedData.count;
        break;
      case 'average':
        value = aggregatedData.values.reduce((sum, val) => sum + val, 0) / aggregatedData.values.length;
        break;
      case 'sum':
      default:
        value = aggregatedData.values.reduce((sum, val) => sum + val, 0);
    }
    
    return { date, value };
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

/**
 * Format currency value with appropriate suffix
 */
export const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `£${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `£${(value / 1000).toFixed(1)}K`;
  }
  return `£${value.toLocaleString()}`;
};

/**
 * Format number with appropriate suffix
 */
export const formatNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString();
};

/**
 * Calculate percentage of target achieved
 */
export const calculateTargetProgress = (
  current: number,
  target: number
): { percentage: number; remaining: number; onTrack: boolean } => {
  const percentage = (current / target) * 100;
  const remaining = Math.max(0, target - current);
  const onTrack = percentage >= 80; // Consider on track if 80% or more
  
  return { percentage, remaining, onTrack };
};

/**
 * Group data by a specific field
 */
export const groupByField = <T>(
  data: T[],
  field: keyof T
): Record<string, T[]> => {
  return data.reduce((acc, item) => {
    const key = String(item[field]);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);
};

/**
 * Calculate moving average for smoothing chart data
 */
export const calculateMovingAverage = (
  data: ChartDataPoint[],
  period: number
): ChartDataPoint[] => {
  return data.map((point, index) => {
    const start = Math.max(0, index - period + 1);
    const relevantPoints = data.slice(start, index + 1);
    const average = relevantPoints.reduce((sum, p) => sum + (p.value || 0), 0) / relevantPoints.length;
    
    return {
      ...point,
      movingAverage: average
    };
  });
};

/**
 * Get date range presets
 */
export const getDateRangePresets = (): Array<{
  label: string;
  value: string;
  getDates: () => { start: Date; end: Date };
}> => {
  const now = new Date();
  
  return [
    {
      label: 'Last 7 days',
      value: '7_days',
      getDates: () => ({
        start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        end: now
      })
    },
    {
      label: 'Last 30 days',
      value: '30_days',
      getDates: () => ({
        start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        end: now
      })
    },
    {
      label: 'Last 90 days',
      value: '90_days',
      getDates: () => ({
        start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        end: now
      })
    },
    {
      label: 'Last year',
      value: '1_year',
      getDates: () => ({
        start: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
        end: now
      })
    },
    {
      label: 'This month',
      value: 'this_month',
      getDates: () => ({
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: now
      })
    },
    {
      label: 'Last month',
      value: 'last_month',
      getDates: () => {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return {
          start: lastMonth,
          end: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0)
        };
      }
    }
  ];
};

/**
 * Validate data completeness and quality
 */
export const validateDataQuality = (data: any): {
  isValid: boolean;
  issues: string[];
  completeness: number;
} => {
  const issues: string[] = [];
  let validFields = 0;
  let totalFields = 0;
  
  // Check for required fields
  const requiredFields = ['metrics', 'orders', 'role'];
  
  requiredFields.forEach(field => {
    totalFields++;
    if (data[field]) {
      validFields++;
    } else {
      issues.push(`Missing required field: ${field}`);
    }
  });
  
  // Check metrics validity
  if (data.metrics) {
    const metricFields = ['totalRevenue', 'totalOrders', 'totalCustomers'];
    metricFields.forEach(field => {
      totalFields++;
      if (typeof data.metrics[field] === 'number' && data.metrics[field] >= 0) {
        validFields++;
      } else {
        issues.push(`Invalid metric: ${field}`);
      }
    });
  }
  
  const completeness = (validFields / totalFields) * 100;
  
  return {
    isValid: issues.length === 0,
    issues,
    completeness
  };
};

/**
 * Export data to CSV format
 */
export const exportToCSV = (
  data: any[],
  filename: string,
  columns?: { key: string; label: string }[]
): void => {
  if (!data || data.length === 0) return;
  
  // Determine columns if not provided
  const finalColumns = columns || Object.keys(data[0]).map(key => ({ key, label: key }));
  
  // Create CSV content
  const headers = finalColumns.map(col => col.label).join(',');
  const rows = data.map(row => 
    finalColumns.map(col => {
      const value = row[col.key];
      // Escape values containing commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );
  
  const csvContent = [headers, ...rows].join('\n');
  
  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Debounce function for search and filter inputs
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};