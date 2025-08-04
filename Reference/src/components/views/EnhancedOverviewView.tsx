import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useOverviewData } from '../../hooks/useViewData';
import { ProgressLoader } from '../ProgressLoader';
import MetricCard from '../shared/MetricCard';
import CardChart from '../shared/CardChart';
import CardTable from '../shared/CardTable';
import FullGraph from '../shared/FullGraph';
import MetricIcon from '../shared/MetricIcon';

interface DashboardContext {
  userId: string;
  dashboardState: any;
  updateDashboardState: (updates: any) => void;
  navigate: (path: string) => void;
}

const CHART_COLORS = ['#48B79B', '#6B8E71', '#8B7355', '#A66B6B', '#7B9EA6', '#9B7B8F'];

// Enhanced Overview View with view-specific data loading
const EnhancedOverviewView: React.FC = () => {
  const context = useOutletContext<DashboardContext>();
  const { userId, dashboardState, updateDashboardState, navigate } = context;

  // Load only overview data
  const { 
    data, 
    loading, 
    error, 
    refresh, 
    isStale, 
    isCached 
  } = useOverviewData({
    userId,
    dateRange: dashboardState.dateRange,
    useCache: true,
    staleWhileRevalidate: true
  });

  // Process the data for the view
  const viewData = useMemo(() => {
    if (!data) return null;

    // Extract essential data from the overview response
    const { metrics, topItems, agentPerformance, orders } = data;

    // Calculate chart data from recent orders
    const chartDataCache = {
      revenue: generateChartData(orders, 'revenue'),
      orders: generateChartData(orders, 'orders'),
      avgOrder: generateChartData(orders, 'avgOrder'),
      customers: generateChartData(orders, 'customers'),
      invoices: [], // Not needed for overview
      marketplace: generateChartData(orders, 'marketplace')
    };

    // Extract agents, brands, and items from the response
    const agents = agentPerformance?.agents || [];
    const brands = extractBrandsFromOrders(orders);
    const items = topItems || [];
    const prepareRevenueOrderData = prepareRevenueOrderDataFn(orders);

    return {
      data: { metrics, orders: orders || [] },
      agents,
      brands,
      items,
      chartDataCache,
      prepareRevenueOrderData
    };
  }, [data]);

  // Refresh handler
  React.useEffect(() => {
    const handleRefresh = () => refresh();
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, [refresh]);

  // Helper functions
  const getMetricCardColor = (index: number = 0) => {
    const colors = [
      dashboardState.graphColors.primary,
      '#799de9',
      '#79e9c5',
      '#FF9F00',
      '#C96868',
      '#4daeac'
    ];
    return colors[index % colors.length];
  };

  const calculateTrendFromPrevious = (current: number, previous: number) => {
    if (!previous || previous === 0) return undefined;
    const percentageChange = ((current - previous) / previous) * 100;
    return {
      value: Math.round(Math.abs(percentageChange)),
      isPositive: percentageChange > 0
    };
  };

  const handleAIInsight = (title: string, type: string) => {
    console.log('AI Insight:', title, type);
    // Implement AI insight functionality
  };

  if (loading && !isStale) {
    return (
      <ProgressLoader
        progress={50}
        message="Loading overview data..."
      />
    );
  }

  if (error && !viewData) {
    return (
      <div className="error-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h3>Unable to load overview</h3>
        <p>{error}</p>
        <button onClick={refresh} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  if (!viewData || !viewData.data || !viewData.data.metrics) {
    return (
      <ProgressLoader
        progress={30}
        message="Processing data..."
      />
    );
  }

  const { data: dashData, agents, brands, items, chartDataCache, prepareRevenueOrderData } = viewData;
  const getBarChartColors = [dashboardState.graphColors.primary];

  // Render the overview UI
  return (
    <div className="overview-container" style={{ padding: '0', width: '100%', position: 'relative' }}>
      {/* Status indicators */}
      {isStale && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          background: '#fbbf24',
          color: '#000',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 10
        }}>
          Refreshing...
        </div>
      )}
      {isCached && !isStale && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          background: '#10b981',
          color: '#fff',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 10
        }}>
          Cached
        </div>
      )}

      {/* Metrics Grid */}
      <div className={`metrics-grid ${dashboardState.metricDisplayMode === 'compact' ? 'compact-grid' : ''}`} style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
        minHeight: dashboardState.metricDisplayMode === 'compact' ? '120px' : '200px'
      }}>
        <MetricCard
          id="totalRevenue"
          title="Total Revenue"
          value={dashData?.metrics.totalRevenue || 0}
          subtitle="All channels combined"
          trend={calculateTrendFromPrevious(
            dashData?.metrics.totalRevenue || 0,
            (dashData?.metrics.totalRevenue || 0) * 0.88
          )}
          chartData={chartDataCache.revenue}
          format="currency"
          displayMode={dashboardState.metricDisplayMode}
          design={dashboardState.cardVariants.totalRevenue}
          onClick={() => navigate('/dashboard/revenue')}
          onOptionsClick={() => handleAIInsight('Total Revenue', 'totalRevenue')}
          onVariantChange={dashboardState.isEditMode ? (variant) => {
            updateDashboardState({ 
              cardVariants: { ...dashboardState.cardVariants, totalRevenue: variant }
            });
          } : undefined}
          icon={dashboardState.metricDisplayMode === 'compact' ? <MetricIcon name="dollar-sign" size={24} /> : undefined}
          color={getMetricCardColor(0)}
        />
        
        <MetricCard
          id="totalOrders"
          title="Total Orders"
          value={dashData?.metrics.totalOrders || 0}
          subtitle="Processed orders"
          trend={calculateTrendFromPrevious(
            dashData?.metrics.totalOrders || 0,
            (dashData?.metrics.totalOrders || 0) * 0.92
          )}
          chartData={chartDataCache.orders}
          format="number"
          displayMode={dashboardState.metricDisplayMode}
          design={dashboardState.cardVariants.totalOrders}
          onClick={() => navigate('/dashboard/orders')}
          onOptionsClick={() => handleAIInsight('Total Orders', 'totalOrders')}
          onVariantChange={dashboardState.isEditMode ? (variant) => {
            updateDashboardState({ 
              cardVariants: { ...dashboardState.cardVariants, totalOrders: variant }
            });
          } : undefined}
          icon={dashboardState.metricDisplayMode === 'compact' ? <MetricIcon name="package" size={24} /> : undefined}
          color={getMetricCardColor(1)}
        />
        
        <MetricCard
          id="activeCustomers"
          title="Active Customers"
          value={dashData?.metrics.totalCustomers || 0}
          subtitle="Unique buyers"
          trend={calculateTrendFromPrevious(
            dashData?.metrics.totalCustomers || 0,
            (dashData?.metrics.totalCustomers || 0) * 0.95
          )}
          chartData={chartDataCache.customers}
          format="number"
          displayMode={dashboardState.metricDisplayMode}
          design={dashboardState.cardVariants.activeCustomers}
          onClick={() => navigate('/customers')}
          onOptionsClick={() => handleAIInsight('Active Customers', 'totalCustomers')}
          onVariantChange={dashboardState.isEditMode ? (variant) => {
            updateDashboardState({ 
              cardVariants: { ...dashboardState.cardVariants, activeCustomers: variant }
            });
          } : undefined}
          icon={dashboardState.metricDisplayMode === 'compact' ? <MetricIcon name="users" size={24} /> : undefined}
          color={getMetricCardColor(2)}
        />
        
        <MetricCard
          id="avgOrderValue"
          title="Avg Order Value"
          value={dashData?.metrics.averageOrderValue || 0}
          subtitle="Per transaction"
          trend={calculateTrendFromPrevious(
            dashData?.metrics.averageOrderValue || 0,
            (dashData?.metrics.averageOrderValue || 0) * 0.97
          )}
          chartData={chartDataCache.avgOrder}
          format="currency"
          displayMode={dashboardState.metricDisplayMode}
          design={dashboardState.cardVariants.avgOrderValue}
          onOptionsClick={() => handleAIInsight('Average Order Value', 'averageOrderValue')}
          onVariantChange={dashboardState.isEditMode ? (variant) => {
            updateDashboardState({ 
              cardVariants: { ...dashboardState.cardVariants, avgOrderValue: variant }
            });
          } : undefined}
          icon={dashboardState.metricDisplayMode === 'compact' ? <MetricIcon name="bar-chart" size={24} /> : undefined}
          color={getMetricCardColor(3)}
        />
        
        <MetricCard
          id="outstandingInvoices"
          title="Outstanding Invoices"
          value={dashData?.metrics.outstandingInvoices || 0}
          subtitle="Pending payment"
          trend={calculateTrendFromPrevious(
            dashData?.metrics.outstandingInvoices || 0,
            (dashData?.metrics.outstandingInvoices || 0) * 1.1
          )}
          chartData={chartDataCache.invoices}
          format="currency"
          displayMode={dashboardState.metricDisplayMode}
          design={dashboardState.cardVariants.outstandingInvoices}
          onClick={() => navigate('/dashboard/invoices')}
          onOptionsClick={() => handleAIInsight('Outstanding Invoices', 'outstandingInvoices')}
          onVariantChange={dashboardState.isEditMode ? (variant) => {
            updateDashboardState({ 
              cardVariants: { ...dashboardState.cardVariants, outstandingInvoices: variant }
            });
          } : undefined}
          icon={dashboardState.metricDisplayMode === 'compact' ? <MetricIcon name="order" size={24} /> : undefined}
          color={getMetricCardColor(4)}
        />
        
        <MetricCard
          id="marketplaceOrders"
          title="Marketplace Orders"
          value={dashData?.metrics.marketplaceOrders || 0}
          subtitle="Amazon, eBay, etc"
          chartData={chartDataCache.marketplace}
          format="number"
          displayMode={dashboardState.metricDisplayMode}
          design={dashboardState.cardVariants.marketplaceOrders}
          onOptionsClick={() => handleAIInsight('Marketplace Orders', 'marketplaceOrders')}
          onVariantChange={dashboardState.isEditMode ? (variant) => {
            updateDashboardState({ 
              cardVariants: { ...dashboardState.cardVariants, marketplaceOrders: variant }
            });
          } : undefined}
          icon={dashboardState.metricDisplayMode === 'compact' ? <MetricIcon name="shopping-cart" size={24} /> : undefined}
          color={getMetricCardColor(5)}
        />
      </div>

      {/* Card Charts Grid */}
      <div className="card-charts-grid">
        <CardChart
          id="agent-performance"
          title="Sales Team Performance"
          subtitle="Top 5 agents by revenue"
          data={agents
          .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
          .slice(0, 5)
          .map(agent => ({
              name: agent.agentName || agent.name || 'Unknown Agent',
            value: Math.round(agent.totalRevenue || 0)
          }))}
          type="bar"
          dataKey="value"
          colors={getBarChartColors}
          design={dashboardState.chartDesign}
          height={280}
          onClick={() => console.log('View agent details')}
        />

        <CardChart
          id="brand-distribution"
          title="Brand Performance"
          subtitle="Revenue distribution by brand"
          data={brands.length > 0 ? brands.map(brand => ({
            name: brand.name || 'Unknown',
            value: brand.revenue || 0
          })) : [{ name: 'No brand data available', value: 1 }]}
          type="pie"
          dataKey="value"
          colors={CHART_COLORS}
          showLegend={true}
          height={280}
          onClick={() => navigate('/dashboard/brands')}
        />
      </div>

      {/* Card Tables Grid */}
      <div className="card-tables-grid">
        <CardTable
          id="top-products"
          title="Top Products"
          subtitle="Best performing items this period"
          columns={[
            { key: 'name', label: 'Product', width: '40%' },
            { key: 'brand', label: 'Brand', width: '25%' },
            { key: 'quantity', label: 'Units', align: 'right' },
            { 
              key: 'revenue', 
              label: 'Revenue', 
              align: 'right',
              format: (value) => `£${Math.round(value).toLocaleString()}`
            }
          ]}
          data={items.length > 0 ? items.map(item => ({
            ...item,
            name: item.name || item.item_name || 'Unknown Product'
          })) : []}
          maxRows={10}
          onViewAll={() => navigate('/inventory')}
          showIndex={true}
          highlightRows={true}
        />

        <CardTable
          id="recent-orders"
          title="Recent Orders"
          subtitle="Latest transactions"
          columns={[
            { key: 'order_number', label: 'Order #', width: '20%' },
            { key: 'customer_name', label: 'Customer' },
            { 
              key: 'date', 
              label: 'Date',
              format: (value) => new Date(value).toLocaleDateString()
            },
            { 
              key: 'total', 
              label: 'Total', 
              align: 'right',
              format: (value) => `£${value.toLocaleString()}`
            }
          ]}
          data={dashData?.orders?.slice(0, 10).map(order => ({
            ...order,
            order_number: order.order_number || order.id.slice(-8)
          })) || []}
          maxRows={5}
          onRowClick={(row) => navigate(`/order/${row.id}`)}
          onViewAll={() => navigate('/orders')}
        />
      </div>
      
       {/* Main Revenue & Order Trends Chart */}
      <div className="full-graph-container">
        <FullGraph
          id="revenue-orders-trend"
          title="Revenue & Order Trends"
          subtitle="Track your business performance over time"
          data={prepareRevenueOrderData}
          type="composed"
          lines={[
            { dataKey: 'revenue', color: dashboardState.graphColors.primary, name: 'Revenue', type: 'area' },
            { dataKey: 'orders', color: dashboardState.graphColors.secondary, name: 'Orders', type: 'line' }
          ]}
          showBrush={true}
          showGrid={true}
          showLegend={true}
          height={400}
        />
      </div>
    </div>
  );
};

// Helper functions
function generateChartData(orders: any[], metric: string) {
  if (!orders || orders.length === 0) return [];
  
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  const dataByDate = new Map();
  last30Days.forEach(date => {
    dataByDate.set(date, { name: new Date(date).toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit' 
    }), value: 0 });
  });

  orders.forEach(order => {
    const orderDate = new Date(order.date).toISOString().split('T')[0];
    if (dataByDate.has(orderDate)) {
      const dayData = dataByDate.get(orderDate);
      
      switch (metric) {
        case 'revenue':
          dayData.value += order.total || 0;
          break;
        case 'orders':
          dayData.value += 1;
          break;
        case 'avgOrder':
          dayData.value = (dayData.value + (order.total || 0)) / 2;
          break;
        case 'marketplace':
          if (order.is_marketplace_order) {
            dayData.value += 1;
          }
          break;
        default:
          break;
      }
    }
  });

  return Array.from(dataByDate.values());
}

function extractBrandsFromOrders(orders: any[]) {
  if (!orders || orders.length === 0) return [];
  
  const brandMap = new Map();
  
  orders.forEach(order => {
    if (order.line_items && Array.isArray(order.line_items)) {
      order.line_items.forEach(item => {
        const brandName = item.brand_normalized || item.brand || 'Unknown';
        
        if (!brandMap.has(brandName)) {
          brandMap.set(brandName, {
            name: brandName,
            revenue: 0,
            quantity: 0,
            orderCount: 0
          });
        }
        
        const brand = brandMap.get(brandName);
        brand.revenue += item.total || item.item_total || 0;
        brand.quantity += item.quantity || 0;
        brand.orderCount += 1;
      });
    }
  });
  
  return Array.from(brandMap.values()).sort((a, b) => b.revenue - a.revenue);
}

function prepareRevenueOrderDataFn(orders: any[]) {
  if (!orders || orders.length === 0) return [];
  
  return orders
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce((acc, order) => {
      const date = new Date(order.date).toISOString().split('T')[0];
      const existing = acc.find(d => d.date === date);
      
      if (existing) {
        existing.orders += 1;
        existing.revenue += order.total;
      } else {
        acc.push({ date, orders: 1, revenue: order.total });
      }
      
      return acc;
    }, [] as { date: string; orders: number; revenue: number }[])
    .slice(-30);
}

export default EnhancedOverviewView;
