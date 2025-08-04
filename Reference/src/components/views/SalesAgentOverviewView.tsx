import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import MetricCard from '../shared/MetricCard';
import CardChart from '../shared/CardChart';
import CardTable from '../shared/CardTable';
import FullGraph from '../shared/FullGraph';
import { TableCard } from '../shared';
import MetricIcon from '../shared/MetricIcon';
import { ProgressLoader } from '../ProgressLoader';
import AIInsightModal, { AIInsight } from '../AIInsightModal';

interface SalesAgentViewProps {
  data: any;
  dashboardState: any;
  chartDataCache: any;
  getBarChartColors: string[];
  getMetricCardColor: (index?: number) => string;
  calculateTrendFromPrevious: (current: number, previous: number) => any;
  handleAIInsight: (title: string, type: string) => void;
  updateDashboardState: (updates: any) => void;
  navigate: (path: string) => void;
  graphColors: { primary: string; secondary: string; tertiary: string };
  EmptyState: React.FC<{ message: string }>;
}

// Helper function to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const SalesAgentOverviewView: React.FC = () => {
  const context = useOutletContext<SalesAgentViewProps | null>();
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;
  
  // AI modal state
  const [aiModalState, setAiModalState] = useState({
    isOpen: false,
    cardTitle: '',
    insight: null as AIInsight | null,
    isLoading: false
  });
  
  // Provide default values if context is null
  const {
    data = null,
    dashboardState = { 
      metricDisplayMode: 'full',
      barChartColors: 'primary',
      chartDesign: 'table',
      cardVariants: {},
      isEditMode: false
    },
    chartDataCache = {},
    getBarChartColors = ['#79d5e9'],
    calculateTrendFromPrevious = () => undefined,
    handleAIInsight = () => {},
    updateDashboardState = () => {},
    graphColors = { primary: '#79d5e9', secondary: '#4daeac', tertiary: '#f77d11' },
    getMetricCardColor = () => '#79d5e9',
    navigate = () => {},
    EmptyState
  } = context || {};

  // Function to fetch AI insights from server
  const fetchAIInsight = async (cardType: string, cardData: any) => {
    try {
      // Get auth token if available
      const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      const response = await fetch('/api/ai-insights/card-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          cardType,
          cardData,
          fullDashboardData: data // Changed to match server expectation
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AI insights');
      }

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      return null;
    }
  };

  // Override the handleAIInsight function with our implementation
  const handleAIInsightInternal = async (title: string, type: string) => {
    // Open modal in loading state
    setAiModalState({
      isOpen: true,
      cardTitle: title,
      insight: null,
      isLoading: true
    });

    // Prepare card data based on type
    let cardData = {};
    switch (type) {
      case 'totalOrders':
        cardData = {
          current: data.metrics.totalOrders || 0,
          previous: data.metrics.prevTotalOrders || 0,
          orders: data.metrics.totalOrders || 0,
          orderCount: data.metrics.totalOrders || 0,
          count: data.metrics.totalOrders || 0
        };
        break;
      case 'totalRevenue':
        cardData = {
          current: data.metrics.totalRevenue || 0,
          previous: data.metrics.prevTotalRevenue || 0,
          revenue: data.metrics.totalRevenue || 0
        };
        break;
      case 'totalCommission':
        cardData = {
          current: totalCommission,
          previous: data.metrics.prevTotalCommission || 0,
          commission: totalCommission
        };
        break;
      case 'averageOrderValue':
        cardData = {
          current: averageOrderValue,
          previous: data.metrics.prevAverageOrderValue || 0,
          aov: averageOrderValue
        };
        break;
      case 'ordersShipped':
        cardData = {
          current: data.metrics.ordersShipped || 0,
          previous: data.metrics.prevOrdersShipped || 0,
          shipped: data.metrics.ordersShipped || 0
        };
        break;
      case 'newCustomers':
        cardData = {
          current: data.metrics.newCustomers || 0,
          previous: data.metrics.prevNewCustomers || 0,
          newCustomers: data.metrics.newCustomers || 0
        };
        break;
      default:
        cardData = { current: 0, previous: 0 };
    }

    // Fetch AI insight
    const insight = await fetchAIInsight(type, cardData);

    // Update modal with result
    setAiModalState({
      isOpen: true,
      cardTitle: title,
      insight: insight,
      isLoading: false
    });
  };

  // Show loading if no data
  if (!context || !data || !data.metrics) {
    return (
      <ProgressLoader
        progress={30}
        message="Loading dashboard data..."
      />
    );
  }

  // Get data from metrics
  const topCustomers = data.customers || [];
  const topItems = data.metrics.topItems || [];
  const averageOrderValue = data.metrics.averageOrderValue || 0;
  const totalCommission = data.metrics.totalCommission || 0;

  // Prepare data for charts
  const topCustomersByValueData = topCustomers
    .slice()
    .sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
    .slice(0, 5)
    .map(customer => ({
      name: customer.customer_name || 'Unknown Customer',
      value: customer.total_spent || 0,
      orderCount: customer.order_count || 0
    }));

  const topCustomersByOrderData = topCustomers
    .slice()
    .sort((a, b) => (b.order_count || 0) - (a.order_count || 0))
    .slice(0, 5)
    .map(customer => ({
      name: customer.customer_name || 'Unknown Customer',
      value: customer.order_count || 0,
      revenue: customer.total_spent || 0
    }));

  // Prepare top items data
  const topItemsData = topItems
    .slice(0, 5)
    .map(item => ({
      name: item.item_name || item.name || 'Unknown Item',
      value: item.revenue || 0,
      quantity: item.quantity || 0,
      sku: item.sku || ''
    }));

  // Mock customer segment data (would come from enhanced counters)
  const customerSegmentData = [
    { name: 'New', value: 15, color: '#79d5e9' },
    { name: 'Low', value: 35, color: '#4daeac' },
    { name: 'Medium', value: 30, color: '#61bc8e' },
    { name: 'High', value: 20, color: '#fbbf24' }
  ];

  // Get all orders for the table
  const allOrders = data.orders || [];
  
  // Calculate pagination
  const totalPages = Math.ceil(allOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const currentOrders = allOrders.slice(startIndex, endIndex);

  return (
    <div className="overview-container" style={{ padding: '0', width: '100%' }}>
      {/* Primary Metrics Grid - 3x2 Layout */}
      <div className="metrics-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <MetricCard
          id="totalOrdersCount"
          title="Total Orders"
          value={data.metrics.totalOrders || 0}
          subtitle="Orders in period"
          trend={calculateTrendFromPrevious(
            data.metrics.totalOrders || 0,
            data.metrics.prevTotalOrders || 0
          )}
          chartData={chartDataCache.orders}
          format="number"
          displayMode={dashboardState.metricDisplayMode}
          design={dashboardState.cardVariants.totalOrders}
          onClick={() => navigate('/dashboard/orders')}
          onOptionsClick={() => handleAIInsightInternal('Total Orders', 'totalOrders')}
          onVariantChange={dashboardState.isEditMode ? (variant) => {
            updateDashboardState({ 
              cardVariants: { ...dashboardState.cardVariants, totalOrders: variant }
            });
          } : undefined}
          icon={dashboardState.metricDisplayMode === 'compact' ? <MetricIcon name="shopping-cart" size={24} /> : undefined}
          color={getMetricCardColor(0)}
        />
        
        <MetricCard
          id="totalRevenue"
          title="Total Revenue"
          value={data.metrics.totalRevenue || 0}
          subtitle="Sales in period"
          trend={calculateTrendFromPrevious(
            data.metrics.totalRevenue || 0,
            data.metrics.prevTotalRevenue || 0
          )}
          chartData={chartDataCache.revenue}
          format="currency"
          displayMode={dashboardState.metricDisplayMode}
          design={dashboardState.cardVariants.totalRevenue}
          onClick={() => navigate('/dashboard/orders')}
          onOptionsClick={() => handleAIInsightInternal('Total Revenue', 'totalRevenue')}
          onVariantChange={dashboardState.isEditMode ? (variant) => {
            updateDashboardState({ 
              cardVariants: { ...dashboardState.cardVariants, totalRevenue: variant }
            });
          } : undefined}
          icon={dashboardState.metricDisplayMode === 'compact' ? <MetricIcon name="dollar-sign" size={24} /> : undefined}
          color={getMetricCardColor(1)}
        />

        <MetricCard
          id="totalCommission"
          title="Commission Earned"
          value={totalCommission}
          subtitle="12.5% of revenue"
          trend={calculateTrendFromPrevious(
            totalCommission,
            data.metrics.prevTotalCommission || 0
          )}
          chartData={chartDataCache.commission}
          format="currency"
          displayMode={dashboardState.metricDisplayMode}
          design={dashboardState.cardVariants.totalCommission}
          onOptionsClick={() => handleAIInsightInternal('Commission Earned', 'totalCommission')}
          onVariantChange={dashboardState.isEditMode ? (variant) => {
            updateDashboardState({ 
              cardVariants: { ...dashboardState.cardVariants, totalCommission: variant }
            });
          } : undefined}
          icon={dashboardState.metricDisplayMode === 'compact' ? <MetricIcon name="trending-up" size={24} /> : undefined}
          color={getMetricCardColor(2)}
        />
        
        <MetricCard
          id="avgOrderValue"
          title="Average Order Value"
          value={averageOrderValue}
          subtitle="Per order"
          trend={calculateTrendFromPrevious(
            averageOrderValue,
            data.metrics.prevAverageOrderValue || 0
          )}
          chartData={chartDataCache.avgOrder}
          format="currency"
          displayMode={dashboardState.metricDisplayMode}
          design={dashboardState.cardVariants.avgOrderValue}
          onOptionsClick={() => handleAIInsightInternal('Average Order Value', 'averageOrderValue')}
          onVariantChange={dashboardState.isEditMode ? (variant) => {
            updateDashboardState({ 
              cardVariants: { ...dashboardState.cardVariants, avgOrderValue: variant }
            });
          } : undefined}
          icon={dashboardState.metricDisplayMode === 'compact' ? <MetricIcon name="bar-chart" size={24} /> : undefined}
          color={getMetricCardColor(3)}
        />
        
        <MetricCard
          id="ordersShipped"
          title="Orders Shipped"
          value={data.metrics.ordersShipped || 0}
          subtitle="Completed deliveries"
          trend={calculateTrendFromPrevious(
            data.metrics.ordersShipped || 0,
            data.metrics.prevOrdersShipped || 0
          )}
          format="number"
          displayMode={dashboardState.metricDisplayMode}
          design={dashboardState.cardVariants.ordersShipped}
          onOptionsClick={() => handleAIInsightInternal('Orders Shipped', 'ordersShipped')}
          onVariantChange={dashboardState.isEditMode ? (variant) => {
            updateDashboardState({ 
              cardVariants: { ...dashboardState.cardVariants, ordersShipped: variant }
            });
          } : undefined}
          icon={dashboardState.metricDisplayMode === 'compact' ? <MetricIcon name="truck" size={24} /> : undefined}
          color={getMetricCardColor(4)}
        />
        
        <MetricCard
          id="newCustomers"
          title="New Customers"
          value={data.metrics.newCustomers || 0}
          subtitle="First-time buyers"
          trend={calculateTrendFromPrevious(
            data.metrics.newCustomers || 0,
            data.metrics.prevNewCustomers || 0
          )}
          format="number"
          displayMode={dashboardState.metricDisplayMode}
          design={dashboardState.cardVariants.newCustomers}
          onOptionsClick={() => handleAIInsightInternal('New Customers', 'newCustomers')}
          onVariantChange={dashboardState.isEditMode ? (variant) => {
            updateDashboardState({ 
              cardVariants: { ...dashboardState.cardVariants, newCustomers: variant }
            });
          } : undefined}
          icon={dashboardState.metricDisplayMode === 'compact' ? <MetricIcon name="user-plus" size={24} /> : undefined}
          color={getMetricCardColor(5)}
        />
      </div>

      {/* Performance Charts Row */}
      <div className="card-charts-grid" style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px',
        marginBottom: '24px' 
      }}>
        {/* Top Products Performance */}
        {dashboardState.chartDesign === 'table' ? (
          <TableCard
            id="top-products"
            title="Top 5 Products"
            subtitle="Best selling items"
            data={topItemsData.map(item => ({
              name: item.name,
              value: formatCurrency(item.value),
              subtext: `${item.quantity} units • SKU: ${item.sku}`
            }))}
            columns={[
              { key: 'name', label: 'Product', width: '60%' },
              { key: 'value', label: 'Revenue', align: 'right' }
            ]}
            valueColor={(value) => '#22c55e'}
            maxRows={5}
          />
        ) : (
          <CardChart
            id="top-products"
            title="Top 5 Products"
            subtitle="Best selling items"
            data={topItemsData}
            type={dashboardState.chartDesign === 'pie-with-legend' ? 'pie' : 'bar'}
            dataKey="value"
            colors={getBarChartColors}
            design={dashboardState.chartDesign}
            height={280}
            showLegend={dashboardState.chartDesign === 'pie-with-legend'}
          />
        )}

        {/* Customer Segments */}
        <CardChart
          id="customer-segments"
          title="Customer Segments"
          subtitle="Distribution by value"
          data={customerSegmentData}
          type="donut"
          dataKey="value"
          colors={customerSegmentData.map(s => s.color)}
          showLegend={true}
          height={280}
        />
      </div>

      {/* Customer Performance Row */}
      <div className="card-charts-grid" style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px',
        marginBottom: '24px' 
      }}>
        {dashboardState.chartDesign === 'table' ? (
          <TableCard
            id="top-customers-value"
            title="Top Customers by Revenue"
            subtitle="Highest value customers"
            data={topCustomersByValueData.map(customer => ({
              name: customer.name,
              value: formatCurrency(customer.value),
              subtext: `${customer.orderCount} orders`
            }))}
            columns={[
              { key: 'name', label: 'Customer', width: '60%' },
              { key: 'value', label: 'Total Value', align: 'right' }
            ]}
            valueColor={(value) => '#22c55e'}
            maxRows={5}
          />
        ) : (
          <CardChart
            id="top-customers-value"
            title="Top Customers by Revenue"
            subtitle="Highest value customers"
            data={topCustomersByValueData}
            type="bar"
            dataKey="value"
            colors={getBarChartColors}
            design={dashboardState.chartDesign}
            height={280}
          />
        )}

        {dashboardState.chartDesign === 'table' ? (
          <TableCard
            id="top-customers-orders"
            title="Top Customers by Orders"
            subtitle="Most frequent customers"
            data={topCustomersByOrderData.map(customer => ({
              name: customer.name,
              value: `${customer.value} orders`,
              subtext: formatCurrency(customer.revenue)
            }))}
            columns={[
              { key: 'name', label: 'Customer', width: '60%' },
              { key: 'value', label: 'Orders', align: 'right' }
            ]}
            valueColor={(value) => '#22c55e'}
            maxRows={5}
          />
        ) : (
          <CardChart
            id="top-customers-orders"
            title="Top Customers by Orders"
            subtitle="Most frequent customers"
            data={topCustomersByOrderData}
            type="bar"
            dataKey="value"
            colors={getBarChartColors}
            design={dashboardState.chartDesign}
            height={280}
          />
        )}
      </div>

      {/* Full Width Trend Graph */}
      <div style={{ marginBottom: '24px' }}>
        <FullGraph
          id="revenue-trend"
          title="Revenue & Order Trends"
          subtitle="Daily performance over the selected period"
          data={chartDataCache.revenue || []}
          type="composed"
          lines={[
            {
              dataKey: 'value',
              color: graphColors.primary,
              name: 'Revenue',
              type: 'area',
              format: 'currency'
            },
            {
              dataKey: 'orders',
              color: graphColors.secondary,
              name: 'Order Count',
              type: 'line',
              yAxisId: 'right',
              format: 'number'
            }
          ]}
          showBrush={true}
          showLegend={true}
          height={350}
        />
      </div>

      {/* Recent Orders Table */}
      <div className="card-table-container">
        <CardTable
          id="recent-orders"
          title="Recent Orders"
          subtitle="Latest customer orders"
          columns={[
            { 
              key: 'salesorder_number', 
              label: 'Order #', 
              width: '15%' 
            },
            { 
              key: 'customer_name', 
              label: 'Customer',
              width: '30%',
              format: (value) => value || 'Unknown'
            },
            { 
              key: 'date', 
              label: 'Date',
              width: '20%',
              format: (value) => {
                if (!value) return 'N/A';
                try {
                  return new Date(value).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  });
                } catch {
                  return value;
                }
              }
            },
            { 
              key: 'status', 
              label: 'Status',
              width: '15%',
              format: (value) => value || 'pending'
            },
            { 
              key: 'total', 
              label: 'Total', 
              align: 'right',
              width: '20%',
              format: (value) => formatCurrency(value || 0)
            }
          ]}
          data={currentOrders.map(order => ({
            ...order,
            customer_name: order.company_name || order.customer_name || 'Unknown',
            date: order.date || order.created_time
          }))}
          maxRows={10}
          onRowClick={(row) => navigate(`/order/${row.salesorder_id || row.id}`)}
          onViewAll={() => navigate('/dashboard/orders')}
          showIndex={false}
          highlightRows={true}
        />
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginTop: '16px',
            paddingBottom: '16px'
          }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '4px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                background: currentPage === 1 ? 'var(--background-secondary)' : 'var(--background-primary)',
                color: currentPage === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Previous
            </button>
            
            <span style={{
              padding: '0 16px',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem'
            }}>
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '4px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                background: currentPage === totalPages ? 'var(--background-secondary)' : 'var(--background-primary)',
                color: currentPage === totalPages ? 'var(--text-tertiary)' : 'var(--text-primary)',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* AI Insight Modal */}
      <AIInsightModal
        isOpen={aiModalState.isOpen}
        onClose={() => setAiModalState({ ...aiModalState, isOpen: false })}
        cardTitle={aiModalState.cardTitle}
        insight={aiModalState.insight}
        isLoading={aiModalState.isLoading}
      />
    </div>
  );
};

export default SalesAgentOverviewView;