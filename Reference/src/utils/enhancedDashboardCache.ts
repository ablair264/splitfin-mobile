// Enhanced Dashboard Cache with compression, quota management, and IndexedDB support

import { compress, decompress } from 'lz-string';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  dateRange: string;
  userId: string;
  compressed?: boolean;
  size?: number;
}

interface StorageInfo {
  used: number;
  quota: number;
  usage: number; // percentage
}

interface CacheOptions {
  ttl?: number;
  maxSize?: number; // Max size in bytes
  compressionThreshold?: number; // Compress if data > threshold
  storage?: 'localStorage' | 'sessionStorage' | 'indexedDB' | 'memory';
  enableCompression?: boolean;
}

class EnhancedDashboardCache {
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly CACHE_PREFIX = 'splitfin_dashboard_';
  private readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB default
  private readonly COMPRESSION_THRESHOLD = 10 * 1024; // 10KB
  private readonly DB_NAME = 'SplitfinDashboardCache';
  private readonly DB_VERSION = 1;
  
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private storage: Storage | null = null;
  private db: IDBDatabase | null = null;
  private dbReady: Promise<void>;

  constructor(private options: CacheOptions = {}) {
    this.dbReady = this.initializeStorage();
  }

  private async initializeStorage(): Promise<void> {
    const storageType = this.options.storage || 'localStorage';

    // Try IndexedDB first for larger storage capacity
    if (storageType === 'indexedDB' && typeof window !== 'undefined' && 'indexedDB' in window) {
      try {
        await this.initIndexedDB();
        return;
      } catch (error) {
        console.warn('IndexedDB initialization failed:', error);
      }
    }

    // Fallback to localStorage/sessionStorage
    if (storageType === 'localStorage' && typeof window !== 'undefined') {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        this.storage = localStorage;
      } catch {
        console.warn('localStorage not available, using memory cache');
      }
    } else if (storageType === 'sessionStorage' && typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('test', 'test');
        sessionStorage.removeItem('test');
        this.storage = sessionStorage;
      } catch {
        console.warn('sessionStorage not available, using memory cache');
      }
    }
  }

  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      };
    });
  }

  private getCacheKey(userId: string, dateRange: string): string {
    return `${this.CACHE_PREFIX}${userId}_${dateRange}`;
  }

  private async getStorageInfo(): Promise<StorageInfo> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
        usage: ((estimate.usage || 0) / (estimate.quota || 1)) * 100
      };
    }
    
    // Fallback for browsers without storage.estimate
    return {
      used: 0,
      quota: this.MAX_STORAGE_SIZE,
      usage: 0
    };
  }

  private compressData(data: any): string | null {
    try {
      const jsonStr = JSON.stringify(data);
      if (this.options.enableCompression !== false && 
          jsonStr.length > (this.options.compressionThreshold || this.COMPRESSION_THRESHOLD)) {
        return compress(jsonStr);
      }
      return jsonStr;
    } catch (error) {
      console.error('Compression error:', error);
      return null;
    }
  }

  private decompressData(data: string, compressed: boolean): any {
    try {
      const jsonStr = compressed ? decompress(data) : data;
      return JSON.parse(jsonStr || '{}');
    } catch (error) {
      console.error('Decompression error:', error);
      return null;
    }
  }

  private async pruneCache(): Promise<void> {
    const entries: Array<{ key: string; timestamp: number; size: number }> = [];

    if (this.db) {
      // Prune IndexedDB
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.getAll();

      await new Promise((resolve) => {
        request.onsuccess = () => {
          const results = request.result;
          results.forEach((item: any) => {
            entries.push({
              key: item.key,
              timestamp: item.timestamp,
              size: JSON.stringify(item).length
            });
          });
          resolve(true);
        };
      });
    } else if (this.storage) {
      // Prune localStorage/sessionStorage
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          try {
            const item = this.storage.getItem(key);
            if (item) {
              const entry = JSON.parse(item);
              entries.push({
                key,
                timestamp: entry.timestamp,
                size: item.length
              });
            }
          } catch {
            // Invalid entry, will be removed
            entries.push({ key, timestamp: 0, size: 0 });
          }
        }
      }
    }

    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest entries until we're under 80% of quota
    const targetSize = this.MAX_STORAGE_SIZE * 0.8;
    let currentSize = entries.reduce((sum, e) => sum + e.size, 0);
    
    for (const entry of entries) {
      if (currentSize <= targetSize) break;
      
      await this.removeByKey(entry.key);
      currentSize -= entry.size;
    }
  }

  private async removeByKey(key: string): Promise<void> {
    if (this.db) {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      store.delete(key);
    } else if (this.storage) {
      this.storage.removeItem(key);
    } else {
      this.memoryCache.delete(key);
    }
  }

  async get<T>(userId: string, dateRange: string): Promise<T | null> {
    await this.dbReady;
    
    const key = this.getCacheKey(userId, dateRange);
    const ttl = this.options.ttl || this.DEFAULT_TTL;

    try {
      let entry: CacheEntry<T> | null = null;

      if (this.db) {
        // Get from IndexedDB
        const transaction = this.db.transaction(['cache'], 'readonly');
        const store = transaction.objectStore('cache');
        const request = store.get(key);

        await new Promise((resolve, reject) => {
          request.onsuccess = () => {
            const result = request.result;
            if (result) {
              entry = {
                data: this.decompressData(result.data, result.compressed),
                timestamp: result.timestamp,
                dateRange: result.dateRange,
                userId: result.userId,
                compressed: result.compressed
              };
            }
            resolve(true);
          };
          request.onerror = () => reject(request.error);
        });
      } else if (this.storage) {
        // Get from localStorage/sessionStorage
        const stored = this.storage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          entry = {
            ...parsed,
            data: this.decompressData(parsed.data, parsed.compressed)
          };
        }
      } else {
        // Get from memory cache
        entry = this.memoryCache.get(key) || null;
      }

      if (!entry) return null;

      // Check if cache is expired
      const now = Date.now();
      if (now - entry.timestamp > ttl) {
        await this.remove(userId, dateRange);
        return null;
      }

      // Validate cache entry matches request
      if (entry.userId !== userId || entry.dateRange !== dateRange) {
        await this.remove(userId, dateRange);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set<T>(userId: string, dateRange: string, data: T): Promise<void> {
    await this.dbReady;
    
    const key = this.getCacheKey(userId, dateRange);
    const compressed = this.compressData(data);
    
    if (!compressed) {
      console.error('Failed to serialize data for caching');
      return;
    }

    const isCompressed = this.options.enableCompression !== false && 
                        compressed.length < JSON.stringify(data).length * 0.8;

    const entry = {
      key, // Add key for IndexedDB
      data: compressed,
      timestamp: Date.now(),
      dateRange,
      userId,
      compressed: isCompressed,
      size: compressed.length
    };

    try {
      if (this.db) {
        // Store in IndexedDB
        const transaction = this.db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        store.put(entry);
        
        await new Promise((resolve, reject) => {
          transaction.oncomplete = () => resolve(true);
          transaction.onerror = () => reject(transaction.error);
        });
      } else if (this.storage) {
        // Store in localStorage/sessionStorage
        try {
          this.storage.setItem(key, JSON.stringify(entry));
        } catch (error) {
          if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            console.log('Storage quota exceeded, pruning cache...');
            await this.pruneCache();
            // Try one more time
            try {
              this.storage.setItem(key, JSON.stringify(entry));
            } catch {
              console.error('Failed to cache after pruning');
            }
          }
        }
      } else {
        // Store in memory
        this.memoryCache.set(key, { ...entry, data });
        
        // Prune memory cache if too large
        if (this.memoryCache.size > 50) {
          const entries = Array.from(this.memoryCache.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp);
          
          while (this.memoryCache.size > 30) {
            const [oldestKey] = entries.shift()!;
            this.memoryCache.delete(oldestKey);
          }
        }
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async remove(userId: string, dateRange: string): Promise<void> {
    await this.dbReady;
    const key = this.getCacheKey(userId, dateRange);
    await this.removeByKey(key);
  }

  async clearAll(): Promise<void> {
    await this.dbReady;

    if (this.db) {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      store.clear();
    } else if (this.storage) {
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

  async getStats(): Promise<{
    size: number;
    oldestEntry: number | null;
    newestEntry: number | null;
    storageInfo: StorageInfo;
    cacheType: string;
  }> {
    await this.dbReady;

    let size = 0;
    let oldestEntry: number | null = null;
    let newestEntry: number | null = null;

    if (this.db) {
      const transaction = this.db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.getAll();

      await new Promise((resolve) => {
        request.onsuccess = () => {
          const results = request.result;
          size = results.length;
          
          results.forEach((entry: any) => {
            if (!oldestEntry || entry.timestamp < oldestEntry) {
              oldestEntry = entry.timestamp;
            }
            if (!newestEntry || entry.timestamp > newestEntry) {
              newestEntry = entry.timestamp;
            }
          });
          resolve(true);
        };
      });
    } else if (this.storage) {
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          size++;
          try {
            const entry = JSON.parse(this.storage.getItem(key) || '{}');
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

    const storageInfo = await this.getStorageInfo();
    const cacheType = this.db ? 'IndexedDB' : this.storage ? 'localStorage' : 'memory';

    return { size, oldestEntry, newestEntry, storageInfo, cacheType };
  }
}

// Create singleton instance with IndexedDB as primary storage
export const enhancedDashboardCache = new EnhancedDashboardCache({
  storage: 'indexedDB',
  ttl: 5 * 60 * 1000,
  enableCompression: true,
  compressionThreshold: 10 * 1024 // 10KB
});

// Export class for testing or custom instances
export { EnhancedDashboardCache };
