// src/hooks/useInvoices.ts
import { useState, useEffect, useCallback } from 'react';
import firebaseService from '../services/firebaseService';
import { useAuthStore } from '../store/authStore';

export interface Invoice {
  id: string;
  invoice_id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  company_name?: string;
  date: string;
  due_date: string;
  total: number;
  balance: number;
  status: string;
  current_sub_status?: string;
  payment_expected_date?: string;
  last_payment_date?: string;
  reminders_sent?: number;
  salesperson_id?: string;
  salesperson_name?: string;
  salesorder_id?: string;
  salesorder_number?: string;
  email?: string;
  phone?: string;
  currency_code?: string;
  currency_symbol?: string;
  invoice_url?: string;
  is_emailed?: boolean;
  is_viewed_by_client?: boolean;
  created_time?: string;
  last_modified_time?: string;
  [key: string]: any;
}

interface InvoiceMetrics {
  totalInvoices: number;
  totalValue: number;
  outstandingValue: number;
  overdueInvoices: number;
  paidInvoices: number;
  avgInvoiceValue: number;
}

interface UseInvoicesOptions {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  autoLoad?: boolean;
}

export const useInvoices = (options: UseInvoicesOptions = {}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [metrics, setMetrics] = useState<InvoiceMetrics>({
    totalInvoices: 0,
    totalValue: 0,
    outstandingValue: 0,
    overdueInvoices: 0,
    paidInvoices: 0,
    avgInvoiceValue: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuthStore();

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    return due < now;
  };

  const getInvoiceStatus = (invoice: Invoice) => {
    if (invoice.balance === 0) return 'paid';
    if (isOverdue(invoice.due_date)) return 'overdue';
    if (invoice.status?.toLowerCase() === 'draft') return 'draft';
    return 'outstanding';
  };

  const fetchInvoices = useCallback(async (isRefresh = false) => {
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

      // Use the Firebase invoices service
      const response = await firebaseService.invoices.getAll({
        page: options.page || 1,
        limit: options.limit || 25,
        status: options.status,
        search: options.search,
      });

      console.log('Invoices API response:', response);

      // Handle Firebase response structure
      const invoicesData = response?.data || [];
      const totalInvoices = response?.total || invoicesData.length;

      setInvoices(Array.isArray(invoicesData) ? invoicesData as Invoice[] : []);
      
      // Calculate metrics
      if (Array.isArray(invoicesData)) {
        const totalValue = invoicesData.reduce((sum, invoice: any) => sum + (invoice.total || 0), 0);
        const outstandingValue = invoicesData.reduce((sum, invoice: any) => {
          return sum + (invoice.balance > 0 ? invoice.balance : 0);
        }, 0);
        const avgInvoiceValue = totalInvoices > 0 ? totalValue / totalInvoices : 0;
        
        const paidInvoices = invoicesData.filter((invoice: any) => 
          getInvoiceStatus(invoice) === 'paid'
        ).length;

        const overdueInvoices = invoicesData.filter((invoice: any) => 
          getInvoiceStatus(invoice) === 'overdue'
        ).length;

        setMetrics({
          totalInvoices,
          totalValue,
          outstandingValue,
          overdueInvoices,
          paidInvoices,
          avgInvoiceValue,
        });
      }
    } catch (err) {
      console.error('Invoices fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
      // For development, provide empty data on error
      setInvoices([]);
      setMetrics({
        totalInvoices: 0,
        totalValue: 0,
        outstandingValue: 0,
        overdueInvoices: 0,
        paidInvoices: 0,
        avgInvoiceValue: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, options.page, options.limit, options.status, options.search]);

  const refresh = useCallback(() => {
    fetchInvoices(true);
  }, [fetchInvoices]);

  const searchInvoices = useCallback(async (query: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await firebaseService.invoices.getAll({
        search: query,
        page: 1,
        limit: options.limit || 25,
        status: options.status,
      });

      const invoicesData = response?.data || [];
      setInvoices(Array.isArray(invoicesData) ? invoicesData as Invoice[] : []);
    } catch (err) {
      console.error('Invoices search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to search invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [options.limit, options.status]);

  const getInvoice = useCallback(async (invoiceId: string) => {
    try {
      const response = await firebaseService.invoices.getById(invoiceId);
      return response;
    } catch (err) {
      console.error('Get invoice error:', err);
      throw err;
    }
  }, []);

  const createInvoice = useCallback(async (invoiceData: Partial<Invoice>) => {
    try {
      const response = await firebaseService.invoices.create(invoiceData);
      
      // Refresh the list after creating
      await fetchInvoices();
      
      return response;
    } catch (err) {
      console.error('Create invoice error:', err);
      throw err;
    }
  }, [fetchInvoices]);

  const updateInvoice = useCallback(async (invoiceId: string, updates: Partial<Invoice>) => {
    try {
      const response = await firebaseService.invoices.update(invoiceId, updates);
      
      // Update local state
      setInvoices(prev => prev.map(invoice => 
        invoice.id === invoiceId ? { ...invoice, ...updates } : invoice
      ));
      
      return response;
    } catch (err) {
      console.error('Update invoice error:', err);
      throw err;
    }
  }, []);

  const deleteInvoice = useCallback(async (invoiceId: string) => {
    try {
      const response = await firebaseService.invoices.delete(invoiceId);
      
      // Remove from local state
      setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId));
      
      return response;
    } catch (err) {
      console.error('Delete invoice error:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    if (options.autoLoad !== false) {
      fetchInvoices();
    }
  }, [fetchInvoices, options.autoLoad]);

  return {
    invoices,
    metrics,
    loading,
    error,
    refreshing,
    refresh,
    searchInvoices,
    getInvoice,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    fetchInvoices,
    getInvoiceStatus,
    isOverdue,
  };
};