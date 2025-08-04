import React, { useMemo, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useOrdersData } from '../../hooks/useViewData';
import { ProgressLoader } from '../ProgressLoader';
import CardTable from '../shared/CardTable';
import MetricCard from '../shared/MetricCard';
import CardChart from '../shared/CardChart';
import SegmentedButtonGroup from '../shared/SegmentedButtonGroup';

interface DashboardContext {
  userId: string;
  dashboardState: any;
  updateDashboardState: (updates: any) => void;
  navigate: (path: string) => void;
}

const EnhancedOrdersView: React.FC = () => {
  const context = useOutletContext<DashboardContext>();
  const { userId, dashboardState, navigate } = context;
  
  // Local state for orders view
  const [filters, setFilters] = useState({
    brand: '',
    status: '',
    sortBy: 'date' as 'date' | 'value',
    page: 1,
    pageSize: 50
  });

  // Load orders data
  const { 
    data, 
    loading, 
    error, 
    refresh, 
    isStale, 
    isCached 
  } = useOrdersData({
    userId,
    dateRange: dashboardState.dateRange,
    useCache: true,
    staleWhileRevalidate: true
  });

  // Process data for display
  const processedData = useMemo(() => {
    if (!data) return null;

    const { orders = [], metrics = {}, brands = [], agentPerformance = [] } = data;

    // Apply client-side filters
    let filteredOrders = [...orders];
    
    if (filters.brand) {
      filteredOrders = filteredOrders.filter(order => 
        order.line_items?.some(item => item.brand === filters.brand)
      );
    }
    
    if (filters.status) {
      filteredOrders = filteredOrders.filter(order => 
        order.status === filters.status
      );
    }

    // Sort orders
    filteredOrders.sort((a, b) => {
      if (filters.sortBy === 'value') {
        return (b.total || 0) - (a.total || 0);
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // Paginate
    const startIndex = (filters.page - 1) * filters.pageSize;
    const paginatedOrders = filteredOrders.slice(startIndex, startIndex + filters.pageSize);

    // Calculate order trends
    const orderTrends = calculateOrderTrends(orders);
    const statusDistribution = calculateStatusDistribution(orders);

    return {
      orders: paginatedOrders,
      totalOrders: filteredOrders.length,
      totalPages: Math.ceil(filteredOrders.length / filters.pageSize),
      metrics,
      brands,
      orderTrends,
      statusDistribution,
      agentPerformance
    };
  }, [data, filters]);

  // Handle filter changes
  const handleFilterChange = useCallback((filterType: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value,
      page: filterType !== 'page' ? 1 : prev.page // Reset to page 1 when filters change
    }));
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  // Refresh handler
  React.useEffect(() => {
    const handleRefresh = () => refresh();
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, [refresh]);

  if (loading && !isStale) {
    return (
      <ProgressLoader
        progress={50}
        message="Loading orders data..."
      />
    );
  }

  if (error && !processedData) {
    return (
      <div className="error-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h3>Unable to load orders</h3>
        <p>{error}</p>
        <button onClick={refresh} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  if (!processedData) {
    return <ProgressLoader progress={30} message="Processing orders..." />;
  }

  const { 
    orders, 
    totalOrders, 
    totalPages, 
    metrics, 
    brands, 
    orderTrends, 
    statusDistribution,
    agentPerformance 
  } = processedData;

  return (
    <div className="orders-view-container" style={{ position: 'relative' }}>
      {/* Status indicators */}
      {isStale && (
        <div style={{
          position: 'absolute',
          top: -40,
          right: 0,
          background: '#fbbf24',
          color: '#000',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          Refreshing...
        </div>
      )}

      {/* Metrics Row */}
      <div className="metrics-row" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <MetricCard
          id="total-orders"
          title="Total Orders"
          value={metrics.totalOrders || 0}
          subtitle="In selected period"
          format="number"
          displayMode={dashboardState.metricDisplayMode}
        />
        <MetricCard
          id="avg-order-value"
          title="Average Order Value"
          value={metrics.averageOrderValue || 0}
          subtitle="Per transaction"
          format="currency"
          displayMode={dashboardState.metricDisplayMode}
        />
        <MetricCard
          id="marketplace-orders"
          title="Marketplace Orders"
          value={metrics.marketplaceOrders || 0}
          subtitle="External channels"
          format="number"
          displayMode={dashboardState.metricDisplayMode}
        />
      </div>

      {/* Filters */}
      <div className="filters-row" style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <select 
          value={filters.brand} 
          onChange={(e) => handleFilterChange('brand', e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            background: '#fff'
          }}
        >
          <option value="">All Brands</option>
          {brands.map(brand => (
            <option key={brand.name} value={brand.name}>
              {brand.name} ({brand.orderCount} orders)
            </option>
          ))}
        </select>

        <select 
          value={filters.status} 
          onChange={(e) => handleFilterChange('status', e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            background: '#fff'
          }}
        >
          <option value="">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="draft">Draft</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <SegmentedButtonGroup
          options={[
            { label: 'Sort by Date', value: 'date' },
            { label: 'Sort by Value', value: 'value' }
          ]}
          value={filters.sortBy}
          onChange={(value) => handleFilterChange('sortBy', value)}
          size="small"
        />
      </div>

      {/* Charts Row */}
      <div className="charts-row" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <CardChart
          id="order-trends"
          title="Order Trends"
          subtitle="Daily order volume"
          data={orderTrends}
          type="line"
          dataKey="orders"
          height={300}
        />
        
        <CardChart
          id="status-distribution"
          title="Order Status Distribution"
          subtitle="Current status breakdown"
          data={statusDistribution}
          type="pie"
          dataKey="value"
          showLegend={true}
          height={300}
        />
      </div>

      {/* Orders Table */}
      <CardTable
        id="orders-table"
        title={`Orders (${totalOrders} total)`}
        subtitle={`Page ${filters.page} of ${totalPages}`}
        columns={[
          { key: 'order_number', label: 'Order #', width: '15%' },
          { key: 'customer_name', label: 'Customer', width: '25%' },
          { 
            key: 'date', 
            label: 'Date',
            width: '15%',
            format: (value) => new Date(value).toLocaleDateString()
          },
          { key: 'status', label: 'Status', width: '15%' },
          { 
            key: 'total', 
            label: 'Total', 
            align: 'right',
            format: (value) => `£${value.toLocaleString()}`
          }
        ]}
        data={orders.map(order => ({
          ...order,
          order_number: order.order_number || order.salesorder_number || order.id.slice(-8)
        }))}
        onRowClick={(row) => navigate(`/order/${row.id}`)}
        maxRows={filters.pageSize}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination" style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '24px'
        }}>
          <button 
            onClick={() => handlePageChange(filters.page - 1)}
            disabled={filters.page === 1}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              background: filters.page === 1 ? '#f3f4f6' : '#fff',
              cursor: filters.page === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Previous
          </button>
          
          <span style={{ padding: '8px 16px', display: 'flex', alignItems: 'center' }}>
            Page {filters.page} of {totalPages}
          </span>
          
          <button 
            onClick={() => handlePageChange(filters.page + 1)}
            disabled={filters.page === totalPages}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              background: filters.page === totalPages ? '#f3f4f6' : '#fff',
              cursor: filters.page === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

// Helper functions
function calculateOrderTrends(orders: any[]) {
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  const trendData = last30Days.map(date => {
    const dayOrders = orders.filter(order => 
      new Date(order.date).toISOString().split('T')[0] === date
    );
    
    return {
      date: new Date(date).toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: '2-digit' 
      }),
      orders: dayOrders.length,
      value: dayOrders.reduce((sum, order) => sum + (order.total || 0), 0)
    };
  });

  return trendData;
}

function calculateStatusDistribution(orders: any[]) {
  const statusCounts = orders.reduce((acc, order) => {
    const status = order.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(statusCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));
}

export default EnhancedOrdersView;