import React, { useState, useCallback, useMemo, useEffect, useRef, Suspense } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, Area, AreaChart, RadialBarChart, RadialBar
} from 'recharts';
import { useDashboard } from '../hooks/useDashboard';
import { 
  DashboardData,
  DashboardCustomer,
  DashboardOrder,
  DashboardInvoice,
  DashboardTopItem,
  DashboardMetrics,
  AgentPerformanceData,
  AgentInvoicesData
} from '../types/dashboard';
import CountUp from 'react-countup';
import { auth, db } from '../firebase';
import { collection, doc, updateDoc, getDocs, getDoc, query, where, orderBy, limit } from 'firebase/firestore';
import "./dashboard-minimal.css";
import Lottie from 'lottie-react';
import loaderAnimation from '../loader.json'; 
import { ProgressLoader } from './ProgressLoader';
import { optimizeDataForAI, optimizeDashboardData, validateDataSize } from '../utils/dataOptimizer';
import MetricCard from './shared/MetricCard';
import CardChart from './shared/CardChart';
import CardTable from './shared/CardTable';
import FullGraph from './shared/FullGraph';
import SegmentedButtonGroup from './shared/SegmentedButtonGroup';
import './shared/MetricCard.module.css';
import './shared/CardChart.module.css';
import './shared/CardTable.module.css';
import './shared/FullGraph.module.css';
import AIInsightModal from './AIInsightModal';
import './shared/SegmentedButtonGroup.module.css';
import { TableCard } from './shared';
/* Removed dashboard-layout-fixes.css import */
import DashboardHeader from './shared/DashboardHeader';
import { ColorProvider } from './shared/ColorProvider';

interface SalesAgentDashboardProps {
  userId: string;
}

interface AIInsight {
  insight: string;
  trend: string;
  action: string;
  priority: 'low' | 'medium' | 'high';
  impact: string;
  itemTrends?: any;
  valueAnalysis?: any;
  volumeTrends?: any;
}

interface AIInsightModalState {
  isOpen: boolean;
  insight: AIInsight | null;
  cardTitle: string;
  isLoading: boolean;
  enhanced?: boolean;
}

interface SalesAgentData {
  orders: SalesOrder[];
  invoices: Invoice[];
  customers: Customer[];
  chartData?: {
    revenue: any[];
    orders: any[];
    commission: any[];
    avgOrder: any[];
  };
  metrics: {
    // Standard metrics
    totalOrders: number;
    prevTotalOrders: number;
    totalRevenue: number;
    prevTotalRevenue: number;
    totalCommission: number;
    prevTotalCommission: number;
    newCustomers: number;
    prevNewCustomers: number;
    outstandingInvoices: number;
    prevOutstandingInvoices: number;
    ordersShipped: number;
    prevOrdersShipped: number;
    averageOrderValue: number;
    prevAverageOrderValue: number;
    overdueInvoices: number;
    prevOverdueInvoices: number;
    invoicesPaid: number;
    prevInvoicesPaid: number;
    invoicesDue: number;
    prevInvoicesDue: number;
    
    // Enhanced metrics
    paymentCollectionRate?: number;
    prevPaymentCollectionRate?: number;
    outstandingAmount?: number;
    prevOutstandingAmount?: number;
    repeatCustomerRate?: number;
    prevRepeatCustomerRate?: number;
    retentionRate?: number;
    prevRetentionRate?: number;
    avgFulfillmentTime?: number;
    prevAvgFulfillmentTime?: number;
    onTimeDeliveryRate?: number;
    prevOnTimeDeliveryRate?: number;
    
    // Additional data
    topItems?: any[];
    topBrands?: any[];
    topRegions?: any[];
    customerSegments?: { new: number; low: number; medium: number; high: number; };
    categoryBreakdown?: any[];
    dailyTrend?: any[];
  };
}

interface SalesOrder {
  id: string;
  salesorder_id: string;
  salesorder_number: string;
  customer_id: string;
  company_name: string;
  created_time?: string;  // Made optional
  date?: string;          // Added date field
  total: number;
  status: string;
  shipped_status: string;
  quantity: number;
  [key: string]: any;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  customer_email?: string;
  date: string;
  due_date: string;
  total: number;
  balance: number;
  status: string;
  [key: string]: any;
}

interface Customer {
  customer_id: string;
  customer_name: string;
  order_count: number;
  total_spent: number;
  [key: string]: any;
}

const SalesAgentDashboard: React.FC<SalesAgentDashboardProps> = ({ userId }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine active view from URL path
  const getActiveView = () => {
    const path = location.pathname;
    if (path.includes('/dashboard/orders')) return 'orders';
    if (path.includes('/dashboard/invoices')) return 'invoices';
    return 'overview';
  };
  
  const activeView = getActiveView();
  
  // State management
  const [dateRange, setDateRange] = useState('30_days');
  const [metricDisplayMode, setMetricDisplayMode] = useState<'full' | 'compact'>(
    (localStorage.getItem('metricDisplayMode') as 'full' | 'compact') || 'full'
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const [cardVariants, setCardVariants] = useState({
    totalOrders: 'variant1' as 'variant1' | 'variant2' | 'variant3',
    totalCommission: 'variant1' as 'variant1' | 'variant2' | 'variant3',
    totalRevenue: 'variant1' as 'variant1' | 'variant2' | 'variant3',
    newCustomers: 'variant1' as 'variant1' | 'variant2' | 'variant3',
    outstandingInvoices: 'variant1' as 'variant1' | 'variant2' | 'variant3',
    ordersShipped: 'variant1' as 'variant1' | 'variant2' | 'variant3',
    overdueInvoices: 'variant1' as 'variant1' | 'variant2' | 'variant3',
    invoicesPaid: 'variant1' as 'variant1' | 'variant2' | 'variant3',
    invoicesDue: 'variant1' as 'variant1' | 'variant2' | 'variant3',
    ordersTotal: 'variant1' as 'variant1' | 'variant2' | 'variant3',
    ordersRevenue: 'variant1' as 'variant1' | 'variant2' | 'variant3',
    avgOrderValue: 'variant1' as 'variant1' | 'variant2' | 'variant3'
  });
  
  // Graph colors state
  const [graphColors, setGraphColors] = useState({
    primary: '#79d5e9',
    secondary: '#4daeac',
    tertiary: '#f77d11'
  });
  
  // Bar chart color scheme state
  const [barChartColors, setBarChartColors] = useState<'primary' | 'secondary' | 'tertiary' | 'fourth' | 'fifth' | 'sixth' | 'seventh' | 'eighth' | 'ninth' | 'tenth' | 'eleventh' | 'multicolored'>(() => {
    const stored = localStorage.getItem('barChartColors');
    // Handle backwards compatibility
    if (stored === 'blue') return 'primary';
    if (stored === 'orange') return 'fourth';
    if (stored === 'multicolored') return 'multicolored';
    return (stored as any) || 'primary';
  });
  
  // Chart design state
  const [chartDesign, setChartDesign] = useState<'default' | 'horizontal-bars' | 'pie-with-legend' | 'table'>(
    (localStorage.getItem('chartDesign') as 'default' | 'horizontal-bars' | 'pie-with-legend' | 'table') || 'table'
  );
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [aiInsightModal, setAiInsightModal] = useState<AIInsightModalState>({
    isOpen: false,
    insight: null,
    cardTitle: '',
    isLoading: false
  });
  
  const [data, setData] = useState<SalesAgentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [logoUrl, setLogoUrl] = useState<string | null>(
    localStorage.getItem('dashboardLogo')
  );
  
  // Multicolored palette
  const multicoloredPalette = [
    '#79d5e9',   // primary
    '#799de9',   // secondary
    '#79e9c5',   // tertiary
    '#FF9F00',   // fourth
    '#C96868',   // fifth
    '#4daeac',   // sixth
    '#61bc8e',   // seventh
    '#fbbf24',   // eighth
    '#dc2626',   // ninth
    '#8b5cf6',   // tenth
    '#ec4899'    // eleventh
  ];
  
  // Constants
  const CHART_COLORS = ['#48B79B', '#6B8E71', '#8B7355', '#A66B6B', '#7B9EA6', '#9B7B8F'];
  
  // Memoized values and callbacks - defined BEFORE any conditional returns
  const headerTitle = useMemo(() => {
    switch (activeView) {
      case 'orders': return 'My Orders';
      case 'invoices': return 'Invoices';
      default: return 'Sales Dashboard';
    }
  }, [activeView]);
  
  // Helper to get the name of the previous period
  const getPreviousPeriodName = (dateRange: string): string => {
    switch (dateRange) {
      case '7_days': return '7_days';
      case '30_days': return '30_days';
      case '90_days': return '90_days';
      case 'last_month': return 'last_month';
      case 'quarter': return 'quarter';
      case 'last_quarter': return 'last_quarter';
      case 'this_year': return 'this_year';
      case 'last_year': return 'last_year';
      case '12_months': return '12_months';
      default: return dateRange;
    }
  };

  const getDateRange = (dateRange: string) => {
    const now = new Date();
    let startDate, endDate;
    
    switch (dateRange) {
      case '7_days': {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case '30_days': {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case '90_days': {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 90);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case 'last_month': {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case 'quarter': {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case 'last_quarter': {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const lastQuarter = currentQuarter - 1;
        const lastQuarterYear = lastQuarter < 0 ? now.getFullYear() - 1 : now.getFullYear();
        const lastQuarterMonth = lastQuarter < 0 ? 9 : lastQuarter * 3;
        startDate = new Date(lastQuarterYear, lastQuarterMonth, 1);
        endDate = new Date(lastQuarterYear, lastQuarterMonth + 3, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case 'this_year': {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case 'last_year': {
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case '12_months': {
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 12);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      default:
        // Default to 30 days
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
    }
    
    return { startDate, endDate };
  };

  // Helper to get previous period range based on current dateRange
  type DateRange = { startDate: Date; endDate: Date };
  const getPreviousPeriod = (dateRange: string): DateRange => {
    const now = new Date();
    let startDate, endDate;
    
    switch (dateRange) {
      case '7_days': {
        // Previous 7 days
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 14);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setDate(now.getDate() - 7);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case '30_days': {
        // Previous 30 days
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 60);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setDate(now.getDate() - 30);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case '90_days': {
        // Previous 90 days
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 180);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setDate(now.getDate() - 90);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case 'last_month': {
        // Month before last month
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() - 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case 'quarter': {
        // Previous quarter
        return getDateRange('last_quarter');
      }
      case 'last_quarter': {
        // Quarter before last quarter
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const twoQuartersAgo = currentQuarter - 2;
        const year = twoQuartersAgo < 0 ? now.getFullYear() - 1 : now.getFullYear();
        const month = twoQuartersAgo < 0 ? (4 + twoQuartersAgo) * 3 : twoQuartersAgo * 3;
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 3, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case 'this_year': {
        // Previous year
        return getDateRange('last_year');
      }
      case 'last_year': {
        // Year before last year
        startDate = new Date(now.getFullYear() - 2, 0, 1);
        endDate = new Date(now.getFullYear() - 2, 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case '12_months': {
        // Previous 12 months
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 24);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setMonth(now.getMonth() - 12);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      default:
        // Default to previous 30 days
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 60);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setDate(now.getDate() - 30);
        endDate.setHours(23, 59, 59, 999);
    }
    
    return { startDate, endDate };
  };
  
  // Get current color scheme
  const getBarChartColors = useCallback(() => {
    const colorMap = {
      primary: graphColors.primary,
      secondary: '#799de9',
      tertiary: '#79e9c5',
      fourth: '#FF9F00',
      fifth: '#C96868',
      sixth: '#4daeac',
      seventh: '#61bc8e',
      eighth: '#fbbf24',
      ninth: '#dc2626',
      tenth: '#8b5cf6',
      eleventh: '#ec4899'
    };
    
    if (barChartColors === 'multicolored') {
      return multicoloredPalette;
    }
    
    return [colorMap[barChartColors] || graphColors.primary];
  }, [barChartColors, graphColors.primary]);
  
  // Get color for individual metric cards based on color scheme
  const getMetricCardColor = useCallback((index: number = 0) => {
    const colorMap = {
      primary: graphColors.primary,
      secondary: '#799de9',
      tertiary: '#79e9c5',
      fourth: '#FF9F00',
      fifth: '#C96868',
      sixth: '#4daeac',
      seventh: '#61bc8e',
      eighth: '#fbbf24',
      ninth: '#dc2626',
      tenth: '#8b5cf6',
      eleventh: '#ec4899'
    };
    
    if (barChartColors === 'multicolored') {
      return multicoloredPalette[index % multicoloredPalette.length];
    }
    
    return colorMap[barChartColors] || graphColors.primary;
  }, [barChartColors, graphColors.primary]);
  
  // Define callback functions BEFORE they are used in memoized values
  const generateMetricChartData = useCallback((metricType: string) => {
    if (!data?.orders) return [];
    
    // Sort orders by date first, supporting both created_time and date fields
    const sortedOrders = [...data.orders].sort((a, b) => {
      const dateA = new Date(a.created_time || a.date);
      const dateB = new Date(b.created_time || b.date);
      return dateA.getTime() - dateB.getTime();
    });
    
    // Get last 30 days of data
    const last30Orders = sortedOrders.slice(-30);
    
    const aggregatedData = last30Orders.reduce((acc, order) => {
      const dateField = order.created_time || order.date;
      if (!dateField) return acc;
      
      const date = new Date(dateField).toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: '2-digit' 
      });
      
      if (!acc[date]) {
        acc[date] = { date, value: 0, count: 0 };
      }
      
      switch (metricType) {
        case 'revenue':
          acc[date].value += order.total || 0;
          break;
        case 'commission':
          acc[date].value += (order.total || 0) * 0.125;
          break;
        case 'orders':
          acc[date].count += 1;
          break;
        case 'avgOrder':
          acc[date].value += order.total || 0;
          acc[date].count += 1;
          break;
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(aggregatedData).map(day => ({
      name: day.date,
      value: metricType === 'orders' ? day.count : 
             metricType === 'avgOrder' && day.count > 0 ? (day.value / day.count) : 
             day.value
    }));
  }, [data?.orders]);

  const calculateTrendFromPrevious = useCallback((current: number, previous: number): {
    value: number;
    isPositive: boolean;
  } | undefined => {
    if (!previous || previous === 0) return undefined;
    
    const percentageChange = ((current - previous) / previous) * 100;
    return {
      value: Math.round(Math.abs(percentageChange)),
      isPositive: percentageChange > 0
    };
  }, []);

  const handleAIInsight = useCallback(async (cardTitle: string, metricType: string) => {
    setAiInsightModal({
      isOpen: true,
      insight: null,
      cardTitle,
      isLoading: true
    });

    try {
      const relevantData = {
        metricType,
        dateRange,
        currentValue: data?.metrics[metricType] || 0,
        historicalData: data?.orders?.slice(0, 30) || [],
        role: 'salesAgent',
        commission: data?.metrics.totalCommission || 0
      };

      const optimizedData = optimizeDataForAI(relevantData);
      const isValidSize = validateDataSize(optimizedData);
      
      if (!isValidSize) {
        console.warn('Data too large for AI analysis, truncating...');
      }

      const apiUrl = import.meta.env.VITE_API_BASE || 'https://splitfin-zoho-api.onrender.com';
      const response = await fetch(`${apiUrl}/api/ai/insights`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-ID': userId
        },
        body: JSON.stringify({
          data: optimizedData,
          context: `Sales Agent analyzing ${metricType} for ${dateRange}`,
          enhancedAnalysis: true
        })
      });

      if (!response.ok) throw new Error('Failed to get AI insights');
      
      const result = await response.json();
      
      setAiInsightModal(prev => ({
        ...prev,
        insight: result.insight,
        isLoading: false,
        enhanced: true
      }));
    } catch (error) {
      console.error('Error getting AI insight:', error);
      setAiInsightModal({
        isOpen: true,
        insight: {
          insight: 'Unable to generate insights at this time',
          trend: 'unavailable',
          action: 'Please try again in a few moments',
          priority: 'medium',
          impact: 'Analysis temporarily unavailable'
        },
        cardTitle,
        isLoading: false
      });
    }
  }, [data, userId, dateRange]);

  const handleInvoiceReminder = async (invoiceId: string, customerEmail: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE || 'https://splitfin-zoho-api.onrender.com';
      
      await fetch(`${apiUrl}/api/invoices/remind`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId
        },
        body: JSON.stringify({
          invoiceId,
          customerEmail
        })
      });
      
      const invoiceRef = doc(db, 'invoices', invoiceId);
      await updateDoc(invoiceRef, {
        lastReminded: new Date().toISOString()
      });
      
      fetchSalesAgentData();
    } catch (error) {
      console.error('Failed to send reminder:', error);
    }
  };

  // Prepare chart data generation functions and memoized values
  const chartDataCache = useMemo(() => {
    // Use cached chart data if available, otherwise generate from orders
    if (data?.chartData) {
      return data.chartData;
    }
    return {
      revenue: generateMetricChartData('revenue'),
      orders: generateMetricChartData('orders'),
      avgOrder: generateMetricChartData('avgOrder'),
      commission: generateMetricChartData('commission')
    };
  }, [data?.chartData, generateMetricChartData]);

  const currentBarChartColors = useMemo(() => getBarChartColors(), [getBarChartColors]);

  const updateDashboardState = useCallback((updates: any) => {
    if (updates.metricDisplayMode) setMetricDisplayMode(updates.metricDisplayMode);
    if (updates.barChartColors) setBarChartColors(updates.barChartColors);
    if (updates.chartDesign) setChartDesign(updates.chartDesign);
    if (updates.cardVariants) setCardVariants(updates.cardVariants);
    if (updates.graphColors) setGraphColors(updates.graphColors);
  }, []);

  const EmptyState = useCallback(({ message }: { message: string }) => (
    <div style={{
      padding: '2rem',
      textAlign: 'center',
      color: 'var(--text-secondary)',
      fontSize: '0.875rem'
    }}>
      {message}
    </div>
  ), []);

  const fetchSalesAgentData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user data to find sales agent ID
      const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', userId)));
      if (userDoc.empty) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.docs[0].data();
      const salesAgentId = userData.zohospID;
      
      if (!salesAgentId) {
        throw new Error('Sales agent ID not found');
      }
      
      // Get metrics from counters collection
      const currentCounterRef = doc(db, 'sales_agents', salesAgentId, 'counters', dateRange);
      const prevPeriodName = getPreviousPeriodName(dateRange);
      const prevCounterRef = doc(db, 'sales_agents', salesAgentId, 'counters', prevPeriodName);
      
      const [currentCounterDoc, prevCounterDoc] = await Promise.all([
        getDoc(currentCounterRef),
        getDoc(prevCounterRef)
      ]);
      
      const currentMetrics = currentCounterDoc.exists() ? currentCounterDoc.data() : null;
      const prevMetrics = prevCounterDoc.exists() ? prevCounterDoc.data() : null;
      
      if (currentMetrics) {
        // Use enhanced cached metrics from counters
        const totalRevenue = currentMetrics.total_orders_value || 0;
        const totalCommission = currentMetrics.total_commission_earned || totalRevenue * 0.125;
        const prevTotalRevenue = prevMetrics?.total_orders_value || 0;
        const prevTotalCommission = prevMetrics?.total_commission_earned || prevTotalRevenue * 0.125;
        
        // Process daily trend data for charts
        const dailyTrendData = currentMetrics.daily_order_trend || [];
        const revenueChartData = dailyTrendData.map(day => ({
          name: new Date(day.date).toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: '2-digit' 
          }),
          value: day.revenue,
          orders: day.orders
        }));
        
        const ordersChartData = dailyTrendData.map(day => ({
          name: new Date(day.date).toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: '2-digit' 
          }),
          value: day.orders
        }));
        
        const commissionChartData = dailyTrendData.map(day => ({
          name: new Date(day.date).toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: '2-digit' 
          }),
          value: day.revenue * 0.125
        }));
        
        const avgOrderChartData = dailyTrendData.map(day => ({
          name: new Date(day.date).toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: '2-digit' 
          }),
          value: day.orders > 0 ? day.revenue / day.orders : 0
        }));
        
        // Store chart data in state for later use
        
        setData({
          orders: [], // Will be loaded separately
          invoices: [], // Will be loaded separately
          customers: currentMetrics.top_5_customers || [],
          chartData: {
            revenue: revenueChartData,
            orders: ordersChartData,
            commission: commissionChartData,
            avgOrder: avgOrderChartData
          },
          metrics: {
            // Standard metrics
            totalOrders: currentMetrics.total_orders_count || 0,
            prevTotalOrders: prevMetrics?.total_orders_count || 0,
            totalRevenue,
            prevTotalRevenue,
            totalCommission,
            prevTotalCommission,
            newCustomers: currentMetrics.new_customers_count || 0,
            prevNewCustomers: prevMetrics?.new_customers_count || 0,
            ordersShipped: currentMetrics.orders_shipped_count || 0,
            prevOrdersShipped: prevMetrics?.orders_shipped_count || 0,
            
            // Enhanced metrics
            averageOrderValue: currentMetrics.average_order_value || 0,
            prevAverageOrderValue: prevMetrics?.average_order_value || 0,
            paymentCollectionRate: currentMetrics.payment_collection_rate || 0,
            prevPaymentCollectionRate: prevMetrics?.payment_collection_rate || 0,
            outstandingAmount: currentMetrics.outstanding_amount || 0,
            prevOutstandingAmount: prevMetrics?.outstanding_amount || 0,
            repeatCustomerRate: currentMetrics.repeat_customer_rate || 0,
            prevRepeatCustomerRate: prevMetrics?.repeat_customer_rate || 0,
            retentionRate: currentMetrics.customer_retention_rate || 0,
            prevRetentionRate: prevMetrics?.customer_retention_rate || 0,
            avgFulfillmentTime: currentMetrics.average_fulfillment_time || 0,
            prevAvgFulfillmentTime: prevMetrics?.average_fulfillment_time || 0,
            onTimeDeliveryRate: currentMetrics.on_time_delivery_rate || 0,
            prevOnTimeDeliveryRate: prevMetrics?.on_time_delivery_rate || 0,
            
            // Store additional data for components
            topItems: currentMetrics.top_5_items || [],
            topBrands: currentMetrics.top_5_brands || [],
            topRegions: currentMetrics.top_5_regions || [],
            customerSegments: currentMetrics.customer_segments || { new: 0, low: 0, medium: 0, high: 0 },
            categoryBreakdown: currentMetrics.category_breakdown || [],
            dailyTrend: currentMetrics.daily_order_trend || [],
            
            // Invoice metrics (still need to fetch separately)
            outstandingInvoices: 0,
            prevOutstandingInvoices: 0,
            overdueInvoices: 0,
            prevOverdueInvoices: 0,
            invoicesPaid: 0,
            prevInvoicesPaid: 0,
            invoicesDue: 0,
            prevInvoicesDue: 0,
          }
        });
        
        // Fetch recent orders for the table (not restricted by date range)
        const ordersSnapshot = await getDocs(
          query(
            collection(db, 'sales_agents', salesAgentId, 'customers_orders'),
            orderBy('date', 'desc'),
            limit(20)
          )
        );
        
        const recentOrders: SalesOrder[] = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as SalesOrder));
        
        // Fetch invoice data separately if needed
        const invoicesQuery = query(
          collection(db, 'sales_agents', salesAgentId, 'customers_invoices')
        );
        const invoicesSnapshot = await getDocs(invoicesQuery);
        const allInvoices: Invoice[] = invoicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Invoice[];
        
        // Calculate invoice metrics for the current period
        const { startDate, endDate } = getDateRange(dateRange);
        const startISO = startDate.toISOString().split('T')[0];
        const endISO = endDate.toISOString().split('T')[0];
        
        const invoicesInRange = allInvoices.filter(invoice => {
          if (!invoice.date) return false;
          try {
            const invoiceDate = new Date(invoice.date);
            if (isNaN(invoiceDate.getTime())) return false;
            const invoiceDateStr = invoiceDate.toISOString().split('T')[0];
            return invoiceDateStr >= startISO && invoiceDateStr <= endISO;
          } catch {
            return false;
          }
        });
        
        const outstandingInvoices = invoicesInRange.filter(inv => inv.status !== 'paid').length;
        const overdueInvoices = invoicesInRange.filter(inv => {
          return inv.status !== 'paid' && new Date(inv.due_date) < new Date();
        }).length;
        const invoicesPaid = invoicesInRange.filter(inv => inv.status === 'paid').length;
        const invoicesDue = invoicesInRange.filter(inv => inv.status !== 'paid').length;
        
        setData(prev => ({
          ...prev!,
          orders: recentOrders,
          invoices: invoicesInRange,
          metrics: {
            ...prev!.metrics,
            outstandingInvoices,
            overdueInvoices,
            invoicesPaid,
            invoicesDue
          }
        }));
        
      } else {
        // Fallback to calculating metrics if no cached data
        // (Keep existing fallback code as is)
        console.warn('No cached enhanced metrics found, falling back to calculation');
        const { startDate, endDate } = getDateRange(dateRange);
        const { startDate: prevStart, endDate: prevEnd } = getPreviousPeriod(dateRange);
        const startISO = startDate.toISOString().split('T')[0];
        const endISO = endDate.toISOString().split('T')[0];
        const prevStartISO = prevStart.toISOString().split('T')[0];
        const prevEndISO = prevEnd.toISOString().split('T')[0];
      
      // Fetch orders from sales_agents/{salesAgentId}/customers_orders
      // Note: We'll fetch all orders and filter in memory since created_time might be in a different format
      const ordersQuery = query(
        collection(db, 'sales_agents', salesAgentId, 'customers_orders')
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const allOrders: SalesOrder[] = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SalesOrder[];
      
      // Current period
      const orders = allOrders.filter(order => {
        // Support both created_time and date fields
        const dateField = order.created_time || order.date;
        if (!dateField) return false;
        
        let orderDate: Date;
        try {
          orderDate = new Date(dateField);
          if (isNaN(orderDate.getTime())) return false;
          const orderDateStr = orderDate.toISOString().split('T')[0];
          return orderDateStr >= startISO && orderDateStr <= endISO;
        } catch (error) {
          console.error('Date parsing error:', { orderId: order.id, dateField, error });
          return false;
        }
      });

      // Previous period
      const prevOrders = allOrders.filter(order => {
        // Support both created_time and date fields
        const dateField = order.created_time || order.date;
        if (!dateField) return false;
        
        let orderDate: Date;
        try {
          orderDate = new Date(dateField);
          if (isNaN(orderDate.getTime())) return false;
          const orderDateStr = orderDate.toISOString().split('T')[0];
          return orderDateStr >= prevStartISO && orderDateStr <= prevEndISO;
        } catch (error) {
          console.error('Date parsing error:', { orderId: order.id, dateField, error });
          return false;
        }
      });
      
      // Fetch invoices from sales_agents/{salesAgentId}/customers_invoices
      const invoicesQuery = query(
        collection(db, 'sales_agents', salesAgentId, 'customers_invoices')
      );
      const invoicesSnapshot = await getDocs(invoicesQuery);
      const allInvoices: Invoice[] = invoicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Invoice[];
      
      // Current period
      const invoices = allInvoices.filter(invoice => {
        if (!invoice.date) return false;
        try {
          const invoiceDate = new Date(invoice.date);
          if (isNaN(invoiceDate.getTime())) return false;
          const invoiceDateStr = invoiceDate.toISOString().split('T')[0];
          return invoiceDateStr >= startISO && invoiceDateStr <= endISO;
        } catch {
          return false;
        }
      });

      // Previous period
      const prevInvoices = allInvoices.filter(invoice => {
        if (!invoice.date) return false;
        try {
          const invoiceDate = new Date(invoice.date);
          if (isNaN(invoiceDate.getTime())) return false;
          const invoiceDateStr = invoiceDate.toISOString().split('T')[0];
          return invoiceDateStr >= prevStartISO && invoiceDateStr <= prevEndISO;
        } catch {
          return false;
        }
      });
      
      // Calculate metrics for both periods
      const totalOrders = orders.length;
      const prevTotalOrders = prevOrders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
      const prevTotalRevenue = prevOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const totalCommission = totalRevenue * 0.125;
      const prevTotalCommission = prevTotalRevenue * 0.125;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const prevAverageOrderValue = prevTotalOrders > 0 ? prevTotalRevenue / prevTotalOrders : 0;
      const customerIds = new Set(orders.map(order => order.customer_id));
      const prevCustomerIds = new Set(prevOrders.map(order => order.customer_id));
      const newCustomers = orders.filter(order => {
        const dateField = order.created_time || order.date;
        if (!dateField) return false;
        const orderDate = new Date(dateField);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return orderDate >= thirtyDaysAgo;
      }).length;
      const prevNewCustomers = prevOrders.filter(order => {
        const dateField = order.created_time || order.date;
        if (!dateField) return false;
        const orderDate = new Date(dateField);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return orderDate >= thirtyDaysAgo;
      }).length;
      const outstandingInvoices = invoices.filter(inv => inv.status !== 'paid').length;
      const prevOutstandingInvoices = prevInvoices.filter(inv => inv.status !== 'paid').length;
      const ordersShipped = orders.filter(order => order.shipped_status === 'shipped').length;
      const prevOrdersShipped = prevOrders.filter(order => order.shipped_status === 'shipped').length;
      
      const overdueInvoices = invoices.filter(inv => {
        return inv.status !== 'paid' && new Date(inv.due_date) < new Date();
      }).length;
      const prevOverdueInvoices = prevInvoices.filter(inv => {
        return inv.status !== 'paid' && new Date(inv.due_date) < new Date();
      }).length;
      
      const invoicesPaid = invoices.filter(inv => inv.status === 'paid').length;
      const prevInvoicesPaid = prevInvoices.filter(inv => inv.status === 'paid').length;
      const invoicesDue = invoices.filter(inv => inv.status !== 'paid').length;
      const prevInvoicesDue = prevInvoices.filter(inv => inv.status !== 'paid').length;
      
      // Get top customers by order count
      const customerOrderCounts = orders.reduce((acc, order) => {
        const customerId = order.customer_id;
        if (!acc[customerId]) {
          acc[customerId] = {
            customer_id: customerId,
            customer_name: order.company_name || 'Unknown',
            order_count: 0,
            total_spent: 0
          };
        }
        acc[customerId].order_count++;
        acc[customerId].total_spent += order.total || 0;
        return acc;
      }, {} as Record<string, any>);
      
      const topCustomersByCount = Object.values(customerOrderCounts)
        .sort((a, b) => b.order_count - a.order_count)
        .slice(0, 5);
      
      const topCustomersByValue = Object.values(customerOrderCounts)
        .sort((a, b) => b.total_spent - a.total_spent)
        .slice(0, 5);
      
      // Debug logging
      console.log('Date Range Debug:', {
        dateRange,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        startISO,
        endISO,
        allOrdersCount: allOrders.length,
        filteredOrdersCount: orders.length,
        sampleOrders: allOrders.slice(0, 3).map(o => ({
          id: o.id,
          created_time: o.created_time,
          date: o.date,
          parsedDate: new Date(o.created_time || o.date),
          isValidDate: !isNaN(new Date(o.created_time || o.date).getTime())
        }))
      });
      
      // Additional debug for date issues
      if (orders.length === 0 && allOrders.length > 0) {
        console.warn('No orders after filtering! Check date formats:', {
          sampleDates: allOrders.slice(0, 5).map(o => ({
            created_time: o.created_time,
            date: o.date,
            expectedFormat: 'YYYY-MM-DD or ISO string'
          }))
        });
      }
      
      console.log('Sales Agent Data:', {
        ordersCount: orders.length,
        invoicesCount: invoices.length,
        customersCount: Object.keys(customerOrderCounts).length,
        metrics: {
          totalOrders,
          totalRevenue,
          totalCommission,
          newCustomers,
          outstandingInvoices,
          ordersShipped,
          overdueInvoices,
          invoicesPaid,
          invoicesDue,
          averageOrderValue
        }
      });
      
      setData({
        orders,
        invoices,
        customers: Object.values(customerOrderCounts) as Customer[],
        metrics: {
          totalOrders,
          prevTotalOrders,
          totalRevenue,
          prevTotalRevenue,
          totalCommission,
          prevTotalCommission,
          newCustomers,
          prevNewCustomers,
          outstandingInvoices,
          prevOutstandingInvoices,
          ordersShipped,
          prevOrdersShipped,
          averageOrderValue,
          prevAverageOrderValue,
          overdueInvoices,
          prevOverdueInvoices,
          invoicesPaid,
          prevInvoicesPaid,
          invoicesDue,
          prevInvoicesDue,
        }
      });
      } // End of else block for fallback calculation
      
    } catch (err) {
      console.error('Error fetching sales agent data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [userId, dateRange]);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setLogoUrl(url);
        localStorage.setItem('dashboardLogo', url);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add getCompanyLogo helper
  const getCompanyLogo = (email: string) => {
    if (!email) return null;
    const domain = email.split('@')[1];
    if (!domain) return null;
    const excludedDomains = [
      'gmail.com', 'yahoo.com', 'yahoo.co.uk', 'hotmail.com', 'hotmail.co.uk',
      'outlook.com', 'outlook.co.uk', 'live.com', 'live.co.uk', 'msn.com',
      'aol.com', 'icloud.com', 'me.com', 'mac.com', 'protonmail.com',
      'proton.me', 'yandex.com', 'mail.com', 'gmx.com', 'gmx.co.uk',
      'zoho.com', 'fastmail.com', 'tutanota.com', 'qq.com', '163.com', '126.com'
    ];
    if (excludedDomains.includes(domain.toLowerCase())) {
      return null;
    }
    return `https://logo.clearbit.com/${domain}`;
  };

  // Prepare props for views
  const viewProps = useMemo(() => ({
    data,
    agents: [],
    brands: [],
    items: [],
    invoices: data?.invoices || [],
    dashboardState: {
      dateRange,
      isEditMode,
      metricDisplayMode,
      barChartColors,
      chartDesign,
      cardVariants,
      graphColors
    },
    chartDataCache,
    getBarChartColors: currentBarChartColors,
    getMetricCardColor,
    calculateTrendFromPrevious,
    prepareRevenueOrderData: [],
    handleAIInsight,
    handleInvoiceReminder,
    updateDashboardState,
    navigate,
    orderFilters: {},
    setOrderFilters: () => {},
    invoiceFilters: {},
    setInvoiceFilters: () => {},
    EmptyState,
    graphColors
  }), [
    data, dateRange, isEditMode, metricDisplayMode, barChartColors,
    chartDesign, cardVariants, graphColors, navigate, chartDataCache,
    currentBarChartColors, getMetricCardColor, calculateTrendFromPrevious,
    handleAIInsight, handleInvoiceReminder, updateDashboardState, EmptyState
  ]);

  // Effects
  useEffect(() => {
    fetchSalesAgentData();
  }, [fetchSalesAgentData]);
  
  useEffect(() => {
    if (loading) {
      setLoadingProgress(0);
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      return () => clearInterval(progressInterval);
    } else {
      setLoadingProgress(100);
    }
  }, [loading]);

  // Conditional returns - AFTER all hooks
  if (loading) {
    return (
      <div className="dashboard-loading-container">
        <ProgressLoader progress={loadingProgress} />
        <div className="loading-content">
          <p className="loading-text">Loading your dashboard...</p>
          <div className="loading-details">
            <span>Fetching your sales data</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-content">
          <span className="error-icon">⚠️</span>
          <h2>Unable to load dashboard</h2>
          <p>{error}</p>
          <button onClick={fetchSalesAgentData} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Define topCustomersByCount and topCustomersByValue before rendering
  const topCustomersByCount = (data?.customers || [])
    .slice()
    .sort((a, b) => (b.order_count || 0) - (a.order_count || 0))
    .slice(0, 6);
  const topCustomersByValue = (data?.customers || [])
    .slice()
    .sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
    .slice(0, 6);

  return (
    <div className="dashboard-wrapper" style={{ position: 'relative', minHeight: '100vh' }}>
      <div className="enhanced-dashboard sales-agent-view">
        {/* Dashboard Header */}
        <DashboardHeader
          title="Dashboard"
          subtitle="Sales Agent Overview"
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          isEditMode={isEditMode}
          onEditModeToggle={() => setIsEditMode(!isEditMode)}
          onRefresh={fetchSalesAgentData}
          metricDisplayMode={metricDisplayMode}
          onMetricDisplayModeChange={setMetricDisplayMode}
          barChartColors={barChartColors}
          onBarChartColorsChange={setBarChartColors}
          chartDesign={chartDesign}
          onChartDesignChange={setChartDesign}
        />

        <div className="view-content">
          <div className="dashboard-content-wrapper">
            {/* Wrap with ColorProvider and render Outlet for child routes */}
            <ColorProvider 
              barChartColors={barChartColors}
              graphColors={graphColors}
            >
              <Suspense fallback={<ProgressLoader progress={50} message="Loading view..." />}>
                <Outlet context={viewProps} />
              </Suspense>
            </ColorProvider>
          </div>
        </div>
      </div>

      {/* AI Insight Modal */}
      {aiInsightModal.isOpen && (
        <div className="modal-overlay" onClick={() => setAiInsightModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="modal-content ai-insight-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{aiInsightModal.cardTitle} - AI Analysis</h3>
              <button
                className="modal-close"
                onClick={() => setAiInsightModal(prev => ({ ...prev, isOpen: false }))}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              {aiInsightModal.isLoading ? (
                <div className="insight-loading">
                  <Lottie 
                    animationData={loaderAnimation}
                    loop={true}
                    style={{ width: 100, height: 100 }}
                  />
                  <p>Analyzing your performance data...</p>
                </div>
              ) : aiInsightModal.insight ? (
                <div className="insight-content">
                  <div className="insight-section">
                    <h4>Key Insight</h4>
                    <p>{aiInsightModal.insight.insight}</p>
                  </div>
                  
                  <div className="insight-section">
                    <h4>Trend Analysis</h4>
                    <p>{aiInsightModal.insight.trend}</p>
                  </div>
                  
                  <div className="insight-section">
                    <h4>Recommended Action</h4>
                    <p className="action-text">{aiInsightModal.insight.action}</p>
                  </div>
                  
                  <div className="insight-meta">
                    <span className={`priority ${aiInsightModal.insight.priority}`}>
                      Priority: {aiInsightModal.insight.priority}
                    </span>
                    <span className="impact">
                      Impact: {aiInsightModal.insight.impact}
                    </span>
                  </div>
                </div>
              ) : (
                <p>Unable to generate insights at this time.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesAgentDashboard;