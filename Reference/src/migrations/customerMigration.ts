import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';

export interface CustomerMigrationProgress {
  message: string;
  progress: number;
}

export class CustomerMigration {
  /**
   * Dry run to check which assigned customers need updates
   */
  static async dryRun(): Promise<{
    customersNeedingUpdate: number;
    totalAssignedCustomers: number;
    salesAgentsToUpdate: number;
  }> {
    console.log('Starting customer migration dry run...');
    
    let totalAssignedCustomers = 0;
    let customersNeedingUpdate = 0;
    const salesAgentsToUpdate = new Set<string>();
    
    try {
      // Get all sales agents
      const salesAgentsSnapshot = await getDocs(collection(db, 'sales_agents'));
      console.log(`Found ${salesAgentsSnapshot.size} sales agents`);
      
      // Process each sales agent
      for (const agentDoc of salesAgentsSnapshot.docs) {
        const agentId = agentDoc.id;
        
        // Get assigned customers for this agent
        const assignedCustomersSnapshot = await getDocs(
          collection(db, 'sales_agents', agentId, 'assigned_customers')
        );
        
        totalAssignedCustomers += assignedCustomersSnapshot.size;
        
        // Check each assigned customer
        for (const assignedDoc of assignedCustomersSnapshot.docs) {
          const assignedData = assignedDoc.data();
          
          // Check if last_order_date or created_date is missing
          if (!assignedData.last_order_date || !assignedData.created_date) {
            customersNeedingUpdate++;
            salesAgentsToUpdate.add(agentId);
          }
        }
      }
      
      console.log(`Dry run complete:
        - Total assigned customers: ${totalAssignedCustomers}
        - Customers needing update: ${customersNeedingUpdate}
        - Sales agents affected: ${salesAgentsToUpdate.size}`);
      
      return {
        customersNeedingUpdate,
        totalAssignedCustomers,
        salesAgentsToUpdate: salesAgentsToUpdate.size
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
    console.log('Starting customer migration...');
    
    let totalProcessed = 0;
    let totalUpdated = 0;
    let errors = 0;
    
    try {
      onProgress?.('Fetching sales agents...', 0);
      
      // Get all sales agents
      const salesAgentsSnapshot = await getDocs(collection(db, 'sales_agents'));
      const totalAgents = salesAgentsSnapshot.size;
      let agentIndex = 0;
      
      // Process each sales agent
      for (const agentDoc of salesAgentsSnapshot.docs) {
        const agentId = agentDoc.id;
        agentIndex++;
        
        onProgress?.(
          `Processing agent ${agentIndex}/${totalAgents}...`,
          (agentIndex / totalAgents) * 20
        );
        
        // Get assigned customers for this agent
        const assignedCustomersSnapshot = await getDocs(
          collection(db, 'sales_agents', agentId, 'assigned_customers')
        );
        
        const totalAssignedForAgent = assignedCustomersSnapshot.size;
        let customerIndex = 0;
        
        // Process each assigned customer
        for (const assignedDoc of assignedCustomersSnapshot.docs) {
          customerIndex++;
          totalProcessed++;
          
          try {
            const assignedData = assignedDoc.data();
            const customerId = assignedData.customer_id;
            
            // Skip if already has both fields
            if (assignedData.last_order_date && assignedData.created_date) {
              continue;
            }
            
            // Fetch customer data from main customers collection
            const customerQuery = query(
              collection(db, 'customers'),
              where('customer_id', '==', customerId)
            );
            const customerSnapshot = await getDocs(customerQuery);
            
            if (customerSnapshot.empty) {
              console.warn(`Customer not found: ${customerId}`);
              errors++;
              continue;
            }
            
            const customerDoc = customerSnapshot.docs[0];
            const customerData = customerDoc.data();
            
            // Get order information for last_order_date
            let lastOrderDate = assignedData.last_order_date;
            if (!lastOrderDate) {
              // Try to get from orders collection
              const ordersQuery = query(
                collection(db, 'orders'),
                where('customer_id', '==', customerId),
                orderBy('date', 'desc')
              );
              const ordersSnapshot = await getDocs(ordersQuery);
              
              if (!ordersSnapshot.empty) {
                lastOrderDate = ordersSnapshot.docs[0].data().date;
              }
              
              // If still no order date, try agent's customer_orders
              if (!lastOrderDate) {
                const agentOrdersQuery = query(
                  collection(db, 'sales_agents', agentId, 'customers_orders'),
                  where('customer_id', '==', customerId),
                  orderBy('date', 'desc')
                );
                const agentOrdersSnapshot = await getDocs(agentOrdersQuery);
                
                if (!agentOrdersSnapshot.empty) {
                  lastOrderDate = agentOrdersSnapshot.docs[0].data().date;
                }
              }
            }
            
            // Get created_date
            const createdDate = assignedData.created_date || 
                              customerData.created_date || 
                              customerData.created_time ||
                              customerData.first_order_date;
            
            // Prepare update data
            const updateData: any = {};
            if (!assignedData.last_order_date && lastOrderDate) {
              updateData.last_order_date = lastOrderDate;
            }
            if (!assignedData.created_date && createdDate) {
              updateData.created_date = createdDate;
            }
            
            // Update if there's data to update
            if (Object.keys(updateData).length > 0) {
              await updateDoc(
                doc(db, 'sales_agents', agentId, 'assigned_customers', assignedDoc.id),
                updateData
              );
              totalUpdated++;
            }
            
            // Update progress
            const totalAssignedCustomers = await CustomerMigration.getTotalAssignedCustomers();
            const overallProgress = 20 + ((totalProcessed / totalAssignedCustomers) * 80);
            onProgress?.(
              `Updated ${totalUpdated} customers (${totalProcessed} processed)...`,
              Math.round(overallProgress)
            );
            
          } catch (customerError) {
            console.error(`Error processing customer:`, customerError);
            errors++;
          }
        }
      }
      
      // Final summary
      const message = `Migration complete! Updated ${totalUpdated} out of ${totalProcessed} assigned customers. Errors: ${errors}`;
      console.log(message);
      onProgress?.(message, 100);
      
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }
  
  /**
   * Get total number of assigned customers across all agents
   */
  static async getTotalAssignedCustomers(): Promise<number> {
    let total = 0;
    const salesAgentsSnapshot = await getDocs(collection(db, 'sales_agents'));
    
    for (const agentDoc of salesAgentsSnapshot.docs) {
      const assignedSnapshot = await getDocs(
        collection(db, 'sales_agents', agentDoc.id, 'assigned_customers')
      );
      total += assignedSnapshot.size;
    }
    
    return total;
  }
}