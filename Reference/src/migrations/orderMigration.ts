import { collection, getDocs, updateDoc, doc, writeBatch, query, limit, startAfter, DocumentSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import OrderCounterService from '../services/OrderCounterService';

/**
 * Migration script to add line_items_count to all existing orders
 * and initialize order counters
 */
export class OrderMigration {
  static BATCH_SIZE = 500; // Process 500 orders at a time
  static UPDATE_BATCH_SIZE = 500; // Firestore batch write limit

  /**
   * Run the complete migration
   */
  static async runMigration(onProgress?: (message: string, progress: number) => void): Promise<void> {
    try {
      onProgress?.('Starting order migration...', 0);
      
      // Step 1: Add line_items_count to all orders
      await this.addLineItemsCounts(onProgress);
      
      // Step 2: Initialize and recalculate counters
      await this.initializeCounters(onProgress);
      
      onProgress?.('Migration completed successfully!', 100);
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Add line_items_count field to all orders
   */
  private static async addLineItemsCounts(onProgress?: (message: string, progress: number) => void): Promise<void> {
    let processedCount = 0;
    let lastDoc: DocumentSnapshot | null = null;
    let hasMore = true;
    
    // First, get total count for progress tracking
    const totalCountSnapshot = await getDocs(collection(db, 'sales_orders'));
    const totalOrders = totalCountSnapshot.size;
    
    onProgress?.(`Found ${totalOrders} orders to process...`, 5);

    while (hasMore) {
      // Build query with pagination
      let ordersQuery = query(
        collection(db, 'sales_orders'),
        limit(this.BATCH_SIZE)
      );
      
      if (lastDoc) {
        ordersQuery = query(
          collection(db, 'sales_orders'),
          startAfter(lastDoc),
          limit(this.BATCH_SIZE)
        );
      }

      const ordersSnapshot = await getDocs(ordersQuery);
      
      if (ordersSnapshot.empty) {
        hasMore = false;
        break;
      }

      // Process orders in batches
      const batch = writeBatch(db);
      let batchCount = 0;
      
      for (const orderDoc of ordersSnapshot.docs) {
        const orderId = orderDoc.id;
        const orderData = orderDoc.data();
        
        // Skip if already has line_items_count
        if (orderData.line_items_count !== undefined) {
          processedCount++;
          continue;
        }

        // Count line items in subcollection
        const lineItemsSnapshot = await getDocs(
          collection(db, 'sales_orders', orderId, 'order_line_items')
        );
        
        const lineItemsCount = lineItemsSnapshot.size;
        
        // Add to batch
        batch.update(doc(db, 'sales_orders', orderId), {
          line_items_count: lineItemsCount,
          migration_updated_at: new Date().toISOString()
        });
        
        batchCount++;
        processedCount++;
        
        // Commit batch if it reaches the limit
        if (batchCount >= this.UPDATE_BATCH_SIZE) {
          await batch.commit();
          const progress = Math.round((processedCount / totalOrders) * 90) + 5;
          onProgress?.(`Processed ${processedCount}/${totalOrders} orders...`, progress);
          
          // Start new batch
          const newBatch = writeBatch(db);
          batchCount = 0;
        }
      }
      
      // Commit remaining updates
      if (batchCount > 0) {
        await batch.commit();
      }
      
      // Update pagination
      lastDoc = ordersSnapshot.docs[ordersSnapshot.docs.length - 1];
      hasMore = ordersSnapshot.docs.length === this.BATCH_SIZE;
      
      const progress = Math.round((processedCount / totalOrders) * 90) + 5;
      onProgress?.(`Processed ${processedCount}/${totalOrders} orders...`, progress);
    }
  }

  /**
   * Initialize and recalculate all counters
   */
  private static async initializeCounters(onProgress?: (message: string, progress: number) => void): Promise<void> {
    onProgress?.('Initializing order counters...', 95);
    
    // Initialize the counter document
    await OrderCounterService.initializeCounters();
    
    // Fetch all orders to recalculate counters
    const allOrders: any[] = [];
    let lastDoc: DocumentSnapshot | null = null;
    let hasMore = true;
    
    while (hasMore) {
      let ordersQuery = query(
        collection(db, 'sales_orders'),
        limit(1000)
      );
      
      if (lastDoc) {
        ordersQuery = query(
          collection(db, 'sales_orders'),
          startAfter(lastDoc),
          limit(1000)
        );
      }

      const ordersSnapshot = await getDocs(ordersQuery);
      
      if (ordersSnapshot.empty) {
        hasMore = false;
        break;
      }

      ordersSnapshot.docs.forEach(doc => {
        allOrders.push({ id: doc.id, ...doc.data() });
      });
      
      lastDoc = ordersSnapshot.docs[ordersSnapshot.docs.length - 1];
      hasMore = ordersSnapshot.docs.length === 1000;
    }
    
    // Recalculate all counters
    await OrderCounterService.recalculateCounters(allOrders);
    
    onProgress?.('Counters initialized successfully!', 98);
    
    // Also initialize agent-specific counters
    await this.initializeAgentCounters(allOrders, onProgress);
  }

  /**
   * Initialize counters for each sales agent
   */
  private static async initializeAgentCounters(allOrders: any[], onProgress?: (message: string, progress: number) => void): Promise<void> {
    onProgress?.('Initializing agent-specific counters...', 99);
    
    // Group orders by salesperson
    const ordersBySalesperson: { [key: string]: any[] } = {};
    
    allOrders.forEach(order => {
      const salespersonId = order.salesperson_id;
      if (salespersonId) {
        if (!ordersBySalesperson[salespersonId]) {
          ordersBySalesperson[salespersonId] = [];
        }
        ordersBySalesperson[salespersonId].push(order);
      }
    });
    
    // Initialize counters for each salesperson
    for (const [salespersonId, orders] of Object.entries(ordersBySalesperson)) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const thisMonthStart = new Date(currentMonth + '-01');

      let counters = {
        total: orders.length,
        pending: 0,
        shipped: 0,
        closed: 0,
        thisMonth: 0,
        lastMonthReset: currentMonth
      };

      orders.forEach(order => {
        // Status counters
        if (order.status === 'draft' || order.status === 'sent' || order.current_sub_status === 'open') {
          counters.pending++;
        } else if (order.status === 'fulfilled' || order.current_sub_status === 'shipped') {
          counters.shipped++;
        } else if (order.current_sub_status === 'closed') {
          counters.closed++;
        }

        // Monthly counter
        const orderDate = new Date(order.date || order.created_time);
        if (orderDate >= thisMonthStart) {
          counters.thisMonth++;
        }
      });

      // Save agent counters
      const counterRef = doc(db, 'sales_agents', salespersonId, 'counters', 'order_counters');
      await setDoc(counterRef, counters);
    }
  }

  /**
   * Dry run to check what would be updated
   */
  static async dryRun(): Promise<{ ordersNeedingUpdate: number; totalOrders: number }> {
    let ordersNeedingUpdate = 0;
    let totalOrders = 0;
    
    const ordersSnapshot = await getDocs(collection(db, 'sales_orders'));
    
    for (const orderDoc of ordersSnapshot.docs) {
      totalOrders++;
      const orderData = orderDoc.data();
      
      if (orderData.line_items_count === undefined) {
        ordersNeedingUpdate++;
      }
    }
    
    return { ordersNeedingUpdate, totalOrders };
  }
}

// Function to run migration from console or admin panel
export async function runOrderMigration() {
  console.log('Starting order migration...');
  
  // First do a dry run
  const { ordersNeedingUpdate, totalOrders } = await OrderMigration.dryRun();
  console.log(`Dry run complete: ${ordersNeedingUpdate} orders need updating out of ${totalOrders} total orders`);
  
  if (ordersNeedingUpdate === 0) {
    console.log('No orders need updating. Migration already complete!');
    return;
  }
  
  // Confirm before proceeding
  const proceed = window.confirm(`This will update ${ordersNeedingUpdate} orders. Proceed?`);
  if (!proceed) {
    console.log('Migration cancelled');
    return;
  }
  
  // Run the migration with progress logging
  await OrderMigration.runMigration((message, progress) => {
    console.log(`[${progress}%] ${message}`);
  });
  
  console.log('Migration completed successfully!');
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).runOrderMigration = runOrderMigration;
}