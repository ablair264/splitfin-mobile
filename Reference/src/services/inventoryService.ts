// Inventory Service for items_data collection
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  QueryConstraint,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { ItemData, Vendor } from '../types/inventory';

const COLLECTIONS = {
  items: 'items_data', // Your actual collection name
  vendors: 'vendors',
  categories: 'categories',
};

// Item Service
export const itemService = {
  // Get all items with optional filters
  async getItems(filters?: {
    status?: string;
    brand?: string;
    search?: string;
    lowStock?: boolean;
    outOfStock?: boolean;
  }, limitCount: number = 100) {
    try {
      const constraints: QueryConstraint[] = [
        orderBy('item_name'),
        limit(limitCount)
      ];

      if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
      }

      if (filters?.brand) {
        constraints.push(where('brand_normalized', '==', filters.brand));
      }

      if (filters?.lowStock) {
        // This is tricky with Firestore - might need to filter client-side
        // constraints.push(where('available_stock', '<=', 'reorder_level'));
      }

      const q = query(collection(db, COLLECTIONS.items), ...constraints);
      const snapshot = await getDocs(q);
      
      let items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ItemData[];

      // Client-side filtering for complex queries
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        items = items.filter(item => 
          item.item_name?.toLowerCase().includes(searchLower) ||
          item.sku?.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower)
        );
      }

      if (filters?.lowStock) {
        items = items.filter(item => {
          const stock = item.available_stock || item.stock_on_hand || 0;
          const reorderLevel = typeof item.reorder_level === 'string' 
            ? parseInt(item.reorder_level) || 0 
            : item.reorder_level || 0;
          return stock > 0 && stock <= reorderLevel;
        });
      }

      if (filters?.outOfStock) {
        items = items.filter(item => 
          (item.available_stock || item.stock_on_hand || 0) <= 0
        );
      }

      return { items, total: items.length };
    } catch (error) {
      console.error('Error fetching items:', error);
      throw error;
    }
  },

  // Get single item by ID
  async getItem(itemId: string) {
    try {
      const docRef = doc(db, COLLECTIONS.items, itemId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as ItemData;
      }
      return null;
    } catch (error) {
      console.error('Error fetching item:', error);
      throw error;
    }
  },

  // Create new item
  async createItem(itemData: Partial<ItemData>) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.items), {
        ...itemData,
        created_time: new Date().toISOString(),
        last_modified_time: new Date().toISOString(),
        _syncSource: 'splitfin_web'
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  },

  // Update item
  async updateItem(itemId: string, updates: Partial<ItemData>) {
    try {
      const docRef = doc(db, COLLECTIONS.items, itemId);
      await updateDoc(docRef, {
        ...updates,
        last_modified_time: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  },

  // Delete item (soft delete by setting status to inactive)
  async deleteItem(itemId: string) {
    try {
      return await itemService.updateItem(itemId, { status: 'inactive' });
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  },

  // Get low stock items
  async getLowStockItems() {
    try {
      const { items } = await itemService.getItems({ lowStock: true });
      return items;
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      throw error;
    }
  },

  // Get out of stock items
  async getOutOfStockItems() {
    try {
      const { items } = await itemService.getItems({ outOfStock: true });
      return items;
    } catch (error) {
      console.error('Error fetching out of stock items:', error);
      throw error;
    }
  },

  // Get unique brands
  async getBrands() {
    try {
      const { items } = await itemService.getItems({}, 1000);
      const brands = [...new Set(items.map(item => item.brand_normalized || item.brand).filter(Boolean))];
      return brands.sort();
    } catch (error) {
      console.error('Error fetching brands:', error);
      throw error;
    }
  }
};

// Vendor Service (if you have vendors)
export const vendorService = {
  async getVendors(filters?: { status?: string }, limitCount: number = 100) {
    try {
      const constraints: QueryConstraint[] = [
        orderBy('vendor_name'),
        limit(limitCount)
      ];

      if (filters?.status) {
        constraints.push(where('vendor_status', '==', filters.status));
      }

      const q = query(collection(db, COLLECTIONS.vendors), ...constraints);
      const snapshot = await getDocs(q);
      
      const vendors = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Vendor[];

      return { vendors, total: vendors.length };
    } catch (error) {
      console.error('Error fetching vendors:', error);
      throw error;
    }
  },

  async getVendor(vendorId: string) {
    try {
      const docRef = doc(db, COLLECTIONS.vendors, vendorId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Vendor;
      }
      return null;
    } catch (error) {
      console.error('Error fetching vendor:', error);
      throw error;
    }
  }
};

// Dashboard stats service
export const dashboardService = {
  async getStats() {
    try {
      const { items } = await itemService.getItems({}, 1000);
      
      const stats = {
        totalProducts: items.length,
        activeProducts: items.filter(i => i.status === 'active').length,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        totalValue: 0,
        lowStockValue: 0,
      };

      items.forEach(item => {
        const stock = item.available_stock || item.stock_on_hand || 0;
        const reorderLevel = typeof item.reorder_level === 'string' 
          ? parseInt(item.reorder_level) || 0 
          : item.reorder_level || 0;
        const purchasePrice = item.purchase_rate || 0;

        if (stock <= 0) {
          stats.outOfStockProducts++;
        } else if (stock <= reorderLevel) {
          stats.lowStockProducts++;
          stats.lowStockValue += stock * purchasePrice;
        }

        stats.totalValue += stock * purchasePrice;
      });

      return stats;
    } catch (error) {
      console.error('Error calculating dashboard stats:', error);
      throw error;
    }
  }
};
