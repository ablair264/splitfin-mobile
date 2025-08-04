// src/utils/dashboardCache.ts

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  dateRange: string;
  userId: string;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  storage?: 'localStorage' | 'sessionStorage' | 'memory';
}

class DashboardCache {
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly CACHE_PREFIX = 'splitfin_dashboard_';
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private storage: Storage | null = null;

  constructor(private options: CacheOptions = {}) {
    // Try to use specified storage, fallback to memory if not available
    if (options.storage === 'localStorage' && typeof window !== 'undefined') {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        this.storage = localStorage;
      } catch {
        console.warn('localStorage not available, using memory cache');
      }
    } else if (options.storage === 'sessionStorage' && typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('test', 'test');
        sessionStorage.removeItem('test');
        this.storage = sessionStorage;
      } catch {
        console.warn('sessionStorage not available, using memory cache');
      }
    }
  }

  private getCacheKey(userId: string, dateRange: string): string {
    return `${this.CACHE_PREFIX}${userId}_${dateRange}`;
  }

  get<T>(userId: string, dateRange: string): T | null {
    const key = this.getCacheKey(userId, dateRange);
    const ttl = this.options.ttl || this.DEFAULT_TTL;

    try {
      let entry: CacheEntry<T> | null = null;

      // Try storage first
      if (this.storage) {
        const stored = this.storage.getItem(key);
        if (stored) {
          entry = JSON.parse(stored);
        }
      } else {
        // Fallback to memory cache
        entry = this.memoryCache.get(key) || null;
      }

      if (!entry) return null;

      // Check if cache is expired
      const now = Date.now();
      if (now - entry.timestamp > ttl) {
        this.remove(userId, dateRange);
        return null;
      }

      // Validate cache entry matches request
      if (entry.userId !== userId || entry.dateRange !== dateRange) {
        this.remove(userId, dateRange);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  set<T>(userId: string, dateRange: string, data: T): void {
    const key = this.getCacheKey(userId, dateRange);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      dateRange,
      userId
    };

    try {
      if (this.storage) {
        this.storage.setItem(key, JSON.stringify(entry));
      } else {
        this.memoryCache.set(key, entry);
      }
    } catch (error) {
      console.error('Cache set error:', error);
      // If storage is full, clear old entries
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.clearOldEntries();
        // Try again
        try {
          if (this.storage) {
            this.storage.setItem(key, JSON.stringify(entry));
          }
        } catch {
          // Give up, data won't be cached
        }
      }
    }
  }

  remove(userId: string, dateRange: string): void {
    const key = this.getCacheKey(userId, dateRange);
    
    if (this.storage) {
      this.storage.removeItem(key);
    } else {
      this.memoryCache.delete(key);
    }
  }

  clearAll(): void {
    if (this.storage) {
      // Clear only our cache entries
      const keys = [];
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          keys.push(key);
        }
      }
      keys.forEach(key => this.storage!.removeItem(key));
    } else {
      this.memoryCache.clear();
    }
  }

  clearOldEntries(): void {
    const ttl = this.options.ttl || this.DEFAULT_TTL;
    const now = Date.now();

    if (this.storage) {
      const keys = [];
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          try {
            const entry = JSON.parse(this.storage.getItem(key) || '{}') as CacheEntry<any>;
            if (now - entry.timestamp > ttl) {
              keys.push(key);
            }
          } catch {
            // Invalid entry, remove it
            keys.push(key);
          }
        }
      }
      keys.forEach(key => this.storage!.removeItem(key));
    } else {
      // Clear old entries from memory cache
      const keysToDelete: string[] = [];
      this.memoryCache.forEach((entry, key) => {
        if (now - entry.timestamp > ttl) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => this.memoryCache.delete(key));
    }
  }

  // Get cache statistics
  getStats(): {
    size: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    let size = 0;
    let oldestEntry: number | null = null;
    let newestEntry: number | null = null;

    if (this.storage) {
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          size++;
          try {
            const entry = JSON.parse(this.storage.getItem(key) || '{}') as CacheEntry<any>;
            if (!oldestEntry || entry.timestamp < oldestEntry) {
              oldestEntry = entry.timestamp;
            }
            if (!newestEntry || entry.timestamp > newestEntry) {
              newestEntry = entry.timestamp;
            }
          } catch {
            // Skip invalid entries
          }
        }
      }
    } else {
      size = this.memoryCache.size;
      this.memoryCache.forEach(entry => {
        if (!oldestEntry || entry.timestamp < oldestEntry) {
          oldestEntry = entry.timestamp;
        }
        if (!newestEntry || entry.timestamp > newestEntry) {
          newestEntry = entry.timestamp;
        }
      });
    }

    return { size, oldestEntry, newestEntry };
  }
}

// Create singleton instance
export const dashboardCache = new DashboardCache({
  storage: 'localStorage',
  ttl: 5 * 60 * 1000 // 5 minutes
});

// Export class for testing or custom instances
export { DashboardCache };
