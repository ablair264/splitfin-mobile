import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ProgressLoader } from './ProgressLoader';
import { Eye, X, Package, Truck, CreditCard, Clock } from 'lucide-react';
import styles from './CustomerOrdersModal.module.css';

interface Order {
  id: string;
  salesorder_number: string;
  order_number: string;
  salesorder_id?: string;
  customer_id: string;
  customer_name: string;
  date: string;
  total: number;
  status: string;
  items_count?: number;
  line_items_count?: number;
  payment_status?: string;
  shipping_status?: string;
  created_time?: string;
  expected_delivery_date?: string;
  balance?: number;
}

interface CustomerOrdersModalProps {
  customer: {
    id: string;
    customer_id: string;
    customer_name: string;
    company_name?: string;
  };
  onClose: () => void;
}

export default function CustomerOrdersModal({ customer, onClose }: CustomerOrdersModalProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomerOrders();
  }, [customer.customer_id]);

  const fetchCustomerOrders = async () => {
    try {
      setLoading(true);
      
      // Try to get orders from customer's subcollection first
      let ordersData: Order[] = [];
      
      // Check if we have the Firebase document ID
      if (customer.id) {
        try {
          // Get orders from customer's subcollection
          const ordersSubQuery = query(
            collection(db, 'customers', customer.id, 'customers_orders'),
            orderBy('date', 'desc')
          );
          const ordersSubSnapshot = await getDocs(ordersSubQuery);
          
          if (ordersSubSnapshot.size > 0) {
            ordersData = ordersSubSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as Order));
          }
        } catch (error) {
          console.log('No subcollection found, falling back to main collection');
        }
      }
      
      // If no orders in subcollection, try the main sales_orders collection
      if (ordersData.length === 0) {
        // Get user details to determine role
        const currentUserId = auth.currentUser?.uid;
        const userDoc = await getDoc(doc(db, 'users', currentUserId || ''));
        const userData = userDoc.data();
        const userRole = userData?.role;
        const userZohoId = userData?.zohospID || userData?.zohoAgentID;
        
        if (userRole === 'salesAgent' && userZohoId) {
          // For sales agents, get orders from their customers_orders subcollection
          const agentOrdersQuery = query(
            collection(db, 'sales_agents', userZohoId, 'customers_orders'),
            where('customer_id', '==', customer.customer_id),
            orderBy('date', 'desc')
          );
          
          const agentOrdersSnapshot = await getDocs(agentOrdersQuery);
          
          // Get order IDs from agent's subcollection
          const orderIds = agentOrdersSnapshot.docs.map(doc => doc.data().salesorder_id || doc.data().order_id);
          
          if (orderIds.length > 0) {
            // Fetch full order details from orders collection in batches
            const chunkSize = 10;
            const orderPromises = [];
            
            for (let i = 0; i < orderIds.length; i += chunkSize) {
              const chunk = orderIds.slice(i, i + chunkSize);
              const ordersQuery = query(
                collection(db, 'sales_orders'),
                where('salesorder_id', 'in', chunk)
              );
              orderPromises.push(getDocs(ordersQuery));
            }
            
            const orderSnapshots = await Promise.all(orderPromises);
            
            for (const snapshot of orderSnapshots) {
              ordersData.push(...snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              } as Order)));
            }
          }
        } else {
          // For managers/admins, get all orders for the customer
          const ordersQuery = query(
            collection(db, 'sales_orders'),
            where('customer_id', '==', customer.customer_id),
            orderBy('date', 'desc')
          );
          
          const ordersSnapshot = await getDocs(ordersQuery);
          ordersData = ordersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Order));
        }
      }
      
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order: Order) => {
    navigate(`/order-detail/${order.id}`);
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>
            Orders for <span className={styles.customerName}>{customer.customer_name || customer.company_name}</span>
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <ProgressLoader
                progress={50}
                messages={[
                  'Loading customer orders...',
                  'Fetching order details...',
                  'Calculating order statistics...'
                ]}
              />
            </div>
          ) : (
            <>
              <div className={styles.ordersSummary}>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Total Orders</span>
                  <span className={styles.summaryValue}>{orders.length}</span>
                </div>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Total Value</span>
                  <span className={styles.summaryValue}>
                    {formatCurrency(orders.reduce((sum, order) => sum + order.total, 0))}
                  </span>
                </div>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Avg Order Value</span>
                  <span className={styles.summaryValue}>
                    {formatCurrency(orders.length > 0 ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length : 0)}
                  </span>
                </div>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Last Order</span>
                  <span className={styles.summaryValue}>
                    {orders.length > 0 ? formatDate(orders[0].date) : 'N/A'}
                  </span>
                </div>
              </div>
              
              {orders.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📦</div>
                  <h3>No orders found</h3>
                  <p>This customer has not placed any orders yet.</p>
                </div>
              ) : (
                <div className={styles.ordersTableContainer}>
                  <table className={styles.ordersTable}>
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Date</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Payment</th>
                        <th>Shipping</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td>
                            <span className={styles.orderNumber}>
                              {order.order_number || order.salesorder_number}
                            </span>
                          </td>
                          <td>{formatDate(order.date)}</td>
                          <td>
                            <span className={styles.itemsCount}>
                              <Package size={14} />
                              {order.line_items_count || order.items_count || 0}
                            </span>
                          </td>
                          <td>
                            <span className={styles.orderTotal}>
                              {formatCurrency(order.total)}
                            </span>
                          </td>
                          <td>
                            <div className={styles.paymentStatus}>
                              <CreditCard size={14} />
                              <span className={`${styles.statusBadge} ${styles[`status${(order.payment_status || 'pending').charAt(0).toUpperCase() + (order.payment_status || 'pending').slice(1).toLowerCase()}`]}`}>
                                {order.payment_status || 'Pending'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className={styles.shippingStatus}>
                              <Truck size={14} />
                              <span className={`${styles.statusBadge} ${styles[`status${(order.shipping_status || 'pending').charAt(0).toUpperCase() + (order.shipping_status || 'pending').slice(1).toLowerCase()}`]}`}>
                                {order.shipping_status || 'Pending'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className={`${styles.statusBadge} ${styles[`status${order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase()}`]}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className={styles.actionBtn}
                              onClick={() => handleViewOrder(order)}
                              title="View Order Details"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}