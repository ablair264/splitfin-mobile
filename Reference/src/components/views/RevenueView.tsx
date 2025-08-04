import React from 'react';
import { useOutletContext } from 'react-router-dom';
import MetricCard from '../shared/MetricCard';
import CardChart from '../shared/CardChart';
import FullGraph from '../shared/FullGraph';
import MetricIcon from '../shared/MetricIcon';

interface RevenueViewProps {
  data: any;
  agents: any[];
  brands: any[];
  dashboardState: any;
  chartDataCache: any;
  calculateTrendFromPrevious: (current: number, previous: number) => any;
  handleAIInsight: (title: string, type: string) => void;
  graphColors: { primary: string; secondary: string; tertiary: string };
  getMetricCardColor: (index?: number) => string;
}

const RevenueView: React.FC = () => {
  const {
    data,
    agents,
    brands,
    dashboardState,
    chartDataCache,
    calculateTrendFromPrevious,
    handleAIInsight,
    graphColors,
    getMetricCardColor
  } = useOutletContext<RevenueViewProps>();
  const availableViews = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'orders', label: 'Orders', icon: '📦' },
    { id: 'revenue', label: 'Revenue', icon: '💰' },
    { id: 'invoices', label: 'Invoices', icon: '📄' },
    { id: 'brands', label: 'Brands', icon: '🏷️' },
    { id: 'forecasting', label: 'Forecasting', icon: '🔮' }
  ];

  // Generate daily revenue trend data
  const dailyRevenueTrendData = React.useMemo(() => {
    if (!data?.orders) return [];
    
    return data.orders
      .reduce((acc, order) => {
        const date = new Date(order.date).toLocaleDateString();
        const existing = acc.find(d => d.date === date);
        if (existing) {
          existing.revenue += order.total;
        } else {
          acc.push({ date, revenue: order.total });
        }
        return acc;
      }, [] as { date: string; revenue: number }[])
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30)
      .map(item => ({ name: item.date, value: item.revenue }));
  }, [data?.orders]);

  return (
    <div className="revenue-view">


      <div className="revenue-grid">
        <div className="revenue-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <MetricCard
            id="totalRevenueAnalysis"
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
            design="variant1"
            onOptionsClick={() => handleAIInsight('Total Revenue', 'totalRevenue')}
            icon={dashboardState.metricDisplayMode === 'compact' ? '💰' : undefined}
            color={getMetricCardColor(0)}
            cardIndex={0}
          />
          <MetricCard
            id="avgDailyRevenue"
            title="Average Daily Revenue"
            value={(data?.metrics.totalRevenue || 0) / 30}
            subtitle="Daily average"
            chartData={chartDataCache.revenue.slice(-7)}
            format="currency"
            displayMode={dashboardState.metricDisplayMode}
            design="variant2"
            icon={dashboardState.metricDisplayMode === 'compact' ? '📅' : undefined}
            color={getMetricCardColor(1)}
            cardIndex={1}
          />
          <MetricCard
            id="topRevenueDay"
            title="Top Revenue Day"
            value={Math.max(...(data?.orders?.map(o => o.total) || [0]))}
            subtitle="Highest single day"
            format="currency"
            displayMode={dashboardState.metricDisplayMode}
            design="variant3"
            icon={dashboardState.metricDisplayMode === 'compact' ? '🏆' : undefined}
            color={getMetricCardColor(2)}
            cardIndex={2}
          />
        </div>

        <FullGraph
          id="revenue-by-agent"
          title="Revenue by Agent"
          subtitle="Performance comparison across sales team"
          data={agents.map(agent => ({
            name: agent.agentName,
            revenue: Math.round(agent.totalRevenue)
          }))}
          type="bar"
          lines={[{ dataKey: 'revenue', color: graphColors.primary, name: 'Revenue' }]}
          showGrid={true}
          height={400}
        />

        <div className="card-charts-grid">
          <CardChart
            id="revenue-by-brand-bar"
            title="Revenue by Brand"
            subtitle="Brand contribution to total revenue"
            data={brands.length > 0 ? brands.map(brand => ({
              name: brand.name,
              value: brand.revenue
            })) : [{ name: 'No brand data', value: 0 }]}
            type="bar"
            dataKey="value"
            colors={['#4daeac']}
            height={300}
          />

          <CardChart
            id="daily-revenue-trend"
            title="Daily Revenue Trend"
            subtitle="Last 30 days"
            data={dailyRevenueTrendData}
            type="area"
            dataKey="value"
            colors={['#79d5e9']}
            height={300}
          />
        </div>
      </div>
    </div>
  );
};

export default RevenueView;