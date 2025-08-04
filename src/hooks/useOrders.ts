// src/hooks/useOrders.ts
import { useState, useEffect, useCallback } from 'react';
import firebaseService from '../services/firebaseService';
import { useAuthStore } from '../store/authStore';

export interface LineItem {
  id: string;
  item_id: string;
  item_name: string;
  name?: string;
  sku: string;
  quantity: number;
  rate: number;
  total: number;
  item_total?: number;
  brand?: string;
  brand_normalized?: string;
  quantity_shipped: number;
}

export interface SalesOrder {
  id: string;
  salesorder_id: string;
  salesorder_number: string;
  customer_id: string;
  customer_name: string;
  customer_name_lowercase?: string;
  company_name: string;
  company_name_lowercase?: string;
  date: string;
  created_time: string;
  total: number;
  status: string;
  current_sub_status: string;
  salesperson_id: string;
  salesperson_name: string;
  line_items?: LineItem[];
  line_items_count?: number;
  invoice_split?: boolean;
  invoices?: any[];
  [key: string]: any;
}

interface OrderMetrics {
  totalOrders: number;
  totalValue: number;
  avgOrderValue: number;
  pendingOrders: number;
  shippedOrders: number;
  thisMonthOrders: number;
}

interface UseOrdersOptions {
  search?: string;
  status?: string;
  customerId?: string;
  page?: number;
  limit?: number;
  autoLoad?: boolean;
}

export const useOrders = (options: UseOrdersOptions = {}) => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [metrics, setMetrics] = useState<OrderMetrics>({
    totalOrders: 0,
    totalValue: 0,
    avgOrderValue: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    thisMonthOrders: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuthStore();

  const fetchOrders = useCallback(async (isRefresh = false) => {
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

      // Use the Firebase orders service
      const response = await firebaseService.orders.getAll({
        page: options.page || 1,
        limit: options.limit || 25,
        status: options.status,
      });

      console.log('Orders API response:', response);

      // Handle Firebase response structure
      const ordersData = response?.data || [];
      const totalOrders = response?.total || ordersData.length;

      setOrders(Array.isArray(ordersData) ? ordersData as SalesOrder[] : []);
      
      // Calculate metrics
      if (Array.isArray(ordersData)) {
        const totalValue = ordersData.reduce((sum, order: any) => sum + (order.total || 0), 0);
        const avgOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const thisMonthOrders = ordersData.filter((order: any) => {
          const orderDate = order.date?.toDate?.() || new Date(order.date || order.created_time);
          return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
        }).length;

        const pendingOrders = ordersData.filter((order: any) => 
          ['draft', 'sent', 'open'].includes(order.status?.toLowerCase() || order.current_sub_status?.toLowerCase())
        ).length;

        const shippedOrders = ordersData.filter((order: any) => 
          ['fulfilled', 'shipped'].includes(order.status?.toLowerCase() || order.current_sub_status?.toLowerCase())
        ).length;

        setMetrics({
          totalOrders,
          totalValue,
          avgOrderValue,
          pendingOrders,
          shippedOrders,
          thisMonthOrders,
        });
      }
    } catch (err) {
      console.error('Orders fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
      // For development, provide empty data on error
      setOrders([]);
      setMetrics({
        totalOrders: 0,
        totalValue: 0,
        avgOrderValue: 0,
        pendingOrders: 0,
        shippedOrders: 0,
        thisMonthOrders: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, options.page, options.limit, options.status]);

  const refresh = useCallback(() => {
    fetchOrders(true);
  }, [fetchOrders]);

  const searchOrders = useCallback(async (query: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await firebaseService.orders.getAll({
        page: 1,
        limit: options.limit || 25,
        status: options.status,
      });

      // Filter orders client-side for now (could be moved to server)
      const ordersData = response?.data || [];
      const filteredOrders = ordersData.filter((order: SalesOrder) => 
        order.salesorder_number?.toLowerCase().includes(query.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(query.toLowerCase()) ||
        order.company_name?.toLowerCase().includes(query.toLowerCase())
      );

      setOrders(Array.isArray(filteredOrders) ? filteredOrders as SalesOrder[] : []);
    } catch (err) {
      console.error('Orders search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to search orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [options.limit, options.status]);

  const getOrder = useCallback(async (orderId: string) => {
    try {
      const response = await firebaseService.orders.getById(orderId);
      return response;
    } catch (err) {
      console.error('Get order error:', err);
      throw err;
    }
  }, []);

  const createOrder = useCallback(async (orderData: Partial<SalesOrder>) => {
    try {
      const response = await firebaseService.orders.create(orderData);
      
      // Refresh the list after creating
      await fetchOrders();
      
      return response;
    } catch (err) {
      console.error('Create order error:', err);
      throw err;
    }
  }, [fetchOrders]);

  const updateOrder = useCallback(async (orderId: string, updates: Partial<SalesOrder>) => {
    try {
      const response = await firebaseService.orders.update(orderId, updates);
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, ...updates } : order
      ));
      
      return response;
    } catch (err) {
      console.error('Update order error:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    if (options.autoLoad !== false) {
      fetchOrders();
    }
  }, [fetchOrders, options.autoLoad]);

  return {
    orders,
    metrics,
    loading,
    error,
    refreshing,
    refresh,
    searchOrders,
    getOrder,
    createOrder,
    updateOrder,
    fetchOrders,
  };
};