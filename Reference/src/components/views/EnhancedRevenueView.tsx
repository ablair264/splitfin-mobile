import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useRevenueData } from '../../hooks/useViewData';
import { ProgressLoader } from '../ProgressLoader';
import MetricCard from '../shared/MetricCard';
import CardChart from '../shared/CardChart';
import FullGraph from '../shared/FullGraph';
import CardTable from '../shared/CardTable';

interface DashboardContext {
  userId: string;
  dashboardState: any;
  updateDashboardState: (updates: any) => void;
  navigate: (path: string) => void;
}

const EnhancedRevenueView: React.FC = () => {
  const context = useOutletContext<DashboardContext>();
  const { userId, dashboardState, navigate } = context;
  
  // Load revenue data
  const { 
    data, 
    loading, 
    error, 
    refresh, 
    isStale, 
    isCached 
  } = useRevenueData({
    userId,
    dateRange: dashboardState.dateRange,
    useCache: true,
    staleWhileRevalidate: true
  });

  // Process data for display
  const processedData = useMemo(() => {
    if (!data) return null;

    const { 
      metrics = {}, 
      orders = [], 
      agentPerformance = [],
      brands = [] 
    } = data;

    // Calculate revenue trends
    const revenueTrends = calculateRevenueTrends(orders);
    const revenueByBrand = calculateRevenueByBrand(orders, brands);
    const revenueByAgent = calculateRevenueByAgent(orders, agentPerformance);
    const monthlyRevenue = calculateMonthlyRevenue(orders);

    return {
      metrics,
      revenueTrends,
      revenueByBrand,
      revenueByAgent,
      monthlyRevenue,
      topRevenueOrders: orders
        .sort((a, b) => (b.total || 0) - (a.total || 0))
        .slice(0, 10)
    };
  }, [data]);

  // Refresh handler
  React.useEffect(() => {
    const handleRefresh = () => refresh();
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, [refresh]);

  if (loading && !isStale) {
    return <ProgressLoader progress={50} message="Loading revenue data..." />;
  }

  if (error && !processedData) {
    return (
      <div className="error-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h3>Unable to load revenue data</h3>
        <p>{error}</p>
        <button onClick={refresh} className="retry-button">Try Again</button>
      </div>
    );
  }

  if (!processedData) {
    return <ProgressLoader progress={30} message="Processing revenue data..." />;
  }

  const { 
    metrics, 
    revenueTrends, 
    revenueByBrand, 
    revenueByAgent, 
    monthlyRevenue,
    topRevenueOrders 
  } = processedData;

  return (
    <div className="revenue-view-container" style={{ position: 'relative' }}>
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
          id="total-revenue"
          title="Total Revenue"
          value={metrics.totalRevenue || 0}
          subtitle="All channels"
          format="currency"
          displayMode={dashboardState.metricDisplayMode}
          color={dashboardState.graphColors.primary}
        />
        <MetricCard
          id="avg-order-value"
          title="Average Order Value"
          value={metrics.averageOrderValue || 0}
          subtitle="Per transaction"
          format="currency"
          displayMode={dashboardState.metricDisplayMode}
          color={dashboardState.graphColors.secondary}
        />
        <MetricCard
          id="outstanding-invoices"
          title="Outstanding Invoices"
          value={metrics.outstandingInvoices || 0}
          subtitle="Pending collection"
          format="currency"
          displayMode={dashboardState.metricDisplayMode}
          color={dashboardState.graphColors.tertiary}
        />
      </div>

      {/* Revenue Trends Chart */}
      <FullGraph
        id="revenue-trends"
        title="Revenue Trends"
        subtitle="Daily revenue over time"
        data={revenueTrends}
        type="area"
        lines={[
          { dataKey: 'revenue', color: dashboardState.graphColors.primary, name: 'Revenue' }
        ]}
        height={400}
        showBrush={true}
        showGrid={true}
      />

      {/* Charts Grid */}
      <div className="charts-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '16px',
        marginTop: '24px',
        marginBottom: '24px'
      }}>
        <CardChart
          id="revenue-by-brand"
          title="Revenue by Brand"
          subtitle="Top performing brands"
          data={revenueByBrand.slice(0, 10)}
          type="bar"
          dataKey="revenue"
          height={300}
          colors={[dashboardState.graphColors.primary]}
        />
        
        <CardChart
          id="revenue-by-agent"
          title="Revenue by Agent"
          subtitle="Team performance"
          data={revenueByAgent.slice(0, 8)}
          type="bar"
          design="horizontal-bars"
          dataKey="revenue"
          height={300}
          colors={[dashboardState.graphColors.secondary]}
        />
      </div>

      {/* Monthly Summary */}
      <CardChart
        id="monthly-revenue"
        title="Monthly Revenue Summary"
        subtitle="Revenue breakdown by month"
        data={monthlyRevenue}
        type="bar"
        dataKey="revenue"
        height={300}
        colors={[dashboardState.graphColors.primary]}
      />

      {/* Top Revenue Orders Table */}
      <CardTable
        id="top-revenue-orders"
        title="Top Revenue Orders"
        subtitle="Highest value transactions"
        columns={[
          { key: 'order_number', label: 'Order #', width: '20%' },
          { key: 'customer_name', label: 'Customer', width: '30%' },
          { 
            key: 'date', 
            label: 'Date',
            width: '20%',
            format: (value) => new Date(value).toLocaleDateString()
          },
          { 
            key: 'total', 
            label: 'Revenue', 
            align: 'right',
            format: (value) => `£${value.toLocaleString()}`
          }
        ]}
        data={topRevenueOrders.map(order => ({
          ...order,
          order_number: order.order_number || order.salesorder_number || order.id.slice(-8)
        }))}
        onRowClick={(row) => navigate(`/order/${row.id}`)}
        maxRows={10}
      />
    </div>
  );
};

// Helper functions
function calculateRevenueTrends(orders: any[]) {
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  return last30Days.map(date => {
    const dayOrders = orders.filter(order => 
      new Date(order.date).toISOString().split('T')[0] === date
    );
    
    return {
      date: new Date(date).toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: '2-digit' 
      }),
      revenue: dayOrders.reduce((sum, order) => sum + (order.total || 0), 0)
    };
  });
}

function calculateRevenueByBrand(orders: any[], brands: any[]) {
  const brandMap = new Map();
  
  orders.forEach(order => {
    if (order.line_items) {
      order.line_items.forEach(item => {
        const brand = item.brand_normalized || item.brand || 'Unknown';
        if (!brandMap.has(brand)) {
          brandMap.set(brand, { name: brand, revenue: 0 });
        }
        brandMap.get(brand).revenue += item.total || item.item_total || 0;
      });
    }
  });
  
  return Array.from(brandMap.values())
    .sort((a, b) => b.revenue - a.revenue);
}

function calculateRevenueByAgent(orders: any[], agents: any[]) {
  const agentMap = new Map();
  
  agents.forEach(agent => {
    agentMap.set(agent.agentId, {
      name: agent.agentName || agent.name || 'Unknown',
      revenue: agent.totalRevenue || 0
    });
  });
  
  return Array.from(agentMap.values())
    .sort((a, b) => b.revenue - a.revenue);
}

function calculateMonthlyRevenue(orders: any[]) {
  const monthlyMap = new Map();
  
  orders.forEach(order => {
    const date = new Date(order.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    
    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, { name: monthName, revenue: 0, orders: 0 });
    }
    
    const month = monthlyMap.get(monthKey);
    month.revenue += order.total || 0;
    month.orders += 1;
  });
  
  return Array.from(monthlyMap.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(-12); // Last 12 months
}

export default EnhancedRevenueView;