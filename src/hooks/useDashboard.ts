// src/hooks/useDashboard.ts
import { useState, useEffect, useCallback } from 'react';
import firebaseService from '../services/firebaseService';
import { useAuthStore } from '../store/authStore';

export interface DashboardData {
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    activeCustomers: number;
    avgOrderValue: number;
    outstandingInvoices: number;
    marketplaceOrders: number;
    ordersThisMonth?: number;
  };
  charts: {
    revenueOverTime: Array<{ date: string; value: number }>;
    ordersByStatus: Array<{ status: string; count: number }>;
    topProducts: Array<{ name: string; sales: number }>;
    customerGrowth: Array<{ month: string; count: number }>;
  };
  recentOrders: Array<{
    id: string;
    customerName: string;
    amount: number;
    status: string;
    date: string;
  }>;
  topCustomers: Array<{
    id: string;
    name: string;
    totalSpent: number;
    orderCount: number;
  }>;
  brandPerformance?: Array<{
    brand: string;
    revenue: number;
    orders: number;
    units: number;
  }>;
  lastUpdated: string;
}

// Simple cache implementation
interface CacheEntry {
  data: DashboardData;
  timestamp: number;
  dateRange: string;
}

const dashboardCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useDashboard = (dateRange: string = '30_days') => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const { user } = useAuthStore();

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    const userId = (user as any)?.id || (user as any)?.uid;
    if (!userId) {
      console.log('No user authenticated, cannot fetch dashboard data');
      setLoading(false);
      setError('Authentication required');
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
        // Clear cache on refresh
        dashboardCache.delete(`${userId}-${dateRange}`);
      } else {
        setLoading(true);
      }
      setError(null);

      // Check cache first (unless refreshing)
      if (!isRefresh) {
        const cacheKey = `${userId}-${dateRange}`;
        const cachedEntry = dashboardCache.get(cacheKey);
        
        if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_DURATION)) {
          console.log('Using cached dashboard data');
          setData(cachedEntry.data);
          setLoading(false);
          return;
        }
      }

      console.log('Fetching fresh dashboard data for user:', userId, 'dateRange:', dateRange);
      
      // Fetch from Firebase
      const response = await firebaseService.dashboard.getData(userId, { dateRange });
      console.log('Dashboard Firebase response:', response);
      
      // Transform the response to match our interface
      const transformedData: DashboardData = {
        metrics: {
          totalRevenue: response?.metrics?.totalRevenue || 0,
          totalOrders: response?.metrics?.totalOrders || 0,
          activeCustomers: response?.metrics?.activeCustomers || 0,
          avgOrderValue: response?.metrics?.avgOrderValue || 0,
          outstandingInvoices: response?.metrics?.outstandingInvoices || 0,
          marketplaceOrders: response?.metrics?.marketplaceOrders || 0,
          ordersThisMonth: response?.metrics?.ordersThisMonth || 0,
        },
        charts: {
          revenueOverTime: response?.charts?.revenueOverTime || [],
          ordersByStatus: response?.charts?.ordersByStatus || [],
          topProducts: response?.charts?.topProducts || [],
          customerGrowth: response?.charts?.customerGrowth || [],
        },
        recentOrders: (response?.recentOrders || []).map((order: any) => ({
          id: order.id,
          customerName: order.customerName || 'Unknown Customer',
          amount: order.amount || 0,
          status: order.status || 'pending',
          date: order.date || new Date().toISOString(),
        })),
        topCustomers: response?.topCustomers || [],
        brandPerformance: (response?.brandPerformance || []) as Array<{
          brand: string;
          revenue: number;
          orders: number;
          units: number;
        }>,
        lastUpdated: response?.lastUpdated || new Date().toISOString(),
      };

      // Cache the transformed data
      const cacheKey = `${userId}-${dateRange}`;
      dashboardCache.set(cacheKey, {
        data: transformedData,
        timestamp: Date.now(),
        dateRange
      });

      setData(transformedData);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(`Failed to load dashboard data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, dateRange]);

  const refresh = useCallback(() => {
    fetchDashboard(true);
  }, [fetchDashboard]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    loading,
    error,
    refreshing,
    refresh,
  };
};