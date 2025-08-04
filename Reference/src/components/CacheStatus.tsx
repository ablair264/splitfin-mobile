// Cache Status Component for monitoring and managing dashboard cache

import React, { useState, useEffect } from 'react';
import { enhancedDashboardCache } from '../utils/enhancedDashboardCache';
import './CacheStatus.css';

interface CacheStats {
  size: number;
  oldestEntry: number | null;
  newestEntry: number | null;
  storageInfo: {
    used: number;
    quota: number;
    usage: number;
  };
  cacheType: string;
}

interface CacheStatusProps {
  userId?: string;
  dateRange?: string;
  onCacheCleared?: () => void;
}

export const CacheStatus: React.FC<CacheStatusProps> = ({ 
  userId, 
  dateRange,
  onCacheCleared 
}) => {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const loadStats = async () => {
    try {
      const cacheStats = await enhancedDashboardCache.getStats();
      setStats(cacheStats);
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    }
  };

  useEffect(() => {
    loadStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [userId, dateRange]);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await enhancedDashboardCache.clearAll();
      await loadStats();
      onCacheCleared?.();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatAge = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    const age = Date.now() - timestamp;
    const minutes = Math.floor(age / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  if (!stats) return null;

  const usagePercent = stats.storageInfo.usage || 0;
  const isHighUsage = usagePercent > 80;
  const isCriticalUsage = usagePercent > 95;

  return (
    <div className={`cache-status ${isHighUsage ? 'high-usage' : ''} ${isCriticalUsage ? 'critical-usage' : ''}`}>
      <div className="cache-status-header" onClick={() => setShowDetails(!showDetails)}>
        <div className="cache-status-summary">
          <span className="cache-type">{stats.cacheType}</span>
          <span className="cache-entries">{stats.size} entries</span>
          <span className="cache-usage">{usagePercent.toFixed(1)}% used</span>
        </div>
        <button 
          className="cache-clear-button"
          onClick={(e) => {
            e.stopPropagation();
            handleClearCache();
          }}
          disabled={isClearing}
        >
          {isClearing ? 'Clearing...' : 'Clear Cache'}
        </button>
      </div>

      {showDetails && (
        <div className="cache-status-details">
          <div className="cache-detail-row">
            <span>Storage Used:</span>
            <span>{formatBytes(stats.storageInfo.used)} / {formatBytes(stats.storageInfo.quota)}</span>
          </div>
          <div className="cache-detail-row">
            <span>Oldest Entry:</span>
            <span>{formatAge(stats.oldestEntry)}</span>
          </div>
          <div className="cache-detail-row">
            <span>Newest Entry:</span>
            <span>{formatAge(stats.newestEntry)}</span>
          </div>
          
          {isHighUsage && (
            <div className="cache-warning">
              ⚠️ Cache storage is {usagePercent.toFixed(0)}% full. 
              {isCriticalUsage 
                ? ' Consider clearing cache to prevent errors.'
                : ' Old entries will be automatically removed when needed.'}
            </div>
          )}

          <div className="cache-info">
            <p>
              Your dashboard data is cached using {stats.cacheType} to improve performance.
              Cache entries expire after 5 minutes and are automatically compressed to save space.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CacheStatus;
