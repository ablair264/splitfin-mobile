// src/hooks/useDashboard.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { dashboardAPI } from '../services/api';
import { enhancedDashboardCache } from '../utils/enhancedDashboardCache';
import { 
  DashboardData,
  UseDashboardOptions, 
  UseDashboardReturn,
  APIResponse 
} from '../types/dashboard';

interface UseDashboardOptionsWithCache extends UseDashboardOptions {
  useCache?: boolean;
  cacheTTL?: number;
  staleWhileRevalidate?: boolean;
}

interface UseDashboardReturnWithCache extends UseDashboardReturn {
  isStale?: boolean;
  isCached?: boolean;
}

export const useDashboard = ({
  userId,
  dateRange = '30_days',
  customDateRange,
  autoRefresh = false,
  refreshInterval = 300000,
  useCache = true,
  cacheTTL = 5 * 60 * 1000, // 5 minutes default
  staleWhileRevalidate = true
}: UseDashboardOptionsWithCache): UseDashboardReturnWithCache => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [isCached, setIsCached] = useState(false);
  
  const isMounted = useRef(true);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isBackgroundFetching = useRef(false);

  // Generate cache key based on parameters
  const getCacheKey = useCallback(() => {
    const key = dateRange === 'custom' && customDateRange 
      ? `${dateRange}_${customDateRange.start}_${customDateRange.end}`
      : dateRange;
    return key;
  }, [dateRange, customDateRange]);

  // Fetch dashboard data
  const fetchDashboard = useCallback(async (forceRefresh = false) => {
    if (!userId) {
      setError('User ID is required');
      setLoading(false);
      return;
    }

    const cacheKey = getCacheKey();
    
    // Check cache first if not forcing refresh
    if (useCache && !forceRefresh && !isBackgroundFetching.current) {
      const cachedData = await enhancedDashboardCache.get<DashboardData>(userId, cacheKey);
      
      if (cachedData) {
        setData(cachedData);
        setLastUpdated(new Date(cachedData.lastUpdated));
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
      
      const response: APIResponse<DashboardData> = await dashboardAPI.getDashboard(userId, params);
      
      if (!isMounted.current) return;
      
      if (response.success && response.data) {
        setData(response.data);
        setLastUpdated(new Date(response.data.lastUpdated));
        setError(null);
        setIsStale(false);
        setIsCached(false);
        
        // Update cache
        if (useCache) {
          await enhancedDashboardCache.set(userId, cacheKey, response.data);
        }
      } else {
        throw new Error(response.error || 'Failed to fetch dashboard data');
      }
    } catch (err: any) {
      if (!isMounted.current) return;
      
      // If we have cached data and background fetch fails, keep showing cached data
      if (isBackgroundFetching.current && data) {
        console.warn('Background refresh failed, continuing with cached data:', err.message);
      } else {
        setError(err.message || 'Failed to load dashboard');
        if (!data) setData(null);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        isBackgroundFetching.current = false;
      }
    }
  }, [userId, dateRange, customDateRange, useCache, staleWhileRevalidate, getCacheKey]);

  // Refresh function - always forces fresh fetch
  const refresh = useCallback(async () => {
    await fetchDashboard(true);
  }, [fetchDashboard]);

  // Clear cache for current parameters
  const clearCache = useCallback(async () => {
    if (userId) {
      await enhancedDashboardCache.remove(userId, getCacheKey());
    }
  }, [userId, getCacheKey]);

  // Initial fetch
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Setup auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        fetchDashboard(true); // Force refresh on auto-refresh
      }, refreshInterval);
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      };
    }
  }, [autoRefresh, refreshInterval, fetchDashboard]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    refresh,
    lastUpdated,
    isStale,
    isCached,
    clearCache
  };
};

// Helper hook to access specific dashboard sections
export const useDashboardSection = <K extends keyof DashboardData>(
  sectionKey: K,
  options: UseDashboardOptionsWithCache
): {
  data: DashboardData[K] | null;
  loading: boolean;
  error: string | null;
  isStale?: boolean;
  isCached?: boolean;
} => {
  const { data, loading, error, isStale, isCached } = useDashboard(options);
  
  return {
    data: data ? data[sectionKey] : null,
    loading,
    error,
    isStale,
    isCached
  };
};

// Helper hook for role-specific data
export const useRoleSpecificDashboard = (
  userId: string,
  role: 'salesAgent' | 'brandManager',
  options?: Partial<UseDashboardOptionsWithCache>
) => {
  const dashboardData = useDashboard({
    userId,
    ...options
  });

  // Extract role-specific data
  const roleSpecificData = {
    ...dashboardData,
    commission: role === 'salesAgent' ? dashboardData.data?.commission : null,
    agentPerformance: role === 'brandManager' ? dashboardData.data?.agentPerformance : null
  };

  return roleSpecificData;
};

// Utility function to clear all dashboard cache
export const clearAllDashboardCache = async () => {
  await enhancedDashboardCache.clearAll();
};

// Utility function to get cache statistics
export const getDashboardCacheStats = async () => {
  return await enhancedDashboardCache.getStats();
};

// Re-export cache management utilities
export * from '../utils/dashboardCacheManager';