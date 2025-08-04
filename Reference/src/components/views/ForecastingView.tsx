import React from 'react';
import { useOutletContext } from 'react-router-dom';
import MetricCard from '../shared/MetricCard';
import FullGraph from '../shared/FullGraph';
import MetricIcon from '../shared/MetricIcon';

interface ForecastingViewProps {
  data: any;
  brands: any[];
  agents: any[];
  dashboardState: any;
  getMetricCardColor: (index?: number) => string;
}

const ForecastingView: React.FC = () => {
  const {
    data,
    brands,
    agents,
    dashboardState,
    getMetricCardColor
  } = useOutletContext<ForecastingViewProps>();

  // Generate forecast data
  const forecastData = React.useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      actual: i < 15 ? (data?.metrics.totalRevenue || 0) / 30 + Math.random() * 1000 : null,
      predicted: (data?.metrics.totalRevenue || 0) / 30 + Math.random() * 1500,
      lower: (data?.metrics.totalRevenue || 0) / 30 - 500 + Math.random() * 500,
      upper: (data?.metrics.totalRevenue || 0) / 30 + 500 + Math.random() * 2000
    }));
  }, [data?.metrics.totalRevenue]);

  return (
    <div className="forecasting-view">
      <div className="forecasting-grid">
        <div className="forecast-card">
          <h3>Next 30 Days Forecast</h3>
          <div className="forecast-metrics">
            <MetricCard
              id="predictedRevenue"
              title="Predicted Revenue"
              value={(data?.metrics.totalRevenue || 0) * 1.12}
              subtitle="Based on current trends"
              format="currency"
              displayMode="compact"
              icon={dashboardState.metricDisplayMode === 'compact' ? <MetricIcon name="trending-up" size={24} /> : undefined}
              cardIndex={0}
            />
            <MetricCard
              id="expectedOrders"
              title="Expected Orders"
              value={Math.round((data?.metrics.totalOrders || 0) * 1.08)}
              subtitle="8% growth projected"
              format="number"
              displayMode="compact"
              icon={dashboardState.metricDisplayMode === 'compact' ? <MetricIcon name="arrow-up" size={24} /> : undefined}
              cardIndex={1}
            />
          </div>
        </div>

        <FullGraph
          id="revenue-projection"
          title="Revenue Projection"
          subtitle="Forecast based on historical trends"
          data={forecastData}
          type="composed"
          lines={[
            { dataKey: 'actual', color: '#79d5e9', name: 'Actual' },
            { dataKey: 'predicted', color: '#fbbf24', name: 'Predicted' },
            { dataKey: 'lower', color: '#4daeac', name: 'Lower Bound', type: 'area' },
            { dataKey: 'upper', color: '#4daeac', name: 'Upper Bound', type: 'area' }
          ]}
          showGrid={true}
          showLegend={true}
          height={400}
        />

        <div className="insights-container">
          <h3>Key Insights & Recommendations</h3>
          <div className="insights-grid">
            <div className="insight-card">
              <MetricIcon name="info" size={20} />
              <h4>Growth Opportunity</h4>
              <p>Based on current trends, {brands[0]?.name || 'your top brand'} shows potential for 15% growth in the next quarter.</p>
            </div>
            <div className="insight-card">
              <MetricIcon name="alert-circle" size={20} />
              <h4>Attention Required</h4>
              <p>{agents.slice(-1)[0]?.agentName || 'Some agents'} may need additional support to meet targets.</p>
            </div>
            <div className="insight-card">
              <MetricIcon name="target" size={20} />
              <h4>Focus Area</h4>
              <p>Increasing average order value by 10% could yield £{((data?.metrics.totalRevenue || 0) * 0.1).toLocaleString()} additional revenue.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForecastingView;