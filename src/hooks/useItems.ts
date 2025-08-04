// src/hooks/useItems.ts
import { useState, useEffect, useCallback } from 'react';
import firebaseService from '../services/firebaseService';

export interface Item {
  id: string;
  item_id: string;
  item_name: string;
  sku: string;
  stock_on_hand: number;
  retail_price: number;
  selling_price: number;
  brand?: string;
  manufacturer?: string;
  category?: string;
  type?: string;
  status?: string;
  images?: string[];
  imageUrl?: string;
  pro_desc?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

interface UseItemsOptions {
  brand?: string;
  search?: string;
  category?: string;
  autoLoad?: boolean;
}

export const useItems = (options: UseItemsOptions = {}) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchItems = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      let response;
      
      if (options.brand) {
        // Fetch items by brand
        response = await firebaseService.items.getByBrand(options.brand, {
          search: options.search,
          category: options.category,
        });
      } else {
        // Fetch all items
        response = await firebaseService.items.getAll({
          search: options.search,
          brand: options.brand,
        });
      }

      // Handle Firebase response structure
      const itemsData = response?.data || [];
      
      console.log('Items API response:', { response, itemsData: itemsData.length });
      
      setItems(Array.isArray(itemsData) ? itemsData as Item[] : []);
    } catch (err) {
      console.error('Items fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load items');
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [options.brand, options.search, options.category]);

  const refresh = useCallback(() => {
    fetchItems(true);
  }, [fetchItems]);

  const searchItems = useCallback(async (query: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await firebaseService.items.search(query, options.brand);
      const itemsData = Array.isArray(response) ? response : [];
      
      setItems(Array.isArray(itemsData) ? itemsData as Item[] : []);
    } catch (err) {
      console.error('Items search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to search items');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [options.brand]);

  useEffect(() => {
    if (options.autoLoad !== false) {
      fetchItems();
    }
  }, [fetchItems, options.autoLoad]);

  return {
    items,
    loading,
    error,
    refreshing,
    refresh,
    searchItems,
    fetchItems,
  };
};