import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { collection, getDocs, query, where, orderBy, getDoc, doc, limit, startAfter, DocumentSnapshot, and, or } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaEye, FaUser, FaSearch, FaFileInvoice, FaPlus, FaEdit, FaChevronDown, FaChevronUp, FaClock, FaCheckCircle, FaTimes } from 'react-icons/fa';
import { ProgressLoader } from './ProgressLoader';
import styles from './ViewOrders.module.css';
import { MetricCard } from './shared';
import OrderCounterService from '../services/OrderCounterService';
import '../styles/animations.css';

interface SalesOrder {
  id: string;
  salesorder_id: string;
  salesorder_number: string;
  customer_id: string;
  customer_name: string;
  customer_name_lowercase?: string; // For search optimization
  company_name: string;
  company_name_lowercase?: string; // For search optimization
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

interface LocationState {
  customerId?: string;
  customerName?: string;
}

interface LineItem {
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

interface OrderMetrics {
  totalOrders: number;
  totalValue: number;
  avgOrderValue: number;
  pendingOrders: number;
  shippedOrders: number;
  thisMonthOrders: number;
}

const PAGE_SIZE = 50; // Load 50 orders at a time
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
const SEARCH_DEBOUNCE_MS = 500; // Debounce search input

export default function ViewOrders() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());
  const [orderMetrics, setOrderMetrics] = useState<OrderMetrics>({
    totalOrders: 0,
    totalValue: 0,
    avgOrderValue: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    thisMonthOrders: 0
  });
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageDocuments, setPageDocuments] = useState<Map<number, DocumentSnapshot>>(new Map());
  const location = useLocation();
  const locationState = location.state as LocationState;
  const [customerFilter, setCustomerFilter] = useState<string>('');
  const [customerFilterName, setCustomerFilterName] = useState<string>('');
  
  // Cache management
  const cacheRef = useRef<{
    data: SalesOrder[];
    timestamp: number;
    metrics: OrderMetrics;
    search: string;
    statusFilter: string;
    userRole: string;
    userZohoId: string;
  } | null>(null);
  
  // Track which orders have had their line items loaded
  const lineItemsLoadedRef = useRef<Set<string>>(new Set());
  
  // User info
  const navigate = useNavigate();
  const currentUserId = auth.currentUser?.uid;
  const [userRole, setUserRole] = useState<string>('');
  const [userZohoId, setUserZohoId] = useState<string>('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [search]);

  // Load user info
  useEffect(() => {
    const loadUserInfo = async () => {
      if (!currentUserId) return;
      
      const userDoc = await getDoc(doc(db, 'users', currentUserId));
      const userData = userDoc.data();
      const role = userData?.role || '';
      const zohoId = userData?.zohospID || userData?.zohoAgentID || '';
      console.log('User info loaded:', { role, zohoId, userData });
      setUserRole(role);
      setUserZohoId(zohoId);
      
      // Handle customer filter from navigation state
      if (locationState?.customerId) {
        setCustomerFilter(locationState.customerId);
        setCustomerFilterName(locationState.customerName || 'Selected Customer');
      }
    };
    
    loadUserInfo();
  }, [currentUserId, locationState]);

  // Load metrics from counter service
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        let counters;
        
        const isSalesAgent = userRole.toLowerCase() === 'salesagent' || userRole.toLowerCase() === 'sales_agent';
        
        if (isSalesAgent && userZohoId) {
          counters = await OrderCounterService.getAgentCounters(userZohoId);
        } else {
          counters = await OrderCounterService.getCounters();
        }
        
        // Calculate total value and average from loaded orders
        const totalValue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
        const avgOrderValue = orders.length > 0 ? totalValue / orders.length : 0;
        
        const metrics = {
          totalOrders: counters.total,
          totalValue,
          avgOrderValue,
          pendingOrders: counters.pending,
          shippedOrders: counters.shipped,
          thisMonthOrders: counters.thisMonth
        };
        
        setOrderMetrics(metrics);
        
        // Update total pages based on the total count
        if (counters.total > 0) {
          setTotalPages(Math.ceil(counters.total / PAGE_SIZE));
        }
      } catch (error) {
        console.error('Error loading metrics:', error);
      }
    };
    
    if (userRole) {
      loadMetrics();
    }
  }, [userRole, userZohoId, orders]);

  // Load orders when search, filter, or page changes
  useEffect(() => {
    // Don't fetch until we have user info loaded
    if (!userRole) {
      console.log('Waiting for user role to load...');
      return;
    }
    
    // For sales agents, also wait for Zoho ID
    const isSalesAgent = userRole.toLowerCase() === 'salesagent' || userRole.toLowerCase() === 'sales_agent';
    if (isSalesAgent && !userZohoId) {
      console.log('Waiting for sales agent Zoho ID to load...');
      return;
    }
    
    console.log('Fetching orders with:', { userRole, userZohoId, currentPage, customerFilter });
    
    // Check if we have a valid cache for page 1
    if (
      currentPage === 1 &&
      cacheRef.current && 
      Date.now() - cacheRef.current.timestamp < CACHE_DURATION &&
      cacheRef.current.search === debouncedSearch &&
      cacheRef.current.statusFilter === statusFilter &&
      cacheRef.current.userRole === userRole &&
      cacheRef.current.userZohoId === userZohoId &&
      !customerFilter // Don't use cache when filtering by customer
    ) {
      console.log('Using cached data');
      setOrders(cacheRef.current.data);
      setOrderMetrics(cacheRef.current.metrics);
      setLoading(false);
      return;
    }
    
    // Reset for new search/filter
    if (currentPage === 1) {
      setOrders([]);
      setLastDoc(null);
      setPageDocuments(new Map());
    }
    
    fetchOrders(currentPage === 1);
  }, [debouncedSearch, statusFilter, userRole, userZohoId, currentPage, customerFilter]);

  const fetchOrders = async (isInitialLoad = false) => {
    setLoading(true);
    
    try {
      setError(null);
      
      let ordersQuery;
      let baseCollection;
      const queryConstraints: any[] = [];
      
      // Use agent-specific collection for sales agents
      const isSalesAgent = userRole.toLowerCase() === 'salesagent' || userRole.toLowerCase() === 'sales_agent';
      
      if (isSalesAgent && userZohoId) {
        console.log(`Fetching from sales agent collection: sales_agents/${userZohoId}/customers_orders`);
        baseCollection = collection(db, 'sales_agents', userZohoId, 'customers_orders');
      } else {
        console.log(`Fetching from global sales_orders collection (role: ${userRole}, zohoId: ${userZohoId})`);
        baseCollection = collection(db, 'sales_orders');
      }
      
      // Add customer filter constraint FIRST (most selective)
      if (customerFilter) {
        queryConstraints.push(where('customer_id', '==', customerFilter));
      }
      
      // Add search constraints (server-side search)
      if (debouncedSearch) {
        setIsSearching(true);
        const searchLower = debouncedSearch.toLowerCase();
        
        // For order number search (exact match)
        if (/^[A-Z0-9-]+$/i.test(debouncedSearch)) {
          queryConstraints.push(where('salesorder_number', '==', debouncedSearch.toUpperCase()));
        } else {
          // For customer/company name search
          queryConstraints.push(
            or(
              and(
                where('customer_name_lowercase', '>=', searchLower),
                where('customer_name_lowercase', '<=', searchLower + '\uf8ff')
              ),
              and(
                where('company_name_lowercase', '>=', searchLower),
                where('company_name_lowercase', '<=', searchLower + '\uf8ff')
              )
            )
          );
        }
      }
      
      // Add status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'pending') {
          queryConstraints.push(
            or(
              where('status', '==', 'draft'),
              where('status', '==', 'sent'),
              where('current_sub_status', '==', 'open')
            )
          );
        } else if (statusFilter === 'shipped') {
          queryConstraints.push(
            or(
              where('status', '==', 'fulfilled'),
              where('current_sub_status', '==', 'shipped')
            )
          );
        } else if (statusFilter === 'closed') {
          queryConstraints.push(where('current_sub_status', '==', 'closed'));
        }
      }
      
      // Add ordering and pagination
      queryConstraints.push(orderBy('date', 'desc'));
      queryConstraints.push(limit(PAGE_SIZE));
      
      // Use the stored document for the previous page if navigating
      if (currentPage > 1) {
        const prevPageDoc = pageDocuments.get(currentPage - 1);
        if (prevPageDoc) {
          queryConstraints.push(startAfter(prevPageDoc));
        }
      }
      
      // Build and execute query
      ordersQuery = query(baseCollection, ...queryConstraints);
      const ordersSnapshot = await getDocs(ordersQuery);
      
      const newOrders: SalesOrder[] = ordersSnapshot.docs.map(orderDoc => {
        const orderData = orderDoc.data() as SalesOrder;
        return {
          ...orderData,
          id: orderDoc.id,
          line_items: [],
          line_items_count: orderData.line_items_count || 0
        };
      });
      
      console.log(`Fetched ${newOrders.length} orders from ${isSalesAgent ? 'agent' : 'global'} collection`);
      if (newOrders.length > 0) {
        console.log('Sample order:', { 
          number: newOrders[0].salesorder_number, 
          customer: newOrders[0].customer_name,
          company: newOrders[0].company_name 
        });
      }
      
      // Update state
      setOrders(newOrders);
      
      // Update pagination
      if (ordersSnapshot.docs.length > 0) {
        const lastDocInPage = ordersSnapshot.docs[ordersSnapshot.docs.length - 1];
        setLastDoc(lastDocInPage);
        
        // Store the last document of this page for navigation
        const newPageDocs = new Map(pageDocuments);
        newPageDocs.set(currentPage, lastDocInPage);
        setPageDocuments(newPageDocs);
        
        // Update hasMore based on whether we got a full page
        setHasMore(ordersSnapshot.docs.length === PAGE_SIZE);
      } else {
        setHasMore(false);
        setTotalPages(currentPage);
      }
      
      // Update cache
      if (isInitialLoad) {
        cacheRef.current = {
          data: newOrders,
          timestamp: Date.now(),
          metrics: orderMetrics,
          search: debouncedSearch,
          statusFilter: statusFilter,
          userRole: userRole,
          userZohoId: userZohoId
        };
      }
      
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const clearCustomerFilter = () => {
    setCustomerFilter('');
    setCustomerFilterName('');
    // Clear location state by replacing current history entry
    window.history.replaceState({}, '', '/orders');
    
    // Reset pagination and clear current orders to force a fresh fetch
    setCurrentPage(1);
    setOrders([]);
    setLastDoc(null);
    setPageDocuments(new Map());
    
    // Clear cache to ensure fresh data
    cacheRef.current = null;
    
    // Clear line items cache
    lineItemsLoadedRef.current.clear();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (newPage > totalPages && totalPages > 0)) return;
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Lazy load line items only when needed
  const loadLineItemsForOrder = useCallback(async (orderId: string) => {
    if (lineItemsLoadedRef.current.has(orderId)) {
      return;
    }
    
    try {
      let lineItemsSnapshot;
      
      // Use agent-specific path for sales agents
      const isSalesAgent = userRole.toLowerCase() === 'salesagent' || userRole.toLowerCase() === 'sales_agent';
      if (isSalesAgent && userZohoId) {
        // First, try the agent-specific path
        lineItemsSnapshot = await getDocs(
          collection(db, 'sales_agents', userZohoId, 'customers_orders', orderId, 'order_line_items')
        );
        
        // If no line items found in agent path, fallback to global path
        if (lineItemsSnapshot.empty) {
          lineItemsSnapshot = await getDocs(
            collection(db, 'sales_orders', orderId, 'order_line_items')
          );
        }
      } else {
        lineItemsSnapshot = await getDocs(
          collection(db, 'sales_orders', orderId, 'order_line_items')
        );
      }
      
      const lineItems: LineItem[] = lineItemsSnapshot.docs.map(itemDoc => ({
        id: itemDoc.id,
        ...itemDoc.data()
      } as LineItem));
      
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, line_items: lineItems, line_items_count: lineItems.length }
            : order
        )
      );
      
      lineItemsLoadedRef.current.add(orderId);
      
    } catch (err) {
      console.error(`Error loading line items for order ${orderId}:`, err);
    }
  }, [userRole, userZohoId]);

  const generateOrderChartData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.date || order.created_time);
        return orderDate.toDateString() === date.toDateString();
      });
      
      data.push({
        date: date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
        value: dayOrders.length,
        revenue: dayOrders.reduce((sum, order) => sum + (order.total || 0), 0)
      });
    }
    return data;
  };

  const handleViewOrder = async (order: SalesOrder) => {
    await loadLineItemsForOrder(order.id);
    // Include agent context in navigation for sales agents
    const isSalesAgent = userRole.toLowerCase() === 'salesagent' || userRole.toLowerCase() === 'sales_agent';
    if (isSalesAgent && userZohoId) {
      navigate(`/order/${order.id}?agent=${userZohoId}`);
    } else {
      navigate(`/order/${order.id}`);
    }
  };

  const handleViewInvoice = async (order: SalesOrder) => {
    try {
      // First check if order has invoices array
      if (order.invoices && order.invoices.length > 0) {
        const firstInvoice = order.invoices[0];
        if (firstInvoice.invoice_id) {
          navigate(`/invoice/${firstInvoice.invoice_id}`);
          return;
        }
      }
      
      // Fallback to querying invoices collection
      let invoicesQuery;
      
      const isSalesAgent = userRole.toLowerCase() === 'salesagent' || userRole.toLowerCase() === 'sales_agent';
      if (isSalesAgent && userZohoId) {
        // First try agent-specific collection
        invoicesQuery = query(
          collection(db, 'sales_agents', userZohoId, 'customers_invoices'),
          where('salesorder_id', '==', order.salesorder_id),
          limit(1)
        );
      } else {
        invoicesQuery = query(
          collection(db, 'invoices'),
          where('salesorder_id', '==', order.salesorder_id),
          limit(1)
        );
      }
      
      const invoicesSnapshot = await getDocs(invoicesQuery);
      if (!invoicesSnapshot.empty) {
        const invoiceData = invoicesSnapshot.docs[0];
        navigate(`/invoice/${invoiceData.id}`);
      } else {
        console.log('No invoice found for order:', order.salesorder_number);
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
    }
  };

  const handleGenerateInvoice = (order: SalesOrder) => {
    navigate('/invoice/new', { state: { orderId: order.id, orderData: order } });
  };

  const handleEditInvoice = async (order: SalesOrder) => {
    if (order.invoices && order.invoices.length > 0) {
      const firstInvoice = order.invoices[0];
      if (firstInvoice.invoice_id) {
        navigate(`/invoice/edit/${firstInvoice.invoice_id}`, { state: { orderId: order.id, orderData: order } });
      }
    }
  };

  const handleEditOrder = (order: SalesOrder) => {
    // Navigate to view order page with edit mode (can be modified to support inline editing)
    navigate(`/order/${order.id}?edit=true`);
  };

  const handleCancelOrder = (order: SalesOrder) => {
    // TODO: Implement cancel order functionality
    console.log('Cancel order:', order.id);
  };

  const toggleOrderExpansion = async (orderId: string) => {
    // Load line items if not already loaded
    const order = orders.find(o => o.id === orderId);
    if (order && (!order.line_items || order.line_items.length === 0)) {
      await loadLineItemsForOrder(orderId);
    }
    
    setExpandedOrderIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const getCompanyLogo = (order: SalesOrder): string | null => {
    // Check if logo exists in public folder based on company name or brand
    // You can customize this logic based on how you want to map companies to logos
    if (!order.company_name) return null;
    
    // Normalize company name to create potential filename
    const companyNameLower = order.company_name.toLowerCase();
    
    // Map known companies to their logo files
    const logoMappings: Record<string, string> = {
      'blomus': '/logos/blomus.png',
      'joseph joseph': '/josephjoseph.png',
      'eva solo': '/evasolo.png',
      'dmb': '/logos/dmb-logo.png',
      'elvang': '/logos/elvang.png',
      'my-flame-lifestyle': '/logos/myflame.png',
      'rader': '/logos/rader.png',
      'relaxound': '/logos/relaxound.png',
      'remember': '/logos/remember.png',
      // Add more mappings as needed
    };
    
    // Check if we have a mapping for this company
    for (const [key, logoPath] of Object.entries(logoMappings)) {
      if (companyNameLower.includes(key)) {
        return logoPath;
      }
    }
    
    // Check line items for brand information
    if (order.line_items && order.line_items.length > 0) {
      const firstBrand = order.line_items[0].brand?.toLowerCase();
      if (firstBrand && logoMappings[firstBrand]) {
        return logoMappings[firstBrand];
      }
    }
    
    return null;
  };

  const getShippingStatus = (order: SalesOrder): 'shipped' | 'partial' | 'not_shipped' => {
    if (order.shipped_status === 'shipped' || order.current_sub_status === 'shipped') {
      return 'shipped';
    } else if (order.shipped_status === 'partially_shipped') {
      return 'partial';
    }
    return 'not_shipped';
  };

  const getInvoiceStatus = (order: SalesOrder): 'paid' | 'sent' | 'draft' | 'overdue' | 'void' | 'not_invoiced' => {
    if (!order.invoices || order.invoices.length === 0) {
      return 'not_invoiced';
    }
    const invoice = order.invoices[0];
    return invoice.status?.toLowerCase() || 'draft';
  };

  const getItemsShipped = (order: SalesOrder): number => {
    if (!order.line_items || order.line_items.length === 0) return 0;
    return order.line_items.reduce((sum: number, item: LineItem) => sum + (item.quantity_shipped || 0), 0);
  };

  const getAwaitingShip = (order: SalesOrder): number => {
    if (!order.line_items || order.line_items.length === 0) {
      // If line items not loaded, estimate based on status
      if (order.shipped_status === 'shipped') return 0;
      if (order.shipped_status === 'partially_shipped') return Math.floor((order.line_items_count || 0) / 2);
      return order.line_items_count || 0;
    }
    const totalItems = order.line_items.reduce((sum: number, item: LineItem) => sum + item.quantity, 0);
    const shippedItems = getItemsShipped(order);
    return totalItems - shippedItems;
  };

  const handleGenerateAdditionalInvoice = (order: SalesOrder) => {
    navigate('/invoice/new', { state: { orderId: order.id, orderData: order, isAdditional: true } });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-GB');
    } catch {
      return 'Invalid Date';
    }
  };

  const formatTime = (dateString: string): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCustomerInitials = (name: string): string => {
    if (!name) return '??';
    const words = name.split(' ');
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getStatusIcon = (status: string): string => {
    const statusIcons: Record<string, string> = {
      closed: '✅',
      draft: '📝',
      open: '🔄',
      sent: '📤',
      fulfilled: '✓',
      pending: '⏳',
      shipped: '🚚'
    };
    return statusIcons[status.toLowerCase()] || '📦';
  };

  const handleRefresh = async () => {
    console.log('Refreshing orders list...');
    cacheRef.current = null;
    setOrders([]);
    setLastDoc(null);
    setPageDocuments(new Map());
    setCurrentPage(1);
    setHasMore(true);
    lineItemsLoadedRef.current.clear();
    await fetchOrders(true);
  };

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  if (loading && orders.length === 0) {
    return (
      <div className="dashboard-loading-container">
        <ProgressLoader
          progress={33}
          messages={[
            'Loading orders...',
            'Fetching order details...',
            'Processing line items...',
            'Calculating metrics...'
          ]}
        />
      </div>
    );
  }

  // Loading skeleton for smooth transitions
  const LoadingSkeleton = () => (
    <div className={styles.loadingSkeleton}>
      {[...Array(5)].map((_, i) => (
        <div key={i} className={styles.skeletonRow}>
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
        </div>
      ))}
    </div>
  );

  if (error && orders.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>⚠️</div>
        <h3>Error loading orders</h3>
        <p>{error}</p>
        <button onClick={handleRefresh} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.ordersContainer}>
      <div className={styles.ordersHeader}>
        <h1>{userRole.toLowerCase() === 'salesagent' || userRole.toLowerCase() === 'sales_agent' ? 'My Orders' : 'Orders'}</h1>
        <div className={styles.headerActions}>
          {/* Show customer filter indicator */}
          {customerFilter && (
            <div className={styles.customerFilterIndicator}>
              <span>Showing orders for: <strong>{customerFilterName}</strong></span>
              <button 
                onClick={clearCustomerFilter}
                className={styles.clearFilterButton}
                title="Show all orders"
              >
                ✕
              </button>
            </div>
          )}
          <button onClick={handleRefresh} className={styles.refreshButton} title="Refresh orders">
            🔄
          </button>
        </div>
      </div>
        
      {/* Metrics with accurate counts from counter service */}
      <div className={styles['metricsGrid-4']}>
        <MetricCard
          id="orders-this-month"
          title="Orders This Month"
          value={orderMetrics.thisMonthOrders}
          subtitle={userRole.toLowerCase() === 'salesagent' || userRole.toLowerCase() === 'sales_agent' ? 'Your orders this month' : 'Current month'}
          icon={<span>📦</span>}
          color="#79d5e9"
          displayMode="compact"
          chartData={generateOrderChartData().map(d => ({ name: d.date, value: d.value }))}
        />
        
        <MetricCard
          id="total-value"
          title="Total Value"
          value={orderMetrics.totalValue}
          subtitle={userRole.toLowerCase() === 'salesagent' || userRole.toLowerCase() === 'sales_agent' ? `From your ${orders.length} loaded orders` : `From ${orders.length} loaded orders`}
          icon={<span>💰</span>}
          color="#4daeac"
          displayMode="compact"
          format="currency"
          chartData={generateOrderChartData().map(d => ({ name: d.date, value: d.revenue }))}
        />
        
        <MetricCard
          id="average-order"
          title="Average Order"
          value={orderMetrics.avgOrderValue}
          subtitle="Per transaction"
          icon={<span>📊</span>}
          color="#61bc8e"
          displayMode="compact"
          format="currency"
        />
        
        <MetricCard
          id="pending-orders"
          title="Pending Orders"
          value={orderMetrics.pendingOrders}
          subtitle={userRole.toLowerCase() === 'salesagent' || userRole.toLowerCase() === 'sales_agent' ? 'Your orders awaiting fulfillment' : 'Awaiting fulfillment'}
          icon={<span>⏳</span>}
          color="#fbbf24"
          displayMode="compact"
          onClick={() => setStatusFilter('pending')}
        />
      </div>

      {/* Search and Filter Controls */}
      <div className={styles.ordersControls}>
        <div className={styles.searchContainer}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by order #, customer, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          {isSearching && <span className={styles.searchIndicator}>Searching...</span>}
        </div>
        
        <div className={styles.filterControls}>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.statusFilter}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="shipped">Shipped</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Search info */}
      {debouncedSearch && (
        <div className={styles.searchInfo}>
          Showing results for "{debouncedSearch}" ({orders.length} found)
        </div>
      )}

      {/* Orders Table and Pagination */}
      <div className={styles.ordersWrapper}>
        <div className={styles.ordersTableContainer}>
          <div className={styles.ordersTable}>
            <div className={styles.tableHeader}>
              <div className={styles.tableRow}>
                <div className={styles.tableCell}>Order #</div>
                <div className={styles.tableCell}>Customer</div>
                <div className={styles.tableCell}>Date</div>
                <div className={styles.tableCell}>Total</div>
                <div className={styles.tableCell}></div>
              </div>
            </div>
            
            <div className={styles.tableBody}>
              {orders.length === 0 && !loading ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📦</div>
                  <h3>No orders found</h3>
                  <p>
                    {debouncedSearch || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria.'
                      : currentPage > 1 
                        ? 'No more orders to display.'
                        : 'No orders to display.'}
                  </p>
                </div>
              ) : orders.length > 0 ? (
                orders.map((order, index) => {
                  const isExpanded = expandedOrderIds.has(order.id);
                  const isCompleted = order.current_sub_status?.toLowerCase() === 'closed' || order.status?.toLowerCase() === 'closed';
                  const shippingStatus = getShippingStatus(order);
                  const invoiceStatus = getInvoiceStatus(order);
                  const companyLogo = getCompanyLogo(order);
                  
                  return (
                    <React.Fragment key={order.id}>
                      <div 
                        className={`${styles.tableRow} ${isExpanded ? styles.expanded : ''}`}
                        style={{ animationDelay: `${Math.min(index * 0.05, 0.25)}s` }}
                        onClick={() => toggleOrderExpansion(order.id)}
                      >
                        {/* Order Number */}
                        <div className={styles.tableCell} data-label="Order #">
                          <strong className={styles.orderNumber}>
                            {order.salesorder_number}
                          </strong>
                        </div>
                        
                        {/* Customer with Avatar */}
                        <div className={styles.tableCell} data-label="Customer">
                          <div className={styles.customerInfo}>
                            <div className={styles.customerAvatar}>
                              {getCustomerInitials(order.customer_name)}
                            </div>
                            <div className={styles.customerDetails}>
                              <strong>{order.customer_name}</strong>
                            </div>
                          </div>
                        </div>
                        
                        {/* Date with Time */}
                        <div className={styles.tableCell} data-label="Date">
                          <div className={styles.dateCell}>
                            <span className={styles.dateMain}>
                              {formatDate(order.date || order.created_time)}
                            </span>
                            <span className={styles.dateTime}>
                              {formatTime(order.date || order.created_time)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Total with Gradient */}
                        <div className={styles.tableCell} data-label="Total">
                          <strong className={styles.totalAmount}>
                            {formatCurrency(order.total || 0)}
                          </strong>
                        </div>
                        
                        {/* Company Logo and Expand Button */}
                        <div className={styles.tableCell} data-label="">
                          <div className={styles.endRowSection}>
                            {companyLogo && (
                              <img 
                                src={companyLogo} 
                                alt="Company Logo" 
                                className={styles.companyLogo}
                              />
                            )}
                            <button 
                              className={styles.expandButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleOrderExpansion(order.id);
                              }}
                            >
                              {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className={styles.expandedContent}>
                          <div className={styles.expandedRow}>
                            {/* Status Icon */}
                            <div className={styles.statusIconContainer}>
                              {isCompleted ? (
                                <div className={`${styles.statusIcon} ${styles.completedIcon}`}>
                                  <FaCheckCircle />
                                </div>
                              ) : (
                                <div className={`${styles.statusIcon} ${styles.pendingIcon}`}>
                                  <FaClock />
                                </div>
                              )}
                            </div>
                            
                            {/* Order Details */}
                            <div className={styles.expandedDetails}>
                              <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Shipped Date</span>
                                <span className={styles.detailValue}>
                                  {(() => {
                                    // Check packages for shipment date
                                    if (order.packages && Object.keys(order.packages).length > 0) {
                                      const firstPackage = Object.values(order.packages)[0] as any;
                                      if (firstPackage?.shipment_order?.shipment_date) {
                                        return formatDate(firstPackage.shipment_order.shipment_date);
                                      }
                                    }
                                    return order.delivery_date ? formatDate(order.delivery_date) : 'Not shipped';
                                  })()}
                                </span>
                              </div>
                              <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Awaiting Ship</span>
                                <span className={styles.detailValue}>{getAwaitingShip(order)}</span>
                              </div>
                              <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Items Shipped</span>
                                <span className={styles.detailValue}>{getItemsShipped(order)}</span>
                              </div>
                              <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Total</span>
                                <span className={styles.detailValue}>{formatCurrency(order.total || 0)}</span>
                              </div>
                            </div>
                            
                            {/* Status Badges */}
                            <div className={styles.statusBadges}>
                              <button 
                                className={`${styles.statusBadgeButton} ${styles[`shipping${shippingStatus.charAt(0).toUpperCase() + shippingStatus.slice(1).replace(/_/g, '')}`]}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Handle shipping status click
                                }}
                              >
                                {shippingStatus === 'shipped' ? 'Shipped' : 
                                 shippingStatus === 'partial' ? 'Partial Ship' : 
                                 'Not Shipped'}
                              </button>
                              
                              <button 
                                className={`${styles.statusBadgeButton} ${styles[`invoice${invoiceStatus.charAt(0).toUpperCase() + invoiceStatus.slice(1).replace(/_/g, '')}`]}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (invoiceStatus !== 'not_invoiced') {
                                    handleViewInvoice(order);
                                  }
                                }}
                              >
                                {invoiceStatus === 'paid' ? 'Invoiced' :
                                 invoiceStatus === 'sent' ? 'Invoiced' :
                                 invoiceStatus === 'draft' ? 'Draft Invoice' :
                                 invoiceStatus === 'overdue' ? 'Overdue' :
                                 invoiceStatus === 'void' ? 'Void' :
                                 'Not Invoiced'}
                              </button>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className={styles.expandedActions}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditOrder(order);
                                }}
                                className={`${styles.expandedActionBtn} ${styles.editOrderBtn}`}
                                title="Edit Order"
                              >
                                <FaEdit /> Edit Order
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewOrder(order);
                                }}
                                className={`${styles.expandedActionBtn} ${styles.viewOrderBtn}`}
                                title="View Order"
                              >
                                <FaEye /> View Order
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelOrder(order);
                                }}
                                className={`${styles.expandedActionBtn} ${styles.cancelOrderBtn}`}
                                title="Cancel Order"
                              >
                                <FaTimes /> Cancel Order
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })
              ) : null}
            </div>
          </div>
          
          {/* Loading skeleton for new data */}
          {loading && orders.length === 0 && (
            <LoadingSkeleton />
          )}
        </div>
        
        {/* Pagination Controls */}
        {(orders.length > 0 || (loading && currentPage === 1)) && (
          <div className={styles.paginationContainer}>
            <div className={styles.paginationInfo}>
              {loading ? (
                'Loading...'
              ) : (
                <>
                  Showing {((currentPage - 1) * PAGE_SIZE) + 1} - {Math.min(currentPage * PAGE_SIZE, ((currentPage - 1) * PAGE_SIZE) + orders.length)} 
                  {orderMetrics.totalOrders > 0 && ` of ${orderMetrics.totalOrders} orders`}
                </>
              )}
            </div>
            
            <div className={styles.paginationControls}>
              <button
                className={styles.paginationButton}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
              >
                Previous
              </button>
              
              {/* Page numbers */}
              <div className={styles.pageNumbers}>
                {currentPage > 2 && (
                  <>
                    <button
                      className={styles.pageNumber}
                      onClick={() => handlePageChange(1)}
                    >
                      1
                    </button>
                    {currentPage > 3 && <span className={styles.pageDots}>...</span>}
                  </>
                )}
                
                {currentPage > 1 && (
                  <button
                    className={styles.pageNumber}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    {currentPage - 1}
                  </button>
                )}
                
                <button
                  className={`${styles.pageNumber} ${styles.active}`}
                  disabled
                >
                  {currentPage}
                </button>
                
                {hasMore && (
                  <button
                    className={styles.pageNumber}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    {currentPage + 1}
                  </button>
                )}
                
                {hasMore && totalPages > 0 && currentPage < totalPages - 1 && (
                  <>
                    {currentPage < totalPages - 2 && <span className={styles.pageDots}>...</span>}
                    <button
                      className={styles.pageNumber}
                      onClick={() => handlePageChange(totalPages)}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              
              <button
                className={styles.paginationButton}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasMore || loading}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}