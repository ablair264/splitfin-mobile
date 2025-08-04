import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  getDoc, 
  doc,
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

export interface SalesOrder {
  id: string;
  salesorder_id: string;
  salesorder_number: string;
  customer_id: string;
  customer_name: string;
  company_name: string;
  date: string;
  created_time: string;
  total: number;
  status: string;
  current_sub_status: string;
  salesperson_id: string;
  salesperson_name: string;
  line_items?: OrderLineItem[];
  [key: string]: any;
}

export interface OrderLineItem {
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
  [key: string]: any;
}

export interface Customer {
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
  metrics?: {
    total_spent?: number;
    order_count?: number;
    last_order_date?: string;
    first_order_date?: string;
  };
  [key: string]: any;
}

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
  salesorder_id?: string;
  salesorder_number?: string;
  salesperson_id?: string;
  salesperson_name?: string;
  [key: string]: any;
}

export interface SalesAgent {
  id: string;
  uid: string;
  zohospID: string;
  name: string;
  email: string;
  phone: string;
  region: string | string[];
  role: string;
  brandsAssigned: Record<string, boolean>;
  [key: string]: any;
}

/**
 * Firebase Data Service for the new collection structure
 * Handles data fetching for sales_orders, customers, invoices, and sales_agents collections
 */
export class FirebaseDataService {
  
  /**
   * Get sales orders for a specific user (manager gets all, agent gets assigned)
   */
  async getSalesOrders(userId: string, dateRange?: { start: Date; end: Date }): Promise<SalesOrder[]> {
    try {
      // Get user details to determine access pattern
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      const userRole = userData?.role;
      const userZohoId = userData?.zohospID || userData?.zohoAgentID;

      let ordersData: SalesOrder[] = [];

      if (userRole === 'salesAgent' && userZohoId) {
        // For sales agents, get orders from their subcollection
        const agentOrdersSnapshot = await getDocs(
          collection(db, 'sales_agents', userZohoId, 'customers_orders')
        );
        
        const orderIds = agentOrdersSnapshot.docs.map(doc => 
          doc.data().sales_order_id || doc.data().salesorder_id
        );
        
        if (orderIds.length > 0) {
          ordersData = await this.fetchOrdersByIds(orderIds, dateRange);
        }
      } else {
        // For managers/admins, get all orders
        ordersData = await this.fetchAllOrders(dateRange);
      }
      
      return ordersData;
    } catch (error) {
      console.error('Error fetching sales orders:', error);
      throw error;
    }
  }

  /**
   * Get customers for a specific user (manager gets all, agent gets assigned)
   */
  async getCustomers(userId: string): Promise<Customer[]> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      const userRole = userData?.role;
      const userZohoId = userData?.zohospID || userData?.zohoAgentID;

      let customersData: Customer[] = [];

      if (userRole === 'salesAgent' && userZohoId) {
        // For sales agents, get assigned customers
        const assignedCustomersSnapshot = await getDocs(
          collection(db, 'sales_agents', userZohoId, 'assigned_customers')
        );
        
        const assignedCustomerIds = assignedCustomersSnapshot.docs.map(doc => doc.data().customer_id);
        
        if (assignedCustomerIds.length > 0) {
          customersData = await this.fetchCustomersByIds(assignedCustomerIds);
          
          // Enhance with order statistics
          const agentOrdersSnapshot = await getDocs(
            collection(db, 'sales_agents', userZohoId, 'customers_orders')
          );
          
          customersData = this.enhanceCustomersWithOrderStats(customersData, agentOrdersSnapshot.docs);
        }
      } else {
        // For managers/admins, get all customers
        customersData = await this.fetchAllCustomers();
      }
      
      return customersData;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }

  /**
   * Get invoices for a specific user (manager gets all, agent gets assigned)
   */
  async getInvoices(userId: string, dateRange?: { start: Date; end: Date }): Promise<Invoice[]> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      const userRole = userData?.role;
      const userZohoId = userData?.zohospID || userData?.zohoAgentID;

      let invoicesData: Invoice[] = [];

      if (userRole === 'salesAgent' && userZohoId) {
        // For sales agents, get invoices from their subcollection
        const agentInvoicesSnapshot = await getDocs(
          collection(db, 'sales_agents', userZohoId, 'customers_invoices')
        );
        
        const invoiceIds = agentInvoicesSnapshot.docs.map(doc => doc.data().invoice_id);
        
        if (invoiceIds.length > 0) {
          invoicesData = await this.fetchInvoicesByIds(invoiceIds, dateRange);
        }
      } else {
        // For managers/admins, get all invoices
        invoicesData = await this.fetchAllInvoices(dateRange);
      }
      
      return invoicesData;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  }

  /**
   * Get all sales agents (for managers)
   */
  async getSalesAgents(): Promise<SalesAgent[]> {
    try {
      const agentsSnapshot = await getDocs(collection(db, 'sales_agents'));
      return agentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SalesAgent));
    } catch (error) {
      console.error('Error fetching sales agents:', error);
      throw error;
    }
  }

  /**
   * Get assigned customers for a specific sales agent
   */
  async getAssignedCustomers(agentZohoId: string): Promise<string[]> {
    try {
      const assignedSnapshot = await getDocs(
        collection(db, 'sales_agents', agentZohoId, 'assigned_customers')
      );
      return assignedSnapshot.docs.map(doc => doc.data().customer_id);
    } catch (error) {
      console.error('Error fetching assigned customers:', error);
      throw error;
    }
  }

  // Private helper methods

  private async fetchOrdersByIds(orderIds: string[], dateRange?: { start: Date; end: Date }): Promise<SalesOrder[]> {
    const ordersData: SalesOrder[] = [];
    const chunkSize = 10; // Firestore 'in' query limit
    
    for (let i = 0; i < orderIds.length; i += chunkSize) {
      const chunk = orderIds.slice(i, i + chunkSize);
      let ordersQuery = query(
        collection(db, 'sales_orders'),
        where('__name__', 'in', chunk)
      );
      
      if (dateRange) {
        const startDate = dateRange.start.toISOString().split('T')[0];
        const endDate = dateRange.end.toISOString().split('T')[0];
        ordersQuery = query(ordersQuery, where('date', '>=', startDate), where('date', '<=', endDate));
      }
      
      const ordersSnapshot = await getDocs(ordersQuery);
      
      for (const orderDoc of ordersSnapshot.docs) {
        const orderData = orderDoc.data() as SalesOrder;
        const lineItems = await this.fetchOrderLineItems(orderDoc.id);
        
        ordersData.push({
          ...orderData,
          id: orderDoc.id,
          line_items: lineItems
        });
      }
    }
    
    return ordersData;
  }

  private async fetchAllOrders(dateRange?: { start: Date; end: Date }): Promise<SalesOrder[]> {
    let ordersQuery = query(
      collection(db, 'sales_orders'),
      orderBy('date', 'desc'),
      limit(1000) // Limit for performance
    );
    
    if (dateRange) {
      const startDate = dateRange.start.toISOString().split('T')[0];
      const endDate = dateRange.end.toISOString().split('T')[0];
      ordersQuery = query(
        collection(db, 'sales_orders'),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );
    }
    
    const ordersSnapshot = await getDocs(ordersQuery);
    const ordersData: SalesOrder[] = [];
    
    for (const orderDoc of ordersSnapshot.docs) {
      const orderData = orderDoc.data() as SalesOrder;
      const lineItems = await this.fetchOrderLineItems(orderDoc.id);
      
      ordersData.push({
        ...orderData,
        id: orderDoc.id,
        line_items: lineItems
      });
    }
    
    return ordersData;
  }

  private async fetchOrderLineItems(orderId: string): Promise<OrderLineItem[]> {
    const lineItemsSnapshot = await getDocs(
      collection(db, 'sales_orders', orderId, 'order_line_items')
    );
    
    return lineItemsSnapshot.docs.map(itemDoc => ({
      id: itemDoc.id,
      ...itemDoc.data()
    } as OrderLineItem));
  }

  private async fetchCustomersByIds(customerIds: string[]): Promise<Customer[]> {
    const customersData: Customer[] = [];
    const chunkSize = 10; // Firestore 'in' query limit
    
    for (let i = 0; i < customerIds.length; i += chunkSize) {
      const chunk = customerIds.slice(i, i + chunkSize);
      const customersQuery = query(
        collection(db, 'customers'),
        where('customer_id', 'in', chunk)
      );
      
      const customersSnapshot = await getDocs(customersQuery);
      customersData.push(...customersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Customer)));
    }
    
    return customersData;
  }

  private async fetchAllCustomers(): Promise<Customer[]> {
    const customersQuery = query(
      collection(db, 'customers'),
      orderBy('customer_name', 'asc')
    );
    
    const customersSnapshot = await getDocs(customersQuery);
    return customersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Customer));
  }

  private async fetchInvoicesByIds(invoiceIds: string[], dateRange?: { start: Date; end: Date }): Promise<Invoice[]> {
    const invoicesData: Invoice[] = [];
    const chunkSize = 10; // Firestore 'in' query limit
    
    for (let i = 0; i < invoiceIds.length; i += chunkSize) {
      const chunk = invoiceIds.slice(i, i + chunkSize);
      let invoicesQuery = query(
        collection(db, 'invoices'),
        where('invoice_id', 'in', chunk)
      );
      
      if (dateRange) {
        const startDate = dateRange.start.toISOString().split('T')[0];
        const endDate = dateRange.end.toISOString().split('T')[0];
        invoicesQuery = query(invoicesQuery, where('date', '>=', startDate), where('date', '<=', endDate));
      }
      
      const invoicesSnapshot = await getDocs(invoicesQuery);
      invoicesData.push(...invoicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Invoice)));
    }
    
    return invoicesData;
  }

  private async fetchAllInvoices(dateRange?: { start: Date; end: Date }): Promise<Invoice[]> {
    let invoicesQuery = query(
      collection(db, 'invoices'),
      orderBy('date', 'desc')
    );
    
    if (dateRange) {
      const startDate = dateRange.start.toISOString().split('T')[0];
      const endDate = dateRange.end.toISOString().split('T')[0];
      invoicesQuery = query(
        collection(db, 'invoices'),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );
    }
    
    const invoicesSnapshot = await getDocs(invoicesQuery);
    return invoicesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Invoice));
  }

  private enhanceCustomersWithOrderStats(customers: Customer[], orderDocs: any[]): Customer[] {
    const ordersByCustomer = new Map<string, any[]>();
    
    orderDocs.forEach(doc => {
      const orderData = doc.data();
      const customerId = orderData.customer_id;
      if (!ordersByCustomer.has(customerId)) {
        ordersByCustomer.set(customerId, []);
      }
      ordersByCustomer.get(customerId)!.push(orderData);
    });
    
    return customers.map(customer => {
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
        last_order_date: sortedOrders[0]?.date || sortedOrders[0]?.created_time,
        first_order_date: sortedOrders[sortedOrders.length - 1]?.date || sortedOrders[sortedOrders.length - 1]?.created_time
      };
    });
  }
}

// Export a singleton instance
export const firebaseDataService = new FirebaseDataService();