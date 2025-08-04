// src/types/dashboard.enhanced.ts
// Enhanced type definitions for the refactored dashboard architecture

import { 
  DashboardData, 
  DashboardMetrics, 
  DashboardCustomer,
  DashboardOrder,
  DashboardInvoice,
  DashboardBrand,
  DashboardTopItem,
  DashboardAgentPerformance
} from './dashboard';

// Configuration Types
export interface DashboardConfig {
  role: 'brandManager' | 'salesAgent';
  userId: string;
  dateRange: DateRangeConfig;
  filters: DashboardFilters;
  preferences: DashboardPreferences;
}

export interface DateRangeConfig {
  preset: '7_days' | '30_days' | '90_days' | '1_year' | 'custom';
  customStart?: Date;
  customEnd?: Date;
  comparisonMode: 'previous_period' | 'previous_year' | 'custom';
}

export interface DashboardFilters {
  brands?: string[];
  agents?: string[];
  customers?: string[];
  status?: string[];
  dateRange?: DateRangeConfig;
  search?: string;
}

export interface DashboardPreferences {
  metricCardDisplay: 'full' | 'compact';
  chartTheme: 'default' | 'minimal' | 'detailed';
  refreshInterval: number;
  enableAnimations: boolean;
  defaultView: string;
}

// Unified Dashboard Data Structure
export interface UnifiedDashboardData {
  metrics: MetricsData;
  charts: ChartData[];
  tables: TableData[];
  insights: InsightData[];
  alerts: AlertData[];
  lastUpdated: string;
  dataQuality: DataQualityInfo;
}

// Metrics Types
export interface MetricsData {
  primary: MetricItem[];
  secondary: MetricItem[];
  comparison: ComparisonData;
  totals: MetricTotals;
}

export interface MetricItem {
  id: string;
  label: string;
  value: number | string;
  format: 'currency' | 'number' | 'percentage' | 'text';
  trend?: TrendData;
  icon: string;
  color: string;
  drilldown?: DrilldownConfig;
  chartData?: ChartDataPoint[];
  priority: 'high' | 'medium' | 'low';
}

export interface TrendData {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  absoluteChange: number;
  period: string;
  previousValue: number;
}

export interface ComparisonData {
  previousPeriod: MetricComparison;
  previousYear?: MetricComparison;
  target?: MetricComparison;
}

export interface MetricComparison {
  label: string;
  values: Record<string, number>;
  percentageChanges: Record<string, number>;
}

export interface MetricTotals {
  revenue: number;
  orders: number;
  customers: number;
  averageOrderValue: number;
}

// Chart Types
export interface ChartData {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'heatmap' | 'scatter' | 'radar';
  title: string;
  subtitle?: string;
  data: ChartDataPoint[];
  config: ChartConfig;
  interactive: boolean;
  exportable: boolean;
}

export interface ChartDataPoint {
  [key: string]: any;
  date?: string;
  value?: number;
  label?: string;
  category?: string;
}

export interface ChartConfig {
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  colors?: string[];
  showLegend?: boolean;
  showTooltip?: boolean;
  animations?: boolean;
  stacked?: boolean;
  theme?: 'default' | 'minimal' | 'detailed';
}

export interface AxisConfig {
  label?: string;
  format?: string;
  min?: number;
  max?: number;
  tickInterval?: number;
}

// Table Types
export interface TableData {
  id: string;
  title: string;
  columns: TableColumn[];
  rows: TableRow[];
  config: TableConfig;
  actions?: TableAction[];
}

export interface TableColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'date' | 'status' | 'action';
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableRow {
  id: string;
  [key: string]: any;
}

export interface TableConfig {
  pagination?: boolean;
  pageSize?: number;
  sortable?: boolean;
  filterable?: boolean;
  exportable?: boolean;
  selectable?: boolean;
}

export interface TableAction {
  id: string;
  label: string;
  icon?: string;
  handler: (row: TableRow) => void;
  condition?: (row: TableRow) => boolean;
}

// Insight Types
export interface InsightData {
  id: string;
  type: 'ai' | 'rule' | 'trend' | 'anomaly';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
  recommendations: string[];
  data?: any;
  createdAt: string;
}

// Alert Types
export interface AlertData {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  dismissible: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}

// Drilldown Configuration
export interface DrilldownConfig {
  type: 'view' | 'modal' | 'external';
  target: string;
  params?: Record<string, any>;
  preloadData?: boolean;
}

// Data Quality Information
export interface DataQualityInfo {
  completeness: number;
  accuracy: number;
  timeliness: number;
  issues: DataQualityIssue[];
}

export interface DataQualityIssue {
  field: string;
  issue: string;
  severity: 'high' | 'medium' | 'low';
  affectedRecords: number;
}

// Widget Types for Modular Dashboard
export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'custom';
  position: WidgetPosition;
  config: WidgetConfig;
  data?: any;
}

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetConfig {
  title?: string;
  refreshInterval?: number;
  interactive?: boolean;
  customStyles?: Record<string, any>;
}

// API Response Types
export interface DashboardAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    version: string;
    cached?: boolean;
  };
}

// Hook Types
export interface UseDashboardReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
  updateFilters: (filters: Partial<DashboardFilters>) => void;
  updateDateRange: (dateRange: DateRangeConfig) => void;
}

// Service Types
export interface DashboardService {
  fetchDashboardData(config: DashboardConfig): Promise<UnifiedDashboardData>;
  fetchMetrics(userId: string, dateRange: DateRangeConfig): Promise<MetricsData>;
  fetchCharts(userId: string, filters: DashboardFilters): Promise<ChartData[]>;
  fetchTables(userId: string, filters: DashboardFilters): Promise<TableData[]>;
  fetchInsights(userId: string, context: any): Promise<InsightData[]>;
}

// Cache Types
export interface DashboardCache {
  get(key: string): CacheEntry | null;
  set(key: string, data: any, ttl?: number): void;
  clear(pattern?: string): void;
}

export interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

// Export all types
export * from './dashboard'; // Re-export existing types