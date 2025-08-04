// Example: How to add cache management to a settings component

import { 
  clearAllDashboardCache, 
  clearUserDashboardCache,
  getDashboardCacheStats 
} from '../utils/dashboardCacheManager';

// In your settings or admin component:

const handleClearAllCache = () => {
  clearAllDashboardCache();
  // Show success message to user
  alert('Dashboard cache cleared successfully');
};

const handleClearUserCache = (userId: string) => {
  clearUserDashboardCache(userId);
  // Refresh the dashboard
  window.location.reload();
};

const showCacheStats = () => {
  const stats = getDashboardCacheStats();
  console.log('Cache Statistics:', stats);
  alert(`Cache Stats: ${stats.summary}`);
};

// Example JSX for cache management UI:
/*
<div className="cache-management">
  <h3>Cache Management</h3>
  <div className="cache-actions">
    <button onClick={handleClearAllCache}>
      Clear All Cache
    </button>
    <button onClick={() => handleClearUserCache(currentUserId)}>
      Clear My Cache
    </button>
    <button onClick={showCacheStats}>
      View Cache Stats
    </button>
  </div>
</div>
*/
