import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc,
  doc,
  setDoc,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

export interface CustomerOrdersMigrationProgress {
  message: string;
  progress: number;
}

export class CustomerOrdersMigration {
  /**
   * Dry run to check which customers need orders migration
   */
  static async dryRun(): Promise<{
    customersToUpdate: number;
    totalCustomers: number;
    ordersToMigrate: number;
  }> {
    console.log('Starting customer orders migration dry run...');
    
    let totalCustomers = 0;
    let customersToUpdate = 0;
    let ordersToMigrate = 0;
    
    try {
      // Get all customers
      const customersSnapshot = await getDocs(collection(db, 'customers'));
      totalCustomers = customersSnapshot.size;
      console.log(`Found ${totalCustomers} customers`);
      
      // Check each customer
      for (const customerDoc of customersSnapshot.docs) {
        const customerId = customerDoc.data().customer_id;
        
        // Check if customer already has orders subcollection
        const ordersSubcollection = await getDocs(
          collection(db, 'customers', customerDoc.id, 'customers_orders')
        );
        
        // Get orders from sales_orders collection
        const ordersQuery = query(
          collection(db, 'sales_orders'),
          where('customer_id', '==', customerId)
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        
        if (ordersSnapshot.size > 0 && ordersSubcollection.size === 0) {
          customersToUpdate++;
          ordersToMigrate += ordersSnapshot.size;
        }
      }
      
      console.log(`Dry run complete:
        - Total customers: ${totalCustomers}
        - Customers needing update: ${customersToUpdate}
        - Orders to migrate: ${ordersToMigrate}`);
      
      return {
        customersToUpdate,
        totalCustomers,
        ordersToMigrate
      };
      
    } catch (error) {
      console.error('Error during dry run:', error);
      throw error;
    }
  }
  
  /**
   * Run the actual migration
   */
  static async runMigration(
    onProgress?: (message: string, progress: number) => void
  ): Promise<void> {
    console.log('Starting customer orders migration...');
    
    let totalProcessed = 0;
    let totalOrdersMigrated = 0;
    let customersUpdated = 0;
    let errors = 0;
    
    try {
      onProgress?.('Fetching customers...', 0);
      
      // Get all customers
      const customersSnapshot = await getDocs(collection(db, 'customers'));
      const totalCustomers = customersSnapshot.size;
      let customerIndex = 0;
      
      // Process each customer
      for (const customerDoc of customersSnapshot.docs) {
        customerIndex++;
        const customerData = customerDoc.data();
        const customerId = customerData.customer_id;
        
        onProgress?.(
          `Processing customer ${customerIndex}/${totalCustomers}...`,
          (customerIndex / totalCustomers) * 50
        );
        
        try {
          // Get all orders for this customer
          const ordersQuery = query(
            collection(db, 'sales_orders'),
            where('customer_id', '==', customerId),
            orderBy('date', 'desc')
          );
          const ordersSnapshot = await getDocs(ordersQuery);
          
          if (ordersSnapshot.empty) {
            continue;
          }
          
          // Calculate metrics
          let totalSpent = 0;
          let totalPaid = 0;
          let orderCount = ordersSnapshot.size;
          let firstOrderDate: Date | null = null;
          let lastOrderDate: Date | null = null;
          
          // Use batch for efficient writes
          const batch = writeBatch(db);
          
          // Process each order
          for (const orderDoc of ordersSnapshot.docs) {
            const orderData = orderDoc.data();
            
            // Add to customer's orders subcollection
            const orderRef = doc(
              db, 
              'customers', 
              customerDoc.id, 
              'customers_orders', 
              orderDoc.id
            );
            
            batch.set(orderRef, {
              ...orderData,
              order_id: orderDoc.id,
              migrated_at: Timestamp.now()
            });
            
            // Update metrics
            totalSpent += orderData.total || 0;
            if (orderData.paid_status === 'paid') {
              totalPaid += orderData.total || 0;
            }
            
            const orderDate = new Date(orderData.date || orderData.created_time);
            if (!firstOrderDate || orderDate < firstOrderDate) {
              firstOrderDate = orderDate;
            }
            if (!lastOrderDate || orderDate > lastOrderDate) {
              lastOrderDate = orderDate;
            }
            
            totalOrdersMigrated++;
          }
          
          // Calculate additional metrics
          const averageOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;
          const customerLifetimeDays = firstOrderDate && lastOrderDate
            ? Math.ceil((lastOrderDate.getTime() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0;
          const paymentPerformance = totalSpent > 0 
            ? Math.round((totalPaid / totalSpent) * 100)
            : 100;
          
          // Get invoice count
          const invoicesQuery = query(
            collection(db, 'invoices'),
            where('customer_id', '==', customerId)
          );
          const invoicesSnapshot = await getDocs(invoicesQuery);
          const invoiceCount = invoicesSnapshot.size;
          
          let totalInvoiced = 0;
          for (const invDoc of invoicesSnapshot.docs) {
            totalInvoiced += invDoc.data().total || 0;
          }
          
          // Update customer document with metrics
          batch.update(doc(db, 'customers', customerDoc.id), {
            metrics: {
              average_order_value: averageOrderValue,
              customer_lifetime_days: customerLifetimeDays,
              first_order_date: firstOrderDate?.toISOString() || null,
              last_order_date: lastOrderDate?.toISOString() || null,
              invoice_count: invoiceCount,
              order_count: orderCount,
              payment_performance: paymentPerformance,
              total_invoiced: totalInvoiced,
              total_paid: totalPaid,
              total_spent: totalSpent
            },
            last_updated: Timestamp.now()
          });
          
          // Commit batch
          await batch.commit();
          customersUpdated++;
          
          totalProcessed++;
          
          // Update progress
          const overallProgress = 50 + ((totalProcessed / totalCustomers) * 50);
          onProgress?.(
            `Migrated ${totalOrdersMigrated} orders for ${customersUpdated} customers...`,
            Math.round(overallProgress)
          );
          
        } catch (customerError) {
          console.error(`Error processing customer ${customerId}:`, customerError);
          errors++;
        }
      }
      
      // Final summary
      const message = `Migration complete! Updated ${customersUpdated} customers with ${totalOrdersMigrated} orders. Errors: ${errors}`;
      console.log(message);
      onProgress?.(message, 100);
      
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }
  
  /**
   * Update metrics for a single customer
   */
  static async updateCustomerMetrics(customerId: string): Promise<void> {
    try {
      // Find customer document
      const customersQuery = query(
        collection(db, 'customers'),
        where('customer_id', '==', customerId)
      );
      const customersSnapshot = await getDocs(customersQuery);
      
      if (customersSnapshot.empty) {
        throw new Error(`Customer not found: ${customerId}`);
      }
      
      const customerDoc = customersSnapshot.docs[0];
      
      // Get all orders
      const ordersQuery = query(
        collection(db, 'sales_orders'),
        where('customer_id', '==', customerId),
        orderBy('date', 'desc')
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      
      // Calculate metrics
      let totalSpent = 0;
      let totalPaid = 0;
      let orderCount = ordersSnapshot.size;
      let firstOrderDate: Date | null = null;
      let lastOrderDate: Date | null = null;
      
      for (const orderDoc of ordersSnapshot.docs) {
        const orderData = orderDoc.data();
        
        totalSpent += orderData.total || 0;
        if (orderData.paid_status === 'paid') {
          totalPaid += orderData.total || 0;
        }
        
        const orderDate = new Date(orderData.date || orderData.created_time);
        if (!firstOrderDate || orderDate < firstOrderDate) {
          firstOrderDate = orderDate;
        }
        if (!lastOrderDate || orderDate > lastOrderDate) {
          lastOrderDate = orderDate;
        }
      }
      
      // Calculate additional metrics
      const averageOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;
      const customerLifetimeDays = firstOrderDate && lastOrderDate
        ? Math.ceil((lastOrderDate.getTime() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const paymentPerformance = totalSpent > 0 
        ? Math.round((totalPaid / totalSpent) * 100)
        : 100;
      
      // Get invoice metrics
      const invoicesQuery = query(
        collection(db, 'invoices'),
        where('customer_id', '==', customerId)
      );
      const invoicesSnapshot = await getDocs(invoicesQuery);
      const invoiceCount = invoicesSnapshot.size;
      
      let totalInvoiced = 0;
      for (const invDoc of invoicesSnapshot.docs) {
        totalInvoiced += invDoc.data().total || 0;
      }
      
      // Update customer document
      await updateDoc(doc(db, 'customers', customerDoc.id), {
        metrics: {
          average_order_value: averageOrderValue,
          customer_lifetime_days: customerLifetimeDays,
          first_order_date: firstOrderDate?.toISOString() || null,
          last_order_date: lastOrderDate?.toISOString() || null,
          invoice_count: invoiceCount,
          order_count: orderCount,
          payment_performance: paymentPerformance,
          total_invoiced: totalInvoiced,
          total_paid: totalPaid,
          total_spent: totalSpent
        },
        last_updated: Timestamp.now()
      });
      
    } catch (error) {
      console.error('Error updating customer metrics:', error);
      throw error;
    }
  }
}
