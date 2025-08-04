// src/hooks/useCustomers.ts
import { useState, useEffect, useCallback } from 'react';
import firebaseService from '../services/firebaseService';
import { useAuthStore } from '../store/authStore';

export interface Customer {
  id: string;
  customer_id: string;
  customer_name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  city?: string;
  postcode?: string;
  location_region?: string;
  status: string;
  created_time?: string;
  created_date?: string;
  last_modified_time?: string;
  outstanding_receivable_amount?: number;
  total_spent?: number;
  order_count?: number;
  average_order_value?: number;
  first_order_date?: string;
  last_order_date?: string;
  sales_agent_id?: string;
  salesperson_zoho_id?: string;
  firebase_uid?: string;
  customer_logo?: string;
  metrics?: {
    total_spent?: number;
    order_count?: number;
    last_order_date?: string;
    first_order_date?: string;
  };
  [key: string]: any;
}

interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
}

interface UseCustomersOptions {
  search?: string;
  sortBy?: 'name' | 'date' | 'value' | 'orders';
  page?: number;
  limit?: number;
  autoLoad?: boolean;
}

export const useCustomers = (options: UseCustomersOptions = {}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [metrics, setMetrics] = useState<CustomerMetrics>({
    totalCustomers: 0,
    newCustomers: 0,
    activeCustomers: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuthStore();

  const fetchCustomers = useCallback(async (isRefresh = false) => {
    if (!user?.id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Use the Firebase customers service
      const response = await firebaseService.customers.getAll({
        search: options.search,
        page: options.page || 1,
        limit: options.limit || 25,
      });

      console.log('Customers API response:', response);

      // Handle Firebase response structure
      const customersData = response?.data || [];
      const totalCustomers = response?.total || customersData.length;

      setCustomers(Array.isArray(customersData) ? customersData as Customer[] : []);
      
      // Calculate metrics
      if (Array.isArray(customersData)) {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const newCustomers = customersData.filter((customer: any) => {
          const createdDate = customer.created_date?.toDate?.() || new Date(customer.created_date || customer.created_time || '');
          return createdDate >= thirtyDaysAgo;
        }).length;

        const activeCustomers = customersData.filter((customer: any) => {
          const lastOrderDate = new Date(customer.metrics?.last_order_date || '');
          return lastOrderDate >= thirtyDaysAgo;
        }).length;

        setMetrics({
          totalCustomers,
          newCustomers,
          activeCustomers,
        });
      }
    } catch (err) {
      console.error('Customers fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load customers');
      // For development, provide mock data on error
      setCustomers([]);
      setMetrics({
        totalCustomers: 0,
        newCustomers: 0,
        activeCustomers: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, options.search, options.page, options.limit]);

  const refresh = useCallback(() => {
    fetchCustomers(true);
  }, [fetchCustomers]);

  const searchCustomers = useCallback(async (query: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await firebaseService.customers.getAll({
        search: query,
        page: 1,
        limit: options.limit || 25,
      });

      const customersData = response?.data || [];
      setCustomers(Array.isArray(customersData) ? customersData as Customer[] : []);
    } catch (err) {
      console.error('Customers search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to search customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [options.limit]);

  const getCustomer = useCallback(async (customerId: string) => {
    try {
      const response = await firebaseService.customers.getById(customerId);
      return response;
    } catch (err) {
      console.error('Get customer error:', err);
      throw err;
    }
  }, []);

  const createCustomer = useCallback(async (customerData: Partial<Customer>) => {
    try {
      const response = await firebaseService.customers.create(customerData);
      
      // Refresh the list after creating
      await fetchCustomers();
      
      return response;
    } catch (err) {
      console.error('Create customer error:', err);
      throw err;
    }
  }, [fetchCustomers]);

  const updateCustomer = useCallback(async (customerId: string, updates: Partial<Customer>) => {
    try {
      const response = await firebaseService.customers.update(customerId, updates);
      
      // Update local state
      setCustomers(prev => prev.map(customer => 
        customer.id === customerId ? { ...customer, ...updates } : customer
      ));
      
      return response;
    } catch (err) {
      console.error('Update customer error:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    if (options.autoLoad !== false) {
      fetchCustomers();
    }
  }, [fetchCustomers, options.autoLoad]);

  return {
    customers,
    metrics,
    loading,
    error,
    refreshing,
    refresh,
    searchCustomers,
    getCustomer,
    createCustomer,
    updateCustomer,
    fetchCustomers,
  };
};