// src/utils/dashboardCacheManager.ts
import { dashboardCache } from './dashboardCache';

/**
 * Dashboard Cache Manager
 * Provides utilities for managing the dashboard cache globally
 */

// Clear all dashboard cache entries
export const clearAllDashboardCache = (): void => {
  dashboardCache.clearAll();
  console.log('🗑️ All dashboard cache cleared');
};

// Get cache statistics
export const getDashboardCacheStats = () => {
  const stats = dashboardCache.getStats();
  const ageInMinutes = stats.oldestEntry 
    ? Math.round((Date.now() - stats.oldestEntry) / 60000)
    : 0;
  
  return {
    ...stats,
    oldestEntryAge: ageInMinutes,
    summary: `${stats.size} entries cached, oldest is ${ageInMinutes}m old`
  };
};

// Clear cache for specific user
export const clearUserDashboardCache = (userId: string): void => {
  if (!userId) return;
  
  // Get all possible date ranges to clear
  const dateRanges = [
    '7_days', '30_days', '90_days', 'quarter', 'last_quarter',
    'this_year', 'last_year', '12_months', 'last_month'
  ];
  
  dateRanges.forEach(dateRange => {
    dashboardCache.remove(userId, dateRange);
  });
  
  console.log(`🗑️ Dashboard cache cleared for user: ${userId}`);
};

// Preload cache for a user (useful after login)
export const preloadDashboardCache = async (
  userId: string, 
  fetchFunction: (dateRange: string) => Promise<any>
): Promise<void> => {
  const commonDateRanges = ['30_days', '7_days'];
  
  try {
    await Promise.all(
      commonDateRanges.map(dateRange => fetchFunction(dateRange))
    );
    console.log(`📦 Dashboard cache preloaded for user: ${userId}`);
  } catch (error) {
    console.error('Failed to preload cache:', error);
  }
};

// Check if cache is available for a specific query
export const isCacheAvailable = (userId: string, dateRange: string): boolean => {
  return dashboardCache.get(userId, dateRange) !== null;
};

// Get cache age in minutes
export const getCacheAge = (userId: string, dateRange: string): number | null => {
  const key = `splitfin_dashboard_${userId}_${dateRange}`;
  
  try {
    if (typeof window !== 'undefined' && localStorage) {
      const stored = localStorage.getItem(key);
      if (stored) {
        const entry = JSON.parse(stored);
        if (entry && entry.timestamp) {
          return Math.round((Date.now() - entry.timestamp) / 60000);
        }
      }
    }
  } catch (error) {
    console.error('Failed to get cache age:', error);
  }
  
  return null;
};

// Export cache instance for advanced usage
export { dashboardCache };
