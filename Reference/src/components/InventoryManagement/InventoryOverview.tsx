import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import MetricCard from '../shared/MetricCard';
import CardTable from '../shared/CardTable';
import { FaBox, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import './InventoryOverview.css';
import { ProgressLoader } from '../ProgressLoader';

interface InventoryOverviewProps {}

const InventoryOverview: React.FC<InventoryOverviewProps> = () => {
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [needsRestock, setNeedsRestock] = useState(0);
  const [activeSkus, setActiveSkus] = useState(0);
  const [shippedToday, setShippedToday] = useState<any[]>([]);
  const [packedToday, setPackedToday] = useState<any[]>([]);

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);

      // Fetch all items data
      const itemsQuery = query(
        collection(db, 'items_data'),
        where('status', '==', 'active')
      );
      const itemsSnapshot = await getDocs(itemsQuery);
      
      let activeCount = 0;
      let inStockCount = 0;
      let restockCount = 0;

      itemsSnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Skip items with XXX SKU prefix
        if (data.sku && data.sku.startsWith('XXX')) {
          return;
        }

        activeCount++;
        
        // Count products in stock (not quantity)
        if (data.stock_on_hand > 0) {
          inStockCount++;
        }
        
        // Count products needing restock
        if (data.stock_on_hand < data.reorder_level) {
          restockCount++;
        }
      });

      setTotalProducts(inStockCount);
      setNeedsRestock(restockCount);
      setActiveSkus(activeCount);

      // Fetch today's shipped orders
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      const shippedQuery = query(
        collection(db, 'sales_orders'),
        where('shipment_date', '==', todayStr),
        orderBy('salesorder_number', 'desc'),
        limit(10)
      );
      const shippedSnapshot = await getDocs(shippedQuery);
      const shippedData = shippedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setShippedToday(shippedData);

      // For packed orders, we'll look for orders with quantity_packed > 0 and status not shipped
      // Since there's no packed_date field, we'll use orders that have been packed recently
      const packedQuery = query(
        collection(db, 'sales_orders'),
        where('status', 'in', ['confirmed', 'packed']),
        where('quantity_packed', '>', 0),
        orderBy('last_modified_time', 'desc'),
        limit(10)
      );
      const packedSnapshot = await getDocs(packedQuery);
      const packedData = packedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPackedToday(packedData);

    } catch (error) {
      console.error('Error fetching inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const shippedColumns = [
    { 
      key: 'salesorder_number', 
      label: 'Order #',
      width: '25%'
    },
    { 
      key: 'customer_name', 
      label: 'Customer',
      width: '35%'
    },
    { 
      key: 'quantity_shipped', 
      label: 'Items',
      width: '20%',
      align: 'right' as const
    },
    { 
      key: 'total', 
      label: 'Total',
      width: '20%',
      align: 'right' as const,
      format: (value: number) => new Intl.NumberFormat('en-GB', { 
        style: 'currency', 
        currency: 'GBP' 
      }).format(value)
    }
  ];

  const packedColumns = [
    { 
      key: 'salesorder_number', 
      label: 'Order #',
      width: '25%'
    },
    { 
      key: 'customer_name', 
      label: 'Customer',
      width: '35%'
    },
    { 
      key: 'quantity_packed', 
      label: 'Items',
      width: '20%',
      align: 'right' as const
    },
    { 
      key: 'status', 
      label: 'Status',
      width: '20%',
      format: (value: string) => value.charAt(0).toUpperCase() + value.slice(1)
    }
  ];

  if (loading) {
    return (
      <div className="inventory-overview-loading">
        <ProgressLoader 
          progress={0} 
          message="Loading Inventory Overview"
          submessage="Calculating metrics and fetching recent orders..."
        />
      </div>
    );
  }

  return (
    <div className="inventory-overview">
      <div className="overview-header">
        <h1>Inventory Overview</h1>
      </div>

      <div className="metric-cards-container">
        <MetricCard
          id="total-products"
          title="Total Products (In Stock)"
          value={totalProducts}
          icon={<FaBox />}
          format="number"
          displayMode="compact"
          color="#3B82F6"
        />
        <MetricCard
          id="needs-restock"
          title="Total in Restock"
          value={needsRestock}
          icon={<FaExclamationTriangle />}
          format="number"
          displayMode="compact"
          color="#F59E0B"
        />
        <MetricCard
          id="active-skus"
          title="Active SKUs"
          value={activeSkus}
          icon={<FaCheckCircle />}
          format="number"
          displayMode="compact"
          color="#10B981"
        />
      </div>

      <div className="tables-container">
        <div className="table-wrapper">
          <CardTable
            id="shipped-today"
            title="Orders Shipped"
            subtitle="Orders shipped today"
            columns={shippedColumns}
            data={shippedToday}
            maxRows={5}
            onViewAll={() => window.location.href = '/orders?filter=shipped-today'}
          />
        </div>
        <div className="table-wrapper">
          <CardTable
            id="packed-today"
            title="Orders Packed"
            subtitle="Recently packed orders"
            columns={packedColumns}
            data={packedToday}
            maxRows={5}
            onViewAll={() => window.location.href = '/orders?filter=packed'}
          />
        </div>
      </div>
    </div>
  );
};

export default InventoryOverview;
