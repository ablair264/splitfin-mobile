// src/hooks/useViewData.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { dashboardAPI } from '../services/api';
import { enhancedDashboardCache } from '../utils/enhancedDashboardCache';

export type ViewType = 'overview' | 'orders' | 'revenue' | 'invoices' | 'brands' | 'forecasting';

interface UseViewDataOptions {
  userId: string;
  view: ViewType;
  dateRange?: string;
  customDateRange?: { start: string; end: string };
  useCache?: boolean;
  cacheTTL?: number;
  staleWhileRevalidate?: boolean;
}

interface ViewDataReturn<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
  isStale?: boolean;
  isCached?: boolean;
}

export const useViewData = <T = any>({
  userId,
  view,
  dateRange = '30_days',
  customDateRange,
  useCache = true,
  cacheTTL = 5 * 60 * 1000, // 5 minutes
  staleWhileRevalidate = true
}: UseViewDataOptions): ViewDataReturn<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [isCached, setIsCached] = useState(false);
  
  const isMounted = useRef(true);
  const isBackgroundFetching = useRef(false);

  // Generate cache key based on view and parameters
  const getCacheKey = useCallback(() => {
    const dateKey = dateRange === 'custom' && customDateRange 
      ? `${dateRange}_${customDateRange.start}_${customDateRange.end}`
      : dateRange;
    return `${view}_${dateKey}`;
  }, [view, dateRange, customDateRange]);

  // Fetch view-specific data
  const fetchViewData = useCallback(async (forceRefresh = false) => {
    if (!userId) {
      setError('User ID is required');
      setLoading(false);
      return;
    }

    const cacheKey = getCacheKey();
    
    // Check cache first if not forcing refresh
    if (useCache && !forceRefresh && !isBackgroundFetching.current) {
      const cachedData = await enhancedDashboardCache.get<T>(userId, cacheKey);
      
      if (cachedData) {
        setData(cachedData);
        setLastUpdated(new Date((cachedData as any).lastUpdated || Date.now()));
        setIsCached(true);
        setError(null);
        
        // If stale-while-revalidate is enabled, fetch in background
        if (staleWhileRevalidate) {
          setIsStale(true);
          setLoading(false);
          isBackgroundFetching.current = true;
          // Continue to fetch fresh data below
        } else {
          // Just return cached data
          setLoading(false);
          return;
        }
      }
    }

    try {
      if (!isBackgroundFetching.current) {
        setLoading(true);
      }
      setError(null);
      
      const params: any = {
        dateRange,
        ...(customDateRange && dateRange === 'custom' && {
          startDate: customDateRange.start,
          endDate: customDateRange.end
        })
      };
      
      // Call view-specific endpoint
      const response = await dashboardAPI.getViewData(userId, view, params);
      
      if (!isMounted.current) return;
      
      if (response.success && response.data) {
        setData(response.data);
        setLastUpdated(new Date(response.data.lastUpdated || Date.now()));
        setError(null);
        setIsStale(false);
        setIsCached(false);
        
        // Update cache
        if (useCache) {
          await enhancedDashboardCache.set(userId, cacheKey, response.data);
        }
      } else {
        throw new Error(response.error || `Failed to fetch ${view} data`);
      }
    } catch (err: any) {
      if (!isMounted.current) return;
      
      // If we have cached data and background fetch fails, keep showing cached data
      if (isBackgroundFetching.current && data) {
        console.warn('Background refresh failed, continuing with cached data:', err.message);
      } else {
        setError(err.message || `Failed to load ${view} view`);
        if (!data) setData(null);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        isBackgroundFetching.current = false;
      }
    }
  }, [userId, view, dateRange, customDateRange, useCache, staleWhileRevalidate, getCacheKey]);

  // Refresh function - always forces fresh fetch
  const refresh = useCallback(async () => {
    await fetchViewData(true);
  }, [fetchViewData]);

  // Initial fetch
  useEffect(() => {
    fetchViewData();
  }, [fetchViewData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    refresh,
    lastUpdated,
    isStale,
    isCached
  };
};

// Type-safe view data hooks
export const useOverviewData = (options: Omit<UseViewDataOptions, 'view'>) => 
  useViewData({ ...options, view: 'overview' });

export const useOrdersData = (options: Omit<UseViewDataOptions, 'view'>) => 
  useViewData({ ...options, view: 'orders' });

export const useRevenueData = (options: Omit<UseViewDataOptions, 'view'>) => 
  useViewData({ ...options, view: 'revenue' });

export const useInvoicesData = (options: Omit<UseViewDataOptions, 'view'>) => 
  useViewData({ ...options, view: 'invoices' });

export const useBrandsData = (options: Omit<UseViewDataOptions, 'view'>) => 
  useViewData({ ...options, view: 'brands' });

export const useForecastingData = (options: Omit<UseViewDataOptions, 'view'>) => 
  useViewData({ ...options, view: 'forecasting' });
