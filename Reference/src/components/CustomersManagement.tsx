import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ShoppingCart, User, Eye } from 'lucide-react';
import { HugeiconsIcon } from '@hugeicons/react';
import { auth, db } from '../firebase';
import { collection, getDocs, query, where, orderBy, getDoc, doc } from 'firebase/firestore';
import { MetricCard } from './shared'; // Correct import for MetricCard
import MetricIcon from './shared/MetricIcon';
import CustomerOrdersModal from './CustomerOrdersModal';
import { ProgressLoader } from './ProgressLoader';
import styles from './CustomersManagement.module.css';
import '../styles/animations.css';

interface Customer {
  id: string;
  customer_id: string;
  customer_name: string;
  company_name: string;
  email: string;
  phone: string;
  city?: string;
  postcode?: string;
  location_region?: string;
  status: string;
  created_time: string;
  created_date?: string;
  last_modified_time: string;
  outstanding_receivable_amount: number;
  total_spent: number;
  order_count: number;
  average_order_value: number;
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

type SortBy = 'name' | 'date' | 'value' | 'orders';

export default function CustomersManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [customerMetrics, setCustomerMetrics] = useState<CustomerMetrics>({
    totalCustomers: 0,
    newCustomers: 0,
    activeCustomers: 0
  });

  const customersPerPage = 25;
  const navigate = useNavigate();
  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    fetchCustomers();
  }, [currentUserId]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      // Get user details to determine role and access pattern
      const userDoc = await getDoc(doc(db, 'users', currentUserId || ''));
      const userData = userDoc.data();
      const userRole = userData?.role;
      const userZohoId = userData?.zohospID || userData?.zohoAgentID;

      let customersData: Customer[] = [];

      if (userRole === 'salesAgent' && userZohoId) {
        // For sales agents, get customers from their assigned_customers subcollection
        const assignedCustomersSnapshot = await getDocs(
          collection(db, 'sales_agents', userZohoId, 'assigned_customers')
        );
        
        // Get customer IDs and any stored data from subcollection
        const assignedCustomersMap = new Map();
        assignedCustomersSnapshot.docs.forEach(doc => {
          const data = doc.data();
          assignedCustomersMap.set(data.customer_id, data);
        });
        
        const assignedCustomerIds = Array.from(assignedCustomersMap.keys());
        
        if (assignedCustomerIds.length > 0) {
          // Fetch customer details from customers collection in batches
          const chunkSize = 10; // Firestore 'in' query limit
          const customerPromises = [];
          
          for (let i = 0; i < assignedCustomerIds.length; i += chunkSize) {
            const chunk = assignedCustomerIds.slice(i, i + chunkSize);
            const customersQuery = query(
              collection(db, 'customers'),
              where('customer_id', 'in', chunk)
            );
            customerPromises.push(getDocs(customersQuery));
          }
          
          const customerSnapshots = await Promise.all(customerPromises);
          
          for (const snapshot of customerSnapshots) {
            snapshot.docs.forEach(doc => {
              const customerData = doc.data();
              const assignedData = assignedCustomersMap.get(customerData.customer_id);
              
              // Merge data from subcollection if available
              customersData.push({
                id: doc.id,
                ...customerData,
                last_order_date: assignedData?.last_order_date || customerData.last_order_date,
                created_date: assignedData?.created_date || customerData.created_date || customerData.created_time
              } as Customer);
            });
          }
          
          // Also get order statistics for these customers from agent's customers_orders
          const agentOrdersSnapshot = await getDocs(
            collection(db, 'sales_agents', userZohoId, 'customers_orders')
          );
          
          const ordersByCustomer = new Map<string, any[]>();
          agentOrdersSnapshot.docs.forEach(doc => {
            const orderData = doc.data();
            const customerId = orderData.customer_id;
            if (!ordersByCustomer.has(customerId)) {
              ordersByCustomer.set(customerId, []);
            }
            ordersByCustomer.get(customerId)!.push(orderData);
          });
          
          // Enhance customers with order statistics
          customersData = customersData.map(customer => {
            const customerOrders = ordersByCustomer.get(customer.customer_id) || [];
            const totalSpent = customerOrders.reduce((sum, order) => sum + (order.total || 0), 0);
            const orderCount = customerOrders.length;
            const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;
            
            const sortedOrders = customerOrders.sort((a, b) => 
              new Date(b.date || b.created_time).getTime() - new Date(a.date || a.created_time).getTime()
            );
            
            return {
              ...customer,
              total_spent: totalSpent,
              order_count: orderCount,
              average_order_value: avgOrderValue,
              last_order_date: customer.last_order_date || sortedOrders[0]?.date || sortedOrders[0]?.created_time,
              first_order_date: sortedOrders[sortedOrders.length - 1]?.date || sortedOrders[sortedOrders.length - 1]?.created_time
            };
          });
        }
      } else {
        // For managers/admins, get all customers from customers collection
        const customersQuery = query(
          collection(db, 'customers'),
          orderBy('customer_name', 'asc')
        );
        
        const customersSnapshot = await getDocs(customersQuery);
        customersData = customersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Customer));
      }
      
      setCustomers(customersData);
      calculateMetrics(customersData);
      
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (customersData: Customer[]) => {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
    
    const totalCustomers = customersData.length;
    
    const newCustomers = customersData.filter(customer => {
      const createdDate = new Date(customer.created_date || customer.created_time || customer.first_order_date || '');
      return createdDate >= threeMonthsAgo;
    }).length;
    
    const activeCustomers = customersData.filter(customer => {
      const lastOrderDate = new Date(customer.last_order_date || customer.metrics?.last_order_date || '');
      return lastOrderDate >= threeMonthsAgo;
    }).length;

    setCustomerMetrics({
      totalCustomers,
      newCustomers,
      activeCustomers
    });
  };

  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = customers.filter(customer =>
      customer.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      customer.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      customer.email?.toLowerCase().includes(search.toLowerCase())
    );

    // Sort customers based on selected criteria
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.customer_name || '').localeCompare(b.customer_name || '');
        case 'date':
          const aDate = new Date(a.last_order_date || a.created_time || 0);
          const bDate = new Date(b.last_order_date || b.created_time || 0);
          return bDate.getTime() - aDate.getTime();
        case 'value':
          const aValue = a.total_spent || a.metrics?.total_spent || 0;
          const bValue = b.total_spent || b.metrics?.total_spent || 0;
          return bValue - aValue;
        case 'orders':
          const aOrders = a.order_count || a.metrics?.order_count || 0;
          const bOrders = b.order_count || b.metrics?.order_count || 0;
          return bOrders - aOrders;
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [customers, search, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedCustomers.length / customersPerPage);
  const currentCustomers = filteredAndSortedCustomers.slice(
    (currentPage - 1) * customersPerPage,
    currentPage * customersPerPage
  );

  const handleNewOrder = (customer: Customer) => {
    // Navigate to select brand with customer id
    navigate(`/select-brand/${customer.id}`, {
      state: { 
        selectedCustomer: {
          id: customer.customer_id,
          name: customer.customer_name || customer.company_name,
          email: customer.email
        }
      }
    });
  };

  const handleViewCustomer = (customer: Customer) => {
    navigate(`/customer/${customer.id}`);
  };

const handleViewOrders = (customer: Customer) => {
  // Navigate to ViewOrders with customer filter
  navigate('/orders', {
    state: {
      customerId: customer.customer_id,
      customerName: customer.customer_name || customer.company_name
    }
  });
};

  const handleCreateCustomer = () => {
    navigate('/create-customer');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleDateString('en-GB');
    } catch {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading-container">
        <ProgressLoader
          progress={33}
          messages={[
            'Loading customers...',
            'Fetching customer data...',
            'Calculating metrics...'
          ]}
        />
      </div>
    );
  }

  return (
    <div className={styles.customersContainer}>
      <div className={styles.pageHeader}>
        <h1>Customer Management</h1>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleCreateCustomer}>
          <Plus size={20} /> New Customer
        </button>
      </div>

  {/* Metric Cards - Compact Design with Enhanced Colors */}
<div className={styles.metricsGrid3}>
  <MetricCard
    id="total-customers"
    title="Total Customers"
    value={customerMetrics.totalCustomers}
    subtitle="All customers"
    icon={<MetricIcon name="users" size={24} />}
    color="#79d5e9"
    displayMode="compact" // Set to compact mode
  />
  
  <MetricCard
    id="new-customers"
    title="New Customers"
    value={customerMetrics.newCustomers}
    subtitle="Last 3 months"
    icon={<MetricIcon name="user-plus" size={24} />}
    color="#f77d11"
    displayMode="compact" // Set to compact mode
    trend={{
      value: customerMetrics.totalCustomers > 0 ? 
       Math.round(customerMetrics.newCustomers / customerMetrics.totalCustomers * 100) : 0,
      isPositive: customerMetrics.newCustomers > 0
    }}
  />
  
  <MetricCard
    id="active-customers"
    title="Active Customers"
    value={customerMetrics.activeCustomers}
    subtitle="With recent orders"
    icon={<MetricIcon name="user-check" size={24} />}
    color="#61bc8e"
    displayMode="compact" // Set to compact mode
    trend={{
      value: customerMetrics.totalCustomers > 0 ? 
        Math.round(customerMetrics.activeCustomers / customerMetrics.totalCustomers * 100) : 0,
      isPositive: customerMetrics.activeCustomers > 0
    }}
  />
</div>

      {/* Search and Filter Controls */}
      <div className={styles.customersControls}>
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search customers by name, company, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filterControls}>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className={styles.sortFilter}
          >
            <option value="name">Sort by Name</option>
            <option value="date">Sort by Last Order</option>
            <option value="value">Sort by Total Value</option>
            <option value="orders">Sort by Order Count</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className={styles.customersTable}>
        <div className={styles.tableContainer}>
          <div className={styles.tableHeader}>
            <div className={styles.tableHeaderRow}>
              <div>Customer</div>
              <div>Email</div>
              <div>Last Order</div>
              <div>Actions</div>
            </div>
          </div>
          
          <div className={styles.tableBody}>
            {currentCustomers.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>👥</div>
                <h3>No customers found</h3>
                <p>Try adjusting your search criteria or add a new customer.</p>
              </div>
            ) : (
              currentCustomers.map((customer) => (
                <div key={customer.id} className={styles.tableRow}>
                  <div className={styles.tableCell} data-label="Customer">
                    <div className={styles.customerLogoName}>
                      {customer.customer_logo ? (
                        <img 
                          src={customer.customer_logo} 
                          alt={customer.customer_name}
                          className={styles.customerLogo}
                        />
                      ) : (
                        <div className={styles.customerLogoPlaceholder}>
                          {customer.customer_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className={styles.customerName}>{customer.customer_name}</div>
                        {customer.company_name && customer.company_name !== customer.customer_name && (
                          <div className={styles.companyName}>{customer.company_name}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.tableCell} data-label="Email">
                    <div className={styles.customerEmail}>{customer.email}</div>
                  </div>
                  
                  <div className={styles.tableCell} data-label="Last Order">
                    <div className={styles.lastOrderDate}>
                      {formatDate(customer.last_order_date || customer.metrics?.last_order_date)}
                    </div>
                  </div>
                  
                  <div className={styles.tableCell} data-label="Actions">
                    <div className={styles.actionButtons}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNewOrder(customer);
                        }}
                        className={`${styles.actionBtn} ${styles.newOrderBtn}`}
                        title="New Order"
                      >
                        <ShoppingCart size={12} />
                        New Order
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewCustomer(customer);
                        }}
                        className={`${styles.actionBtn} ${styles.viewCustomerBtn}`}
                        title="View Customer"
                      >
                        <User size={12} />
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewOrders(customer);
                        }}
                        className={`${styles.actionBtn} ${styles.viewOrdersBtn}`}
                        title="View Orders"
                      >
                        <Eye size={12} />
                        Orders
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Showing {(currentPage - 1) * customersPerPage + 1} to {Math.min(currentPage * customersPerPage, filteredAndSortedCustomers.length)} of {filteredAndSortedCustomers.length} customers
          </div>
          <div className={styles.paginationControls}>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={styles.paginationBtn}
            >
              Previous
            </button>
            
            <span className={styles.pageInfo}>
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={styles.paginationBtn}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Customer Orders Modal */}
      {showOrdersModal && selectedCustomer && (
        <CustomerOrdersModal
          customer={selectedCustomer}
          onClose={() => {
            setShowOrdersModal(false);
            setSelectedCustomer(null);
          }}
        />
      )}
    </div>
  );
}
