// src/components/CustomerDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { 
  FaArrowLeft, FaMapMarkerAlt, FaClipboardList, FaEnvelope, 
  FaPhone, FaExclamationTriangle, FaCheckCircle, FaRobot,
  FaCreditCard, FaChartLine, FaUserTie, FaBuilding
} from 'react-icons/fa';
import Lottie from 'lottie-react';
import loaderAnimation from '../loader.json';
import { useDeviceDetection, useDeviceConditional } from '../hooks/useDeviceDetection';
import styles from './CustomerDetail.module.css';

interface CustomerData {
  firebase_uid: string;
  original_firebase_data?: any;
  zoho_data: {
    customer_name: string;
    company_name: string;
    email: string;
    phone: string;
    credit_limit: number;
    outstanding_receivable_amount: number;
    overdue_amount: number;
    payment_performance: number;
    payment_terms: number;
    payment_terms_label: string;
    total_invoiced?: number;
    invoice_count?: number;
    addresses: any[];
    billing_address: any;
    shipping_address: any;
    contact_persons: any[];
    cf_phone_number?: string;
    location_region?: string;
    customer_sub_type: string;
    status: string;
    created_time: string;
    last_modified_time: string;
    notes?: string;
  };
  last_synced: any;
  sync_status: string;
}

interface RecentOrder {
  id: string;
  order_number: string;
  date: string;
  total: number;
  status: string;
}

export default function CustomerDetail() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'contacts' | 'orders'>('overview');
  
  // Device detection hooks
  const deviceInfo = useDeviceDetection();
  const { showOnIPad, showOnDesktop, showInPortrait, showInLandscape } = useDeviceConditional();

  useEffect(() => {
    if (customerId) {
      fetchCustomerData();
      fetchRecentOrders();
    }
  }, [customerId]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const customerDoc = await getDoc(doc(db, 'customer_data', customerId));
      
      if (customerDoc.exists()) {
        setCustomerData(customerDoc.data() as CustomerData);
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const ordersQuery = query(
        collection(db, 'salesorders'),
        where('customer_id', '==', customerId),
        orderBy('date', 'desc'),
        limit(10)
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        order_number: doc.data().salesorder_number || doc.id,
        date: doc.data().date,
        total: doc.data().total || 0,
        status: doc.data().status || 'pending'
      }));
      
      setRecentOrders(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const generateAIInsights = async () => {
    setLoadingInsights(true);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE || 'https://splitfin-zoho-api.onrender.com';
      
      const response = await fetch(`${apiUrl}/api/ai-insights/customer-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': auth.currentUser?.uid || ''
        },
        body: JSON.stringify({
          customerData: customerData,
          recentOrders: recentOrders
        })
      });

      if (response.ok) {
        const insights = await response.json();
        setAiInsights(insights);
      }
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  };

  // Helper function to safely format currency
  const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return '£0';
    }
    return `£${value.toLocaleString()}`;
  };

  // Helper function to safely get number value
  const getNumberValue = (value: number | undefined | null): number => {
    return value || 0;
  };

  if (loading) {
    return (
      <div className={styles.customerDetailLoading}>
        <Lottie animationData={loaderAnimation} style={{ width: 100, height: 100 }} />
        <p>Loading customer details...</p>
      </div>
    );
  }

  if (!customerData) {
    return (
      <div className={styles.customerDetailError}>
        <h2>Customer not found</h2>
        <button onClick={() => navigate('/customers')} className={`${styles.btn} ${styles.btnPrimary}`}>
          Back to Customers
        </button>
      </div>
    );
  }

  const zoho = customerData.zoho_data;
  const creditLimit = getNumberValue(zoho.credit_limit);
  const outstandingAmount = getNumberValue(zoho.outstanding_receivable_amount);
  const overdueAmount = getNumberValue(zoho.overdue_amount);
  const paymentPerformance = getNumberValue(zoho.payment_performance);
  
  const creditUsage = creditLimit > 0 ? (outstandingAmount / creditLimit) * 100 : 0;
  
  const getHealthColor = (performance: number) => {
    if (performance >= 90) return 'green';
    if (performance >= 70) return 'yellow';
    return 'red';
  };

  const getCreditStatusColor = (usage: number) => {
    if (usage >= 90) return 'red';
    if (usage >= 70) return 'yellow';
    return 'green';
  };

  return (
    <div className={`${styles.customerDetailContainer} ${deviceInfo.deviceClass}`}>
      {/* Header */}
      <div className={styles.detailHeader}>
        <button className={styles.backButton} onClick={() => navigate('/customers')}>
          <FaArrowLeft /> Back to Customers
        </button>
        
        <div className={styles.headerInfo}>
          <h1>{zoho.company_name || zoho.customer_name}</h1>
          <div className={styles.headerBadges}>
            <span className={`${styles.customerStatusBadge} ${styles[zoho.status]}`}>
              {zoho.status}
            </span>
            <span className={styles.customerTypeBadge}>
              {zoho.customer_sub_type}
            </span>
          </div>
        </div>

        <div className={styles.headerActions}>
          {showOnIPad(
            <button 
              className={`${styles.btn} ${styles.btnSecondary} ${styles.ipadOptimized}`}
              onClick={() => navigate('/customer-map', { 
                state: { 
                  highlightCustomerId: customerId,
                  customerCoordinates: customerData.original_firebase_data?.coordinates 
                } 
              })}
            >
              <FaMapMarkerAlt /> Map
            </button>
          )}
          
          {showOnDesktop(
            <button 
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={() => navigate('/customer-map', { 
                state: { 
                  highlightCustomerId: customerId,
                  customerCoordinates: customerData.original_firebase_data?.coordinates 
                } 
              })}
            >
              <FaMapMarkerAlt /> View on Map
            </button>
          )}
          
          <button 
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => navigate(`/select-brand/${customerId}`, {
              state: { 
                selectedCustomer: {
                  id: customerId,
                  name: zoho.company_name || zoho.customer_name,
                  email: zoho.email
                }
              }
            })}
          >
            {deviceInfo.isIPad ? 'New Order' : 'Create Order'}
          </button>
        </div>
      </div>

      {/* Financial Health Summary */}
      <div className={`${styles.financialHealthSummary} ${deviceInfo.isIPad ? styles.ipadGrid : ''}`}>
        <div className={styles.healthCard}>
          <div className={styles.healthMetric}>
            <h3>Payment Performance</h3>
            <div className={`${styles.performanceScore} ${styles[getHealthColor(paymentPerformance)]}`}>
              {paymentPerformance}%
            </div>
            <p className={styles.metricLabel}>Historical payment reliability</p>
          </div>
        </div>

        <div className={styles.healthCard}>
          <div className={styles.healthMetric}>
            <h3>Credit Usage</h3>
            <div className={styles.creditUsageBar}>
              <div 
                className={`${styles.usageFill} ${styles[getCreditStatusColor(creditUsage)]}`}
                style={{ width: `${Math.min(creditUsage, 100)}%` }}
              />
            </div>
            <p className={styles.metricValue}>
              {formatCurrency(outstandingAmount)} / {formatCurrency(creditLimit)}
            </p>
            <p className={styles.metricLabel}>{creditUsage.toFixed(0)}% of credit limit</p>
          </div>
        </div>

        <div className={styles.healthCard}>
          <div className={styles.healthMetric}>
            <h3>Outstanding Amount</h3>
            <div className={styles.outstandingAmount}>
              {formatCurrency(outstandingAmount)}
            </div>
            {overdueAmount > 0 && (
              <p className={styles.overdueWarning}>
                <FaExclamationTriangle /> {formatCurrency(overdueAmount)} overdue
              </p>
            )}
          </div>
        </div>

        <div className={styles.healthCard}>
          <div className={styles.healthMetric}>
            <h3>Payment Terms</h3>
            <div className={styles.paymentTerms}>
              {zoho.payment_terms_label || 'N/A'}
            </div>
            <p className={styles.metricLabel}>{zoho.payment_terms || 0} days</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`${styles.customerDetailTabs} ${deviceInfo.isIPad ? styles.ipadTabs : ''}`}>
        {showOnIPad(
          <div className={styles.ipadTabScroll}>
            <button 
              className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'financial' ? styles.active : ''}`}
              onClick={() => setActiveTab('financial')}
            >
              Financial
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'contacts' ? styles.active : ''}`}
              onClick={() => setActiveTab('contacts')}
            >
              Contacts
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'orders' ? styles.active : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              Orders
            </button>
          </div>
        )}
        
        {showOnDesktop(
          <>
            <button 
              className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'financial' ? styles.active : ''}`}
              onClick={() => setActiveTab('financial')}
            >
              Financial Details
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'contacts' ? styles.active : ''}`}
              onClick={() => setActiveTab('contacts')}
            >
              Contacts
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'orders' ? styles.active : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              Recent Orders
            </button>
          </>
        )}
      </div>

      {/* Tab Content */}
      <div className={styles.customerTabContent}>
        {activeTab === 'overview' && (
          <div className={styles.overviewTab}>
            <div className={styles.infoGrid}>
              <div className={`${styles.customerInfoSection} ${styles.infoSection}`}>
                <h3><FaBuilding /> Company Information</h3>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Company Name</span>
                  <span className={styles.value}>{zoho.company_name || 'N/A'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Email</span>
                  <span className={styles.value}>{zoho.email || 'N/A'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Phone</span>
                  <span className={styles.value}>{zoho.phone || zoho.cf_phone_number || 'N/A'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Region</span>
                  <span className={styles.value}>{customerData.original_firebase_data?.location_region || 'N/A'}</span>
                </div>
              </div>

              <div className={`${styles.customerInfoSection} ${styles.infoSection}`}>
                <h3>Business Metrics</h3>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Total Invoiced</span>
                  <span className={styles.value}>{formatCurrency(zoho.total_invoiced)}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Invoice Count</span>
                  <span className={styles.value}>{zoho.invoice_count || 0}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Customer Since</span>
                  <span className={styles.value}>
                    {zoho.created_time ? new Date(zoho.created_time).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Addresses */}
            {zoho.billing_address && zoho.shipping_address && (
              <div className={styles.addressesSection}>
                <h3>Addresses</h3>
                <div className={styles.addressGrid}>
                  <div className={styles.addressCard}>
                    <h4>Billing Address</h4>
                    <p>{zoho.billing_address.address || 'N/A'}</p>
                    <p>{zoho.billing_address.city}, {zoho.billing_address.state}</p>
                    <p>{zoho.billing_address.zip}</p>
                    <p>{zoho.billing_address.country}</p>
                  </div>
                  <div className={styles.addressCard}>
                    <h4>Shipping Address</h4>
                    <p>{zoho.shipping_address.address || 'N/A'}</p>
                    <p>{zoho.shipping_address.city}, {zoho.shipping_address.state}</p>
                    <p>{zoho.shipping_address.zip}</p>
                    <p>{zoho.shipping_address.country}</p>
                  </div>
                </div>
              </div>
            )}

            {/* AI Insights */}
            <div className={styles.aiInsightsSection}>
              <div className={styles.sectionHeader}>
                <h3><FaRobot /> AI Insights</h3>
                <button 
                  className={`${styles.btn} ${styles.btnSmall}`}
                  onClick={generateAIInsights}
                  disabled={loadingInsights}
                >
                  {loadingInsights ? 'Generating...' : 'Generate Insights'}
                </button>
              </div>
              
              {aiInsights && (
                <div className={styles.insightsContent}>
                  {/* Display AI insights here */}
                </div>
              )}
            </div>

            {/* iPad-specific quick actions */}
            {deviceInfo.isIPad && (
              <div className={styles.ipadQuickActions}>
                <h3>Quick Actions</h3>
                <div className={styles.quickActionsGrid}>
                  <button 
                    className={styles.quickActionBtn}
                    onClick={() => window.location.href = `tel:${zoho.phone || zoho.cf_phone_number}`}
                  >
                    <FaPhone />
                    <span>Call Customer</span>
                  </button>
                  <button 
                    className={styles.quickActionBtn}
                    onClick={() => window.location.href = `mailto:${zoho.email}`}
                  >
                    <FaEnvelope />
                    <span>Send Email</span>
                  </button>
                  <button 
                    className={styles.quickActionBtn}
                    onClick={() => navigate(`/select-brand/${customerId}`, {
                      state: { 
                        selectedCustomer: {
                          id: customerId,
                          name: zoho.company_name || zoho.customer_name,
                          email: zoho.email
                        }
                      }
                    })}
                  >
                    <FaClipboardList />
                    <span>New Order</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'financial' && (
          <div className={styles.financialTab}>
            <div className={styles.financialGrid}>
              <div className={styles.financialCard}>
                <h3>Credit Information</h3>
                <div className={styles.financialItem}>
                  <span className={styles.label}>Credit Limit</span>
                  <span className={styles.value}>{formatCurrency(creditLimit)}</span>
                </div>
                <div className={styles.financialItem}>
                  <span className={styles.label}>Available Credit</span>
                  <span className={styles.value}>
                    {formatCurrency(Math.max(0, creditLimit - outstandingAmount))}
                  </span>
                </div>
                <div className={styles.financialItem}>
                  <span className={styles.label}>Credit Status</span>
                  <span className={`${styles.status} ${styles[getCreditStatusColor(creditUsage)]}`}>
                    {creditUsage >= 90 ? 'Critical' : creditUsage >= 70 ? 'Warning' : 'Good'}
                  </span>
                </div>
              </div>

              <div className={styles.financialCard}>
                <h3>Outstanding Amounts</h3>
                <div className={styles.financialItem}>
                  <span className={styles.label}>Total Outstanding</span>
                  <span className={styles.value}>{formatCurrency(outstandingAmount)}</span>
                </div>
                <div className={styles.financialItem}>
                  <span className={styles.label}>Overdue Amount</span>
                  <span className={`${styles.value} ${overdueAmount > 0 ? styles.overdue : ''}`}>
                    {formatCurrency(overdueAmount)}
                  </span>
                </div>
              </div>
            </div>

            {overdueAmount > 0 && (
              <div className={styles.overdueAlert}>
                <FaExclamationTriangle />
                <div>
                  <h4>Payment Overdue</h4>
                  <p>This customer has {formatCurrency(overdueAmount)} in overdue payments.</p>
                  <button className={`${styles.btn} ${styles.btnWarning}`}>Send Payment Reminder</button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className={styles.contactsTab}>
            <div className={styles.contactsGrid}>
              {zoho.contact_persons && zoho.contact_persons.length > 0 ? (
                zoho.contact_persons.map((contact: any, index: number) => (
                  <div key={index} className={styles.contactCard}>
                    <div className={styles.contactHeader}>
                      <h4>{contact.first_name} {contact.last_name}</h4>
                      {contact.is_primary_contact && (
                        <span className={styles.primaryBadge}>Primary</span>
                      )}
                    </div>
                    <div className={styles.contactInfo}>
                      {contact.email && (
                        <p><FaEnvelope /> {contact.email}</p>
                      )}
                      {contact.phone && (
                        <p><FaPhone /> {contact.phone}</p>
                      )}
                      {contact.department && (
                        <p><FaUserTie /> {contact.department}</p>
                      )}
                    </div>
                    <div className={styles.contactActions}>
                      <button 
                        className={`${styles.btn} ${styles.btnSmall}`}
                        onClick={() => window.location.href = `mailto:${contact.email}`}
                      >
                        <FaEnvelope /> Email
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p>No contacts available</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className={styles.ordersTab}>
            <div className={styles.ordersList}>
              {recentOrders.length > 0 ? (
                recentOrders.map(order => (
                  <div key={order.id} className={styles.orderItem}>
                    <div className={styles.orderInfo}>
                      <h4>Order #{order.order_number}</h4>
                      <p>{new Date(order.date).toLocaleDateString()}</p>
                    </div>
                    <div className={styles.orderStatus}>
                      <span className={`${styles.status} ${styles[order.status]}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className={styles.orderAmount}>
                      {formatCurrency(order.total)}
                    </div>
                    <div className={styles.orderActions}>
                      <button 
                        className={`${styles.btn} ${styles.btnSmall}`}
                        onClick={() => navigate(`/orders`)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p>No recent orders</p>
              )}
            </div>
            
<button 
  className={`${styles.btn} ${styles.btnSecondary} ${styles.fullWidth}`}
  onClick={() => navigate('/orders', { 
    state: { 
      customerId: customerId,
      customerName: zoho.company_name || zoho.customer_name
    } 
  })}
>
  <FaClipboardList /> View All Orders
</button>
          </div>
        )}
      </div>
    </div>
  );
}