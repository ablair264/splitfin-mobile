// src/components/CustomerOrders/CustomerOrders.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { collection, doc, getDoc, getDocs, query, orderBy, limit, startAfter, DocumentSnapshot, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { 
  FaSearch, 
  FaChevronDown, 
  FaChevronUp, 
  FaClock, 
  FaCheckCircle, 
  FaEye,
  FaRedo,
  FaShoppingCart
} from 'react-icons/fa';
import styles from './CustomerOrders.module.css';

interface OrderItem {
  item_id: string;
  name: string;
  quantity: number;
  rate: number;
  total: number;
  sku?: string;
}

interface Order {
  id: string;
  salesorder_id: string;
  salesorder_number: string;
  date: string;
  total: number;
  status: string;
  line_items?: OrderItem[];
  line_items_count?: number;
  customer_id: string;
  customer_name: string;
  shipping_address?: string;
  delivery_date?: string;
  tracking_number?: string;
  shipment_date?: string;
  created_time?: string;
  last_modified_time?: string;
  current_sub_status?: string;
  shipment_status?: string;
  shipped_status?: string;
  packages?: any[];
}

interface CustomerData {
  customer_id: string;
  customer_name?: string;
  company_name?: string;
  email?: string;
}

const PAGE_SIZE = 20;

export default function CustomerOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  
  // Refs to prevent multiple simultaneous fetches
  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Calculate order metrics
  const orderMetrics = React.useMemo(() => {
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const thisMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.date);
      return orderDate >= thisMonth;
    });

    const pendingOrders = orders.filter(order => {
      const status = order.status?.toLowerCase() || '';
      const currentSubStatus = order.current_sub_status?.toLowerCase() || '';
      const shipmentStatus = order.shipment_status?.toLowerCase() || '';
      
      // Order is pending if it's not delivered/closed/fulfilled
      return status !== 'delivered' && status !== 'closed' && status !== 'fulfilled' && 
             shipmentStatus !== 'delivered' && currentSubStatus !== 'closed';
    });

    const deliveredOrders = orders.filter(order => {
      const status = order.status?.toLowerCase() || '';
      const currentSubStatus = order.current_sub_status?.toLowerCase() || '';
      const shipmentStatus = order.shipment_status?.toLowerCase() || '';
      
      return status === 'delivered' || status === 'closed' || status === 'fulfilled' || 
             shipmentStatus === 'delivered' || currentSubStatus === 'closed';
    });

    const totalValue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const avgOrderValue = orders.length > 0 ? totalValue / orders.length : 0;

    return {
      thisMonthCount: thisMonthOrders.length,
      pendingCount: pendingOrders.length,
      deliveredCount: deliveredOrders.length,
      totalValue,
      avgOrderValue
    };
  }, [orders]);

  const fetchCustomerAndOrders = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      console.log('Already fetching, skipping...');
      return;
    }

    isFetchingRef.current = true;
    
    try {
      setError(null);
      
      // Check auth state
      if (!auth.currentUser) {
        setError('Please log in to view orders');
        setLoading(false);
        return;
      }

      // Get customer data from customers collection using Firebase UID
      const customerQuery = query(
        collection(db, 'customers'),
        where('firebase_uid', '==', auth.currentUser.uid)
      );
      const customerSnapshot = await getDocs(customerQuery);
      
      if (customerSnapshot.empty) {
        setError('Customer profile not found. Please contact support.');
        setLoading(false);
        return;
      }

      const customerDoc = customerSnapshot.docs[0];
      const customerId = customerDoc.id;
      const customerInfo = customerDoc.data();
      
      setCustomerData({
        customer_id: customerId,
        customer_name: customerInfo.customer_name,
        company_name: customerInfo.company_name,
        email: customerInfo.email || customerInfo.auth_email
      });
      
      // Save customer ID to session storage for other components
      sessionStorage.setItem('customerId', customerId);
      
      // Fetch orders from customers_orders subcollection
      await fetchOrders(customerId);
      
      hasFetchedRef.current = true;
      
    } catch (error) {
      console.error('Error fetching customer data:', error);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, []);

  const fetchOrders = async (customerId: string, loadMore = false) => {
    try {
      const ordersRef = collection(db, 'customers', customerId, 'customers_orders');
      let ordersQuery = query(ordersRef, orderBy('date', 'desc'), limit(PAGE_SIZE));
      
      if (loadMore && lastDoc) {
        ordersQuery = query(ordersRef, orderBy('date', 'desc'), startAfter(lastDoc), limit(PAGE_SIZE));
      }
      
      const snapshot = await getDocs(ordersQuery);
      
      const ordersList = snapshot.docs.map(doc => {
        const data = doc.data() as Order;
        
        // Calculate items count from line_items or use line_items_count
        let itemsCount = 0;
        if (data.line_items && Array.isArray(data.line_items)) {
          itemsCount = data.line_items.length;
        } else if (data.line_items_count !== undefined && data.line_items_count !== null) {
          itemsCount = data.line_items_count;
        }
        
        // Log for debugging
        if (data.salesorder_number === 'SO-00299') {
          console.log('SO-00299 data:', {
            line_items: data.line_items,
            line_items_count: data.line_items_count,
            calculated_itemsCount: itemsCount
          });
        }
        
        return {
          id: doc.id,
          ...data,
          line_items_count: itemsCount
        };
      });
      
      if (loadMore) {
        setOrders(prev => [...prev, ...ordersList]);
      } else {
        setOrders(ordersList);
      }
      
      // Update pagination state
      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  };

  // Set up auth state listener and initial fetch
  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!mounted) return;
      
      if (user && !hasFetchedRef.current) {
        fetchCustomerAndOrders();
      } else if (!user) {
        setError('Please log in to view orders');
        setLoading(false);
        hasFetchedRef.current = false;
      }
    });

    // Cleanup function
    return () => {
      mounted = false;
      unsubscribeAuth();
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [fetchCustomerAndOrders]);

  const handleRefresh = async () => {
    if (isFetchingRef.current) return;
    
    setRefreshing(true);
    setCurrentPage(1);
    setLastDoc(null);
    hasFetchedRef.current = false;
    await fetchCustomerAndOrders();
  };

  const handleLoadMore = async () => {
    if (!customerData || !hasMore || loading || isFetchingRef.current) return;
    
    setLoading(true);
    try {
      await fetchOrders(customerData.customer_id, true);
      setCurrentPage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading more orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderExpansion = (orderId: string) => {
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

  const getStatusColor = (status: string, currentSubStatus?: string, shipmentStatus?: string, shippedStatus?: string) => {
    const statusLower = status?.toLowerCase() || '';
    const subStatusLower = currentSubStatus?.toLowerCase() || '';
    const shipmentStatusLower = shipmentStatus?.toLowerCase() || '';
    const shippedStatusLower = shippedStatus?.toLowerCase() || '';
    
    // Map closed/fulfilled to delivered
    if (statusLower === 'delivered' || statusLower === 'closed' || statusLower === 'fulfilled' || 
        subStatusLower === 'closed' || shipmentStatusLower === 'delivered') {
      return 'statusDelivered';
    }
    
    // Check for partially shipped
    if (shippedStatusLower === 'partially_shipped' || statusLower === 'partially_shipped') {
      return 'statusPartiallyShipped';
    }
    
    const statusMap: Record<string, string> = {
      'draft': 'statusDraft',
      'pending': 'statusDraft',
      'confirmed': 'statusConfirmed',
      'packed': 'statusPacked',
      'shipped': 'statusShipped',
      'cancelled': 'statusCancelled'
    };
    
    return statusMap[statusLower] || 'statusDraft';
  };

  const getDisplayStatus = (order: Order): string => {
    const status = order.status?.toLowerCase() || '';
    const currentSubStatus = order.current_sub_status?.toLowerCase() || '';
    const shipmentStatus = order.shipment_status?.toLowerCase() || '';
    const shippedStatus = order.shipped_status?.toLowerCase() || '';
    
    // Map closed/fulfilled to delivered
    if (status === 'closed' || status === 'fulfilled' || currentSubStatus === 'closed' || shipmentStatus === 'delivered') {
      return 'Delivered';
    }
    
    // Check for partially shipped
    if (shippedStatus === 'partially_shipped' || status === 'partially_shipped') {
      return 'Partially Shipped';
    }
    
    // Capitalize first letter
    return status.charAt(0).toUpperCase() + status.slice(1) || 'Pending';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return `£${amount?.toFixed(2) || '0.00'}`;
  };

  const getCustomerInitials = (name?: string): string => {
    if (!name) return '??';
    const words = name.split(' ');
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Filter orders based on search and status
  const filteredOrders = React.useMemo(() => {
    let filtered = orders;
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(order => 
        order.salesorder_number.toLowerCase().includes(searchLower) ||
        order.customer_name?.toLowerCase().includes(searchLower) ||
        order.line_items?.some(item => item.name.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => {
        const status = order.status?.toLowerCase() || '';
        const currentSubStatus = order.current_sub_status?.toLowerCase() || '';
        const shipmentStatus = order.shipment_status?.toLowerCase() || '';
        
        if (statusFilter === 'pending') {
          return status !== 'delivered' && status !== 'closed' && status !== 'fulfilled' && 
                 shipmentStatus !== 'delivered' && currentSubStatus !== 'closed';
        }
        if (statusFilter === 'delivered') {
          return status === 'delivered' || status === 'closed' || status === 'fulfilled' || 
                 shipmentStatus === 'delivered' || currentSubStatus === 'closed';
        }
        return status === statusFilter;
      });
    }
    
    return filtered;
  }, [orders, search, statusFilter]);

  if (loading && orders.length === 0 && !error) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>⚠️</div>
        <h3>Unable to Load Orders</h3>
        <p>{error}</p>
        <button onClick={handleRefresh} className={styles.newOrderButton}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.ordersContainer}>
      <div className={styles.ordersHeader}>
        <div>
          <h1>My Orders</h1>
          {customerData && (
            <p style={{ margin: '8px 0 0 0', color: '#5c4a4f' }}>
              {customerData.company_name || customerData.customer_name}
            </p>
          )}
        </div>
        <div className={styles.headerActions}>
          <button 
            className={styles.refreshButton} 
            onClick={handleRefresh}
            disabled={refreshing || isFetchingRef.current}
            title="Refresh orders"
          >
            <FaRedo className={refreshing ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className={styles.metricsGrid}>
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">📦</span>
            <span className="metric-title">This Month</span>
          </div>
          <div className="metric-value">{orderMetrics.thisMonthCount}</div>
          <div className="metric-subtitle">Orders placed</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">💰</span>
            <span className="metric-title">Total Value</span>
          </div>
          <div className="metric-value">{formatCurrency(orderMetrics.totalValue)}</div>
          <div className="metric-subtitle">All orders</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">📊</span>
            <span className="metric-title">Average Order</span>
          </div>
          <div className="metric-value">{formatCurrency(orderMetrics.avgOrderValue)}</div>
          <div className="metric-subtitle">Per transaction</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">⏳</span>
            <span className="metric-title">Pending</span>
          </div>
          <div className="metric-value">{orderMetrics.pendingCount}</div>
          <div className="metric-subtitle">Awaiting delivery</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={styles.ordersControls}>
        <div className={styles.searchContainer}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
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
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📦</div>
          <h3>No orders found</h3>
          <p>
            {search || statusFilter !== 'all' 
              ? "Try adjusting your search or filters"
              : "You haven't placed any orders yet"}
          </p>
          <button onClick={() => navigate('/customer/new-order')} className={styles.newOrderButton}>
            <FaShoppingCart /> Start New Order
          </button>
        </div>
      ) : (
        <div className={styles.ordersWrapper}>
          <div className={styles.ordersTableContainer}>
            <div className={styles.ordersTable}>
              <div className={styles.tableHeader}>
                <div className={styles.tableRow}>
                  <div className={styles.tableCell}>Order #</div>
                  <div className={styles.tableCell}>Items</div>
                  <div className={styles.tableCell}>Date</div>
                  <div className={styles.tableCell}>Total</div>
                  <div className={styles.tableCell}></div>
                </div>
              </div>
              
              <div className={styles.tableBody}>
                {filteredOrders.map((order) => {
                  const isExpanded = expandedOrderIds.has(order.id);
                  const isDelivered = order.status?.toLowerCase() === 'delivered' || 
                                    order.status?.toLowerCase() === 'closed' || 
                                    order.status?.toLowerCase() === 'fulfilled' ||
                                    order.current_sub_status?.toLowerCase() === 'closed' ||
                                    order.shipment_status?.toLowerCase() === 'delivered';
                  
                  // Get items count
                  const itemsCount = order.line_items_count || 0;
                  
                  return (
                    <React.Fragment key={order.id}>
                      <div 
                        className={`${styles.tableRow} ${isExpanded ? styles.expanded : ''}`}
                        onClick={() => toggleOrderExpansion(order.id)}
                      >
                        {/* Order Number */}
                        <div className={styles.tableCell} data-label="Order #">
                          <strong className={styles.orderNumber}>
                            {order.salesorder_number}
                          </strong>
                        </div>
                        
                        {/* Items Summary */}
                        <div className={styles.tableCell} data-label="Items">
                          <div className={styles.customerInfo}>
                            <div className={styles.customerAvatar}>
                              {itemsCount}
                            </div>
                            <div className={styles.customerDetails}>
                              <strong>{itemsCount} {itemsCount === 1 ? 'item' : 'items'}</strong>
                            </div>
                          </div>
                        </div>
                        
                        {/* Date */}
                        <div className={styles.tableCell} data-label="Date">
                          <div className={styles.dateCell}>
                            <span className={styles.dateMain}>
                              {formatDate(order.date)}
                            </span>
                            <span className={styles.dateTime}>
                              {formatTime(order.date)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Total */}
                        <div className={styles.tableCell} data-label="Total">
                          <strong className={styles.totalAmount}>
                            {formatCurrency(order.total || 0)}
                          </strong>
                        </div>
                        
                        {/* Expand Button */}
                        <div className={styles.tableCell} data-label="">
                          <div className={styles.endRowSection}>
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
                              {isDelivered ? (
                                <div className={`${styles.statusIcon} ${styles.deliveredIcon}`}>
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
                                <span className={styles.detailLabel}>Status</span>
                                <span className={styles.detailValue}>
                                  {getDisplayStatus(order)}
                                </span>
                              </div>
                              <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Delivery Date</span>
                                <span className={styles.detailValue}>
                                  {order.delivery_date ? formatDate(order.delivery_date) : 'Not scheduled'}
                                </span>
                              </div>
                              <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Tracking</span>
                                <span className={styles.detailValue}>
                                  {order.tracking_number || 
                                   (order.packages && order.packages.length > 0 && order.packages[0].tracking_number) || 
                                   'Not available'}
                                </span>
                              </div>
                            </div>
                            
                            {/* Status Badge */}
                            <div className={styles.statusBadges}>
                              <button 
                                className={`${styles.statusBadgeButton} ${styles[getStatusColor(order.status, order.current_sub_status, order.shipment_status, order.shipped_status)]}`}
                                disabled
                              >
                                {getDisplayStatus(order)}
                              </button>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className={styles.expandedActions}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/customer/view-order/${order.id}`);
                                }}
                                className={`${styles.expandedActionBtn} ${styles.viewOrderBtn}`}
                              >
                                <FaEye /> <span>View Details</span>
                              </button>
                              
                              {isDelivered && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Handle reorder
                                  }}
                                  className={`${styles.expandedActionBtn} ${styles.reorderBtn}`}
                                >
                                  <FaRedo /> <span>Reorder</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Pagination */}
          {hasMore && (
            <div className={styles.paginationContainer}>
              <div className={styles.paginationInfo}>
                Showing {filteredOrders.length} orders
              </div>
              
              <div className={styles.paginationControls}>
                <button
                  className={styles.paginationButton}
                  onClick={handleLoadMore}
                  disabled={loading || isFetchingRef.current}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
