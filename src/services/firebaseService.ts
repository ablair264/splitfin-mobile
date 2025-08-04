import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

type QueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  brand?: string;
  category?: string;
  dateRange?: string;
  startDate?: string;
  endDate?: string;
};

class FirebaseService {
  
  private async getCurrentUserId(): Promise<string | null> {
    const user = auth().currentUser;
    return user?.uid || null;
  }

  private async getCurrentUserData(): Promise<any> {
    const userId = await this.getCurrentUserId();
    if (!userId) return null;
    
    const userDoc = await firestore().collection('users').doc(userId).get();
    return userDoc.exists() ? userDoc.data() : null;
  }

  private applyPagination(query: FirebaseFirestoreTypes.Query, params: QueryParams) {
    if (params.limit) {
      query = query.limit(params.limit);
    }
    return query;
  }

  private applySearch(query: FirebaseFirestoreTypes.Query, searchField: string, searchValue: string) {
    // Firebase doesn't support case-insensitive search directly
    // This is a simple implementation - you might want to use Algolia or similar for better search
    return query.where(searchField, '>=', searchValue)
                .where(searchField, '<=', searchValue + '\uf8ff');
  }

  // Products/Items Methods
  items = {
    getAll: async (params: QueryParams = {}) => {
      let query: FirebaseFirestoreTypes.Query = firestore().collection('items_data');
      
      if (params.search) {
        query = this.applySearch(query, 'item_name', params.search);
      }
      
      if (params.brand) {
        query = query.where('brand_normalized', '==', params.brand.toLowerCase());
      }
      
      query = this.applyPagination(query, params);
      
      const snapshot = await query.get();
      return {
        data: snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })),
        total: snapshot.size
      };
    },

    getById: async (id: string) => {
      const doc = await firestore().collection('items_data').doc(id).get();
      if (!doc.exists) {
        throw new Error('Item not found');
      }
      return {
        id: doc.id,
        ...doc.data()
      };
    },

    getByBrand: async (brandId: string, params: QueryParams = {}) => {
      let query: FirebaseFirestoreTypes.Query = firestore()
        .collection('items_data')
        .where('brand_normalized', '==', brandId.toLowerCase());
      
      if (params.search) {
        query = this.applySearch(query, 'item_name', params.search);
      }
      
      if (params.category) {
        query = query.where('category', '==', params.category);
      }
      
      query = this.applyPagination(query, params);
      
      const snapshot = await query.get();
      return {
        data: snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })),
        total: snapshot.size
      };
    },

    search: async (searchQuery: string, brandId?: string) => {
      let query: FirebaseFirestoreTypes.Query = firestore().collection('items_data');
      
      if (brandId) {
        query = query.where('brand_normalized', '==', brandId.toLowerCase());
      }
      
      query = this.applySearch(query, 'item_name', searchQuery);
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }
  };

  // Customers Methods
  customers = {
    getAll: async (params: QueryParams = {}) => {
      const userData = await this.getCurrentUserData();
      let query: FirebaseFirestoreTypes.Query = firestore().collection('customers');
      
      // Filter by assigned agent if user is a sales agent
      if (userData?.role === 'salesAgent' && userData?.sales_agent_id) {
        query = query.where('assigned_agent_id', '==', userData.sales_agent_id);
      }
      
      if (params.search) {
        query = this.applySearch(query, 'customer_name', params.search);
      }
      
      query = this.applyPagination(query, params);
      
      const snapshot = await query.get();
      return {
        data: snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })),
        total: snapshot.size
      };
    },

    getById: async (id: string) => {
      const doc = await firestore().collection('customers').doc(id).get();
      if (!doc.exists) {
        throw new Error('Customer not found');
      }
      return {
        id: doc.id,
        ...doc.data()
      };
    },

    create: async (customerData: any) => {
      const userData = await this.getCurrentUserData();
      const newCustomer = {
        ...customerData,
        created_by: userData?.uid || 'system',
        created_date: firestore.Timestamp.now(),
        assigned_agent_id: userData?.sales_agent_id || null,
        status: 'active'
      };
      
      const docRef = await firestore().collection('customers').add(newCustomer);
      return {
        id: docRef.id,
        ...newCustomer
      };
    },

    update: async (id: string, customerData: any) => {
      const userData = await this.getCurrentUserData();
      const updateData = {
        ...customerData,
        last_modified: firestore.Timestamp.now(),
        updated_by: userData?.uid || 'system'
      };
      
      await firestore().collection('customers').doc(id).update(updateData);
      return this.customers.getById(id);
    }
  };

  // Orders Methods
  orders = {
    getAll: async (params: QueryParams = {}) => {
      const userData = await this.getCurrentUserData();
      let query: FirebaseFirestoreTypes.Query = firestore().collection('sales_orders');
      
      // Filter by assigned agent if user is a sales agent
      if (userData?.role === 'salesAgent' && userData?.sales_agent_id) {
        query = query.where('salesperson_id', '==', userData.sales_agent_id);
      }
      
      if (params.status) {
        query = query.where('status', '==', params.status);
      }
      
      query = query.orderBy('date', 'desc');
      query = this.applyPagination(query, params);
      
      const snapshot = await query.get();
      return {
        data: snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })),
        total: snapshot.size
      };
    },

    getById: async (id: string) => {
      const doc = await firestore().collection('sales_orders').doc(id).get();
      if (!doc.exists) {
        throw new Error('Order not found');
      }
      
      // Get line items from subcollection
      const lineItemsSnapshot = await firestore()
        .collection('sales_orders')
        .doc(id)
        .collection('order_line_items')
        .get();
      
      const lineItems = lineItemsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return {
        id: doc.id,
        ...doc.data(),
        line_items: lineItems
      };
    },

    create: async (orderData: any) => {
      const userData = await this.getCurrentUserData();
      const { line_items, ...orderInfo } = orderData;
      
      const newOrder = {
        ...orderInfo,
        created_by: userData?.uid || 'system',
        created_date: firestore.Timestamp.now(),
        salesperson_id: userData?.sales_agent_id || null,
        status: 'draft'
      };
      
      const orderRef = await firestore().collection('sales_orders').add(newOrder);
      
      // Add line items to subcollection
      if (line_items && line_items.length > 0) {
        const batch = firestore().batch();
        line_items.forEach((item: any) => {
          const lineItemRef = firestore()
            .collection('sales_orders')
            .doc(orderRef.id)
            .collection('order_line_items')
            .doc();
          batch.set(lineItemRef, item);
        });
        await batch.commit();
      }
      
      return this.orders.getById(orderRef.id);
    },

    update: async (id: string, orderData: any) => {
      const userData = await this.getCurrentUserData();
      const { line_items, ...orderInfo } = orderData;
      
      const updateData = {
        ...orderInfo,
        last_modified: firestore.Timestamp.now(),
        updated_by: userData?.uid || 'system'
      };
      
      await firestore().collection('sales_orders').doc(id).update(updateData);
      
      // Update line items if provided
      if (line_items) {
        // Delete existing line items
        const existingItems = await firestore()
          .collection('sales_orders')
          .doc(id)
          .collection('order_line_items')
          .get();
        
        const batch = firestore().batch();
        existingItems.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        // Add new line items
        line_items.forEach((item: any) => {
          const lineItemRef = firestore()
            .collection('sales_orders')
            .doc(id)
            .collection('order_line_items')
            .doc();
          batch.set(lineItemRef, item);
        });
        
        await batch.commit();
      }
      
      return this.orders.getById(id);
    }
  };

  // Invoices Methods
  invoices = {
    getAll: async (params: QueryParams = {}) => {
      const userData = await this.getCurrentUserData();
      let query: FirebaseFirestoreTypes.Query = firestore().collection('invoices');
      
      if (userData?.role === 'salesAgent' && userData?.sales_agent_id) {
        query = query.where('salesperson_id', '==', userData.sales_agent_id);
      }
      
      if (params.status) {
        query = query.where('status', '==', params.status);
      }
      
      if (params.search) {
        query = this.applySearch(query, 'invoice_number', params.search);
      }
      
      query = query.orderBy('date', 'desc');
      query = this.applyPagination(query, params);
      
      const snapshot = await query.get();
      return {
        data: snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })),
        total: snapshot.size
      };
    },

    getById: async (id: string) => {
      const doc = await firestore().collection('invoices').doc(id).get();
      if (!doc.exists) {
        throw new Error('Invoice not found');
      }
      return {
        id: doc.id,
        ...doc.data()
      };
    },

    create: async (invoiceData: any) => {
      const userData = await this.getCurrentUserData();
      const newInvoice = {
        ...invoiceData,
        created_by: userData?.uid || 'system',
        created_date: firestore.Timestamp.now(),
        salesperson_id: userData?.sales_agent_id || null,
        status: 'draft'
      };
      
      const docRef = await firestore().collection('invoices').add(newInvoice);
      return {
        id: docRef.id,
        ...newInvoice
      };
    },

    update: async (id: string, invoiceData: any) => {
      const userData = await this.getCurrentUserData();
      const updateData = {
        ...invoiceData,
        last_modified: firestore.Timestamp.now(),
        updated_by: userData?.uid || 'system'
      };
      
      await firestore().collection('invoices').doc(id).update(updateData);
      return this.invoices.getById(id);
    },

    delete: async (id: string) => {
      await firestore().collection('invoices').doc(id).delete();
      return { success: true };
    }
  };

  // Dashboard Methods
  dashboard = {
    getData: async (userId: string, params: QueryParams = {}) => {
      const userData = await this.getCurrentUserData();
      
      // Define date range
      let startDate, endDate;
      const now = new Date();
      switch (params.dateRange) {
        case '7_days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          endDate = now;
          break;
        case '90_days':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          endDate = now;
          break;
        case 'this_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = now;
          break;
        default: // 30_days
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          endDate = now;
      }

      // Build queries
      let ordersQuery: FirebaseFirestoreTypes.Query = firestore().collection('sales_orders');
      let customersQuery: FirebaseFirestoreTypes.Query = firestore().collection('customers');
      let invoicesQuery: FirebaseFirestoreTypes.Query = firestore().collection('invoices');
      let itemsQuery: FirebaseFirestoreTypes.Query = firestore().collection('items_data');

      // Filter by sales agent if applicable
      if (userData?.sales_agent_id) {
        ordersQuery = ordersQuery.where('salesperson_id', '==', userData.sales_agent_id);
        customersQuery = customersQuery.where('assigned_agent_id', '==', userData.sales_agent_id);
        invoicesQuery = invoicesQuery.where('salesperson_id', '==', userData.sales_agent_id);
      }

      // Apply date filters
      if (startDate && endDate) {
        const firestoreStartDate = firestore.Timestamp.fromDate(startDate);
        const firestoreEndDate = firestore.Timestamp.fromDate(endDate);
        ordersQuery = ordersQuery.where('date', '>=', firestoreStartDate).where('date', '<=', firestoreEndDate);
        invoicesQuery = invoicesQuery.where('date', '>=', firestoreStartDate).where('date', '<=', firestoreEndDate);
      }

      // Execute all queries in parallel
      const [ordersSnapshot, customersSnapshot, invoicesSnapshot, itemsSnapshot] = await Promise.all([
        ordersQuery.get(),
        customersQuery.get(),
        invoicesQuery.get(),
        itemsQuery.limit(100).get()
      ]);

      // Process orders data
      const orders = ordersSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        total: (doc.data() as any).total || 0,
        date: (doc.data() as any).date,
        customer_name: (doc.data() as any).customer_name || 'Unknown Customer',
        status: (doc.data() as any).status || 'pending'
      }));

      const customers = customersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const invoices = invoicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        total: (doc.data() as any).total || 0,
        status: (doc.data() as any).status || 'draft'
      }));

      const items = itemsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate comprehensive metrics
      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
      const totalOrders = orders.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const activeCustomers = customers.filter(c => (c as any).status === 'active').length;
      const outstandingInvoices = invoices.filter(i => i.status === 'pending').reduce((sum, inv) => sum + inv.total, 0);
      const marketplaceOrders = orders.filter(o => (o as any).source === 'marketplace').length;

      // Process brand performance data
      const brandPerformance = items.reduce((acc: any, item: any) => {
        const brand = item.brand_normalized || 'unknown';
        if (!acc[brand]) {
          acc[brand] = {
            brand: item.brand || brand,
            revenue: 0,
            orders: 0,
            units: 0
          };
        }
        
        // Find orders for this item
        const itemOrders = orders.filter(order => 
          (order as any).line_items?.some((line: any) => line.item_id === item.id)
        );
        
        itemOrders.forEach(order => {
          const lineItem = (order as any).line_items?.find((line: any) => line.item_id === item.id);
          if (lineItem) {
            acc[brand].revenue += lineItem.total || 0;
            acc[brand].orders += 1;
            acc[brand].units += lineItem.quantity || 0;
          }
        });
        
        return acc;
      }, {});

      const topBrands = Object.values(brandPerformance)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 5);

      // Generate revenue over time data
      const revenueOverTime = [];
      const days = Math.min(30, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));
      
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dayOrders = orders.filter(order => {
          const orderDate = order.date?.toDate?.() || new Date(order.date);
          return orderDate.toDateString() === date.toDateString();
        });
        const dayRevenue = dayOrders.reduce((sum, order) => sum + order.total, 0);
        
        revenueOverTime.push({
          date: date.toISOString().split('T')[0],
          value: dayRevenue
        });
      }

      return {
        metrics: {
          totalRevenue,
          totalOrders,
          avgOrderValue,
          activeCustomers,
          outstandingInvoices,
          marketplaceOrders,
          ordersThisMonth: orders.filter(order => {
            const orderDate = order.date?.toDate?.() || new Date(order.date);
            const thisMonth = new Date();
            return orderDate.getMonth() === thisMonth.getMonth() && 
                   orderDate.getFullYear() === thisMonth.getFullYear();
          }).length
        },
        charts: {
          revenueOverTime,
          ordersByStatus: [
            { status: 'Pending', count: orders.filter(o => o.status === 'pending').length },
            { status: 'Processing', count: orders.filter(o => o.status === 'processing').length },
            { status: 'Shipped', count: orders.filter(o => o.status === 'shipped').length },
            { status: 'Delivered', count: orders.filter(o => o.status === 'delivered').length }
          ],
          topProducts: items.slice(0, 5).map(item => ({
            name: (item as any).item_name || 'Unknown Product',
            sales: Math.floor(Math.random() * 100) // TODO: Calculate actual sales
          })),
          customerGrowth: [] // TODO: Implement customer growth calculation
        },
        recentOrders: orders
          .sort((a, b) => {
            const dateA = a.date?.toDate?.() || new Date(a.date);
            const dateB = b.date?.toDate?.() || new Date(b.date);
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 10)
          .map(order => ({
            id: order.id,
            customerName: order.customer_name,
            amount: order.total,
            status: order.status,
            date: order.date?.toDate?.()?.toISOString() || new Date(order.date).toISOString()
          })),
        topCustomers: customers
          .map(customer => {
            const customerOrders = orders.filter(o => (o as any).customer_id === customer.id);
            const totalSpent = customerOrders.reduce((sum, order) => sum + order.total, 0);
            return {
              id: customer.id,
              name: (customer as any).customer_name || 'Unknown Customer',
              totalSpent,
              orderCount: customerOrders.length
            };
          })
          .sort((a, b) => b.totalSpent - a.totalSpent)
          .slice(0, 5),
        brandPerformance: topBrands,
        lastUpdated: new Date().toISOString()
      };
    },

    getViewData: async (userId: string, view: string, params: QueryParams = {}) => {
      // Implementation depends on the specific view requirements
      // This is a placeholder for view-specific data
      return this.dashboard.getData(userId, params);
    },

    getAIInsights: async (userId: string, dataType: string, data: any) => {
      // For now, return a placeholder response
      // In a real implementation, you would integrate with an AI service
      return {
        insights: [
          'Based on your sales data, revenue is trending upward.',
          'Consider focusing on high-performing product categories.',
          'Customer retention rate is above industry average.'
        ],
        recommendations: [
          'Schedule follow-ups with recent customers',
          'Promote best-selling products to new prospects'
        ]
      };
    }
  };

  // Authentication methods (already handled by Firebase Auth)
  auth = {
    login: async (email: string, password: string) => {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      return userCredential.user;
    },

    signup: async (data: { email: string; password: string; displayName: string }) => {
      const userCredential = await auth().createUserWithEmailAndPassword(data.email, data.password);
      
      // Update display name
      await userCredential.user.updateProfile({
        displayName: data.displayName
      });
      
      // Create user document in Firestore
      await firestore().collection('users').doc(userCredential.user.uid).set({
        email: data.email,
        name: data.displayName,
        role: 'customer', // Default role
        createdAt: firestore.Timestamp.now(),
        isOnline: true
      });
      
      return userCredential.user;
    },

    resetPassword: async (email: string) => {
      await auth().sendPasswordResetEmail(email);
      return { success: true };
    }
  };
}

export default new FirebaseService();