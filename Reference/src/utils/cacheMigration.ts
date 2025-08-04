// Cache Migration Utility - Migrates data from old localStorage cache to new enhanced cache

import { enhancedDashboardCache } from './enhancedDashboardCache';

interface MigrationResult {
  success: boolean;
  migratedCount: number;
  failedCount: number;
  errors: string[];
}

export class CacheMigration {
  private readonly OLD_CACHE_PREFIX = 'splitfin_dashboard_';
  
  async migrateFromLocalStorage(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      migratedCount: 0,
      failedCount: 0,
      errors: []
    };

    try {
      // Find all old cache entries
      const oldEntries: Array<{ key: string; data: any }> = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.OLD_CACHE_PREFIX)) {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              const parsed = JSON.parse(data);
              oldEntries.push({ key, data: parsed });
            }
          } catch (error) {
            result.errors.push(`Failed to parse ${key}: ${error}`);
            result.failedCount++;
          }
        }
      }

      // Migrate each entry to the new cache
      for (const entry of oldEntries) {
        try {
          // Extract userId and dateRange from key
          const keyParts = entry.key.replace(this.OLD_CACHE_PREFIX, '').split('_');
          const userId = keyParts[0];
          const dateRange = keyParts.slice(1).join('_');

          // Check if entry is still valid (not expired)
          const ttl = 5 * 60 * 1000; // 5 minutes
          const now = Date.now();
          if (entry.data.timestamp && (now - entry.data.timestamp) < ttl) {
            // Migrate to new cache
            await enhancedDashboardCache.set(userId, dateRange, entry.data.data);
            result.migratedCount++;
          }

          // Remove old entry regardless of whether it was migrated
          localStorage.removeItem(entry.key);
        } catch (error) {
          result.errors.push(`Failed to migrate ${entry.key}: ${error}`);
          result.failedCount++;
          result.success = false;
        }
      }

      return result;
    } catch (error) {
      result.errors.push(`Migration failed: ${error}`);
      result.success = false;
      return result;
    }
  }

  // Check if migration is needed
  needsMigration(): boolean {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.OLD_CACHE_PREFIX)) {
        return true;
      }
    }
    return false;
  }

  // Clear all old cache entries without migration
  clearOldCache(): void {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.OLD_CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // Get size of old cache
  getOldCacheSize(): number {
    let totalSize = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.OLD_CACHE_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
        }
      }
    }

    return totalSize;
  }
}

// Singleton instance
export const cacheMigration = new CacheMigration();

// Auto-migration function that can be called on app startup
export const performAutoMigration = async (): Promise<void> => {
  try {
    if (cacheMigration.needsMigration()) {
      console.log('Dashboard cache migration needed. Starting migration...');
      
      const result = await cacheMigration.migrateFromLocalStorage();
      
      if (result.success) {
        console.log(`Cache migration completed successfully. Migrated ${result.migratedCount} entries.`);
      } else {
        console.error('Cache migration completed with errors:', result.errors);
      }
    }
  } catch (error) {
    console.error('Auto-migration failed:', error);
    // Clear old cache to prevent issues
    cacheMigration.clearOldCache();
  }
};
