import React, { useState, useEffect } from 'react';
import { enhancedDashboardCache } from '../../utils/enhancedDashboardCache';
import styles from './CacheStatus.module.css';

interface CacheStatusProps {
  onCacheCleared?: () => void;
}

const CacheStatus: React.FC<CacheStatusProps> = ({ onCacheCleared }) => {
  const [stats, setStats] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const loadStats = async () => {
    const cacheStats = await enhancedDashboardCache.getStats();
    setStats(cacheStats);
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleClearCache = async () => {
    await enhancedDashboardCache.clearAll();
    await loadStats();
    onCacheCleared?.();
  };

  if (!stats) return null;

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const formatAge = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    const age = Date.now() - timestamp;
    const minutes = Math.floor(age / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className={styles.cacheStatus}>
      <button 
        className={styles.toggleButton}
        onClick={() => setIsExpanded(!isExpanded)}
        title="Cache Status"
      >
        💾 {stats.storageInfo.usage.toFixed(0)}%
      </button>
      
      {isExpanded && (
        <div className={styles.expandedContent}>
          <h4>Image Cache Status</h4>
          <div className={styles.statsGrid}>
            <div className={styles.stat}>
              <label>Storage Type:</label>
              <span>{stats.cacheType}</span>
            </div>
            <div className={styles.stat}>
              <label>Cached Items:</label>
              <span>{stats.size}</span>
            </div>
            <div className={styles.stat}>
              <label>Storage Used:</label>
              <span>{formatBytes(stats.storageInfo.used)}</span>
            </div>
            <div className={styles.stat}>
              <label>Storage Quota:</label>
              <span>{formatBytes(stats.storageInfo.quota)}</span>
            </div>
            <div className={styles.stat}>
              <label>Oldest Entry:</label>
              <span>{formatAge(stats.oldestEntry)}</span>
            </div>
            <div className={styles.stat}>
              <label>Newest Entry:</label>
              <span>{formatAge(stats.newestEntry)}</span>
            </div>
          </div>
          
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${stats.storageInfo.usage}%` }}
            />
          </div>
          
          <button 
            className={styles.clearButton}
            onClick={handleClearCache}
          >
            Clear Cache
          </button>
        </div>
      )}
    </div>
  );
};

export default CacheStatus;
