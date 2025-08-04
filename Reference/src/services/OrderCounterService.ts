import { doc, getDoc, setDoc, updateDoc, increment, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';

interface OrderCounters {
  total: number;
  pending: number;
  shipped: number;
  closed: number;
  thisMonth: number;
  lastMonthReset?: string; // Track when we last reset the monthly counter
}

export class OrderCounterService {
  private static COUNTER_DOC_ID = 'order_counters';
  private static COUNTERS_COLLECTION = 'system_counters';

  /**
   * Initialize counters if they don't exist
   */
  static async initializeCounters(): Promise<void> {
    const counterRef = doc(db, this.COUNTERS_COLLECTION, this.COUNTER_DOC_ID);
    const counterDoc = await getDoc(counterRef);

    if (!counterDoc.exists()) {
      const initialCounters: OrderCounters = {
        total: 0,
        pending: 0,
        shipped: 0,
        closed: 0,
        thisMonth: 0,
        lastMonthReset: new Date().toISOString().slice(0, 7) // YYYY-MM format
      };
      
      await setDoc(counterRef, initialCounters);
    }
  }

  /**
   * Get all counter values
   */
  static async getCounters(): Promise<OrderCounters> {
    const counterRef = doc(db, this.COUNTERS_COLLECTION, this.COUNTER_DOC_ID);
    const counterDoc = await getDoc(counterRef);

    if (!counterDoc.exists()) {
      await this.initializeCounters();
      return this.getCounters();
    }

    const data = counterDoc.data() as OrderCounters;
    
    // Check if we need to reset monthly counter
    const currentMonth = new Date().toISOString().slice(0, 7);
    if (data.lastMonthReset !== currentMonth) {
      await updateDoc(counterRef, {
        thisMonth: 0,
        lastMonthReset: currentMonth
      });
      data.thisMonth = 0;
    }

    return data;
  }

  /**
   * Increment counters when a new order is created
   */
  static async incrementForNewOrder(status: string, isThisMonth: boolean = true): Promise<void> {
    const counterRef = doc(db, this.COUNTERS_COLLECTION, this.COUNTER_DOC_ID);
    
    await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      if (!counterDoc.exists()) {
        await this.initializeCounters();
        return;
      }

      const updates: any = {
        total: increment(1)
      };

      // Update status-specific counter
      if (status === 'draft' || status === 'sent' || status === 'open') {
        updates.pending = increment(1);
      } else if (status === 'fulfilled' || status === 'shipped') {
        updates.shipped = increment(1);
      } else if (status === 'closed') {
        updates.closed = increment(1);
      }

      // Update monthly counter if applicable
      if (isThisMonth) {
        updates.thisMonth = increment(1);
      }

      transaction.update(counterRef, updates);
    });
  }

  /**
   * Update counters when order status changes
   */
  static async updateForStatusChange(
    oldStatus: string, 
    newStatus: string, 
    isThisMonth: boolean = true
  ): Promise<void> {
    const counterRef = doc(db, this.COUNTERS_COLLECTION, this.COUNTER_DOC_ID);
    
    await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      if (!counterDoc.exists()) {
        return;
      }

      const updates: any = {};

      // Decrement old status counter
      if (oldStatus === 'draft' || oldStatus === 'sent' || oldStatus === 'open') {
        updates.pending = increment(-1);
      } else if (oldStatus === 'fulfilled' || oldStatus === 'shipped') {
        updates.shipped = increment(-1);
      } else if (oldStatus === 'closed') {
        updates.closed = increment(-1);
      }

      // Increment new status counter
      if (newStatus === 'draft' || newStatus === 'sent' || newStatus === 'open') {
        updates.pending = increment(1);
      } else if (newStatus === 'fulfilled' || newStatus === 'shipped') {
        updates.shipped = increment(1);
      } else if (newStatus === 'closed') {
        updates.closed = increment(1);
      }

      transaction.update(counterRef, updates);
    });
  }

  /**
   * Recalculate all counters from scratch (useful for migrations)
   */
  static async recalculateCounters(orders: any[]): Promise<void> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const thisMonthStart = new Date(currentMonth + '-01');

    let counters: OrderCounters = {
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

    const counterRef = doc(db, this.COUNTERS_COLLECTION, this.COUNTER_DOC_ID);
    await setDoc(counterRef, counters);
  }

  /**
   * Get counters for a specific sales agent
   */
  static async getAgentCounters(agentId: string): Promise<OrderCounters> {
    const counterRef = doc(db, 'sales_agents', agentId, 'counters', 'order_counters');
    const counterDoc = await getDoc(counterRef);

    if (!counterDoc.exists()) {
      // Initialize agent-specific counters
      const initialCounters: OrderCounters = {
        total: 0,
        pending: 0,
        shipped: 0,
        closed: 0,
        thisMonth: 0,
        lastMonthReset: new Date().toISOString().slice(0, 7)
      };
      
      await setDoc(counterRef, initialCounters);
      return initialCounters;
    }

    const data = counterDoc.data() as OrderCounters;
    
    // Check if we need to reset monthly counter
    const currentMonth = new Date().toISOString().slice(0, 7);
    if (data.lastMonthReset !== currentMonth) {
      await updateDoc(counterRef, {
        thisMonth: 0,
        lastMonthReset: currentMonth
      });
      data.thisMonth = 0;
    }

    return data;
  }
}

export default OrderCounterService;