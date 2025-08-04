import React from 'react';
import { useOutletContext } from 'react-router-dom';
import MetricCard from '../shared/MetricCard';
import CardChart from '../shared/CardChart';
import CardTable from '../shared/CardTable';
import FullGraph from '../shared/FullGraph';
import SegmentedButtonGroup from '../shared/SegmentedButtonGroup';
import { TableCard } from '../shared';
import { ProgressLoader } from '../ProgressLoader';
import MetricIcon from '../shared/MetricIcon';
// import { useColors } from '../shared/ColorProvider'; // Removed - using props instead

// Define the interface for the context data
interface DashboardViewProps {
  data: any;
  agents: any[];
  brands: any[];
  items: any[];
  dashboardState: any;
  chartDataCache: any;
  getBarChartColors: string[];
  calculateTrendFromPrevious: (current: number, previous: number) => any;
  prepareRevenueOrderData: any[];
  handleAIInsight: (title: string, type: string) => void;
  updateDashboardState: (updates: any) => void;
  graphColors: { primary: string; secondary: string; tertiary: string };
  getMetricCardColor: (index?: number) => string;
  navigate: (path: string) => void;
}

const CHART_COLORS = ['#48B79B', '#6B8E71', '#8B7355', '#A66B6B', '#7B9EA6', '#9B7B8F'];

const OverviewView: React.FC = () => {
  // Get the props from the outlet context with default values
  const context = useOutletContext<DashboardViewProps | null>();
  
  // Provide default values if context is null
  const {
    data = null,
    agents = [],
    brands = [],
    items = [],
    dashboardState = { 
      metricDisplayMode: 'full',
      barChartColors: 'blue',
      chartDesign: 'table',
      cardVariants: {},
      isEditMode: false
    },
    chartDataCache = {},
    getBarChartColors = ['#79d5e9'],
    calculateTrendFromPrevious = () => undefined,
    prepareRevenueOrderData = [],
    handleAIInsight = () => {},
    updateDashboardState = () => {},
    graphColors = { primary: '#79d5e9', secondary: '#4daeac', tertiary: '#f77d11' },
    getMetricCardColor = () => '#79d5e9',
    navigate = () => {}
  } = context || {};

  // Use colors from props instead of ColorProvider to avoid context issues
  // const colors = useColors();

  // Show loading if no data
  if (!context || !data || !data.metrics) {
    return (
      <ProgressLoader
        progress={30}
        message="Loading dashboard data..."
      />
    );
  }

  return (
    <div className="overview-container" style={{ padding: '0', width: '100%' }}>
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
          value={data?.metrics.totalRevenue || 0}
          subtitle="All channels combined"
          trend={calculateTrendFromPrevious(
            data?.metrics.totalRevenue || 0,
            (data?.metrics.totalRevenue || 0) * 0.88
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
          value={data?.metrics.totalOrders || 0}
          subtitle="Processed orders"
          trend={calculateTrendFromPrevious(
            data?.metrics.totalOrders || 0,
            (data?.metrics.totalOrders || 0) * 0.92
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
          value={data?.metrics.totalCustomers || 0}
          subtitle="Unique buyers"
          trend={calculateTrendFromPrevious(
            data?.metrics.totalCustomers || 0,
            (data?.metrics.totalCustomers || 0) * 0.95
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
          value={data?.metrics.averageOrderValue || 0}
          subtitle="Per transaction"
          trend={calculateTrendFromPrevious(
            data?.metrics.averageOrderValue || 0,
            (data?.metrics.averageOrderValue || 0) * 0.97
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
          value={data?.metrics.outstandingInvoices || 0}
          subtitle="Pending payment"
          trend={calculateTrendFromPrevious(
            data?.metrics.outstandingInvoices || 0,
            (data?.metrics.outstandingInvoices || 0) * 1.1
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
          value={data?.metrics.marketplaceOrders || 0}
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
        {dashboardState.chartDesign === 'table' ? (
          <TableCard
            id="agent-performance"
            title="Sales Team Performance"
            subtitle="Top 5 agents by revenue"
            data={agents
            .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
            .slice(0, 5)
            .map(agent => ({
                name: agent.agentName || agent.name || 'Unknown Agent',
              value: `£${Math.round(agent.totalRevenue || 0).toLocaleString()}`,
              subtext: `${agent.totalOrders || agent.orderCount || 0} orders`
            }))}
            columns={[
              { key: 'name', label: 'Agent', width: '60%' },
              { key: 'value', label: 'Revenue', align: 'right' }
            ]}
            valueColor={(value) => '#22c55e'}
            maxRows={5}
          />
        ) : (
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
        )}

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
          data={data?.orders?.slice(0, 10).map(order => ({
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
            { dataKey: 'revenue', color: graphColors.primary, name: 'Revenue', type: 'area' },
            { dataKey: 'orders', color: graphColors.secondary, name: 'Orders', type: 'line' }
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

export default OverviewView;