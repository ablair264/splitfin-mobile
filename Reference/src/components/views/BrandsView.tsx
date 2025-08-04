import React from 'react';
import { useOutletContext } from 'react-router-dom';
import CardChart from '../shared/CardChart';
import MetricIcon from '../shared/MetricIcon';
import CardTable from '../shared/CardTable';
import FullGraph from '../shared/FullGraph';

interface BrandsViewProps {
  data: any;
  brands: any[];
  dashboardState: any;
}

const CHART_COLORS = ['#48B79B', '#6B8E71', '#8B7355', '#A66B6B', '#7B9EA6', '#9B7B8F'];

const BrandsView: React.FC = () => {
  const {
    data,
    brands,
    dashboardState
  } = useOutletContext<BrandsViewProps>();
  const availableViews = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'orders', label: 'Orders', icon: '📦' },
    { id: 'revenue', label: 'Revenue', icon: '💰' },
    { id: 'invoices', label: 'Invoices', icon: '📄' },
    { id: 'brands', label: 'Brands', icon: '🏷️' },
    { id: 'forecasting', label: 'Forecasting', icon: '🔮' }
  ];

  // Calculate brand growth trend data
  const brandGrowthTrendData = React.useMemo(() => {
    if (!data?.orders) return [];
    
    const trendData = data.orders.reduce((acc, order) => {
      const date = new Date(order.date).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date };
        brands.forEach(b => { acc[date][b.name] = 0; });
      }
      order.line_items?.forEach(item => {
        if (item.brand && acc[date][item.brand] !== undefined) {
          acc[date][item.brand] += Math.round(item.total || item.item_total || 0);
        }
      });
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(trendData)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data?.orders, brands]);

  return (
    <div className="brands-view">


      {/* Brand Overview Charts */}
      <div className="card-charts-grid" style={{ marginBottom: '32px' }}>
        <CardChart
          id="brand-revenue-pie"
          title="Revenue by Brand"
          subtitle="Total revenue distribution"
          data={brands.length > 0 ? brands.map(brand => ({
            name: brand.name || 'Unknown',
            value: Math.round(brand.revenue || 0)
          })) : [{ name: 'No brand data', value: 1 }]}
          type="pie"
          dataKey="value"
          colors={CHART_COLORS}
          showLegend={true}
          height={300}
        />
        
        <CardChart
          id="brand-orders-bar"
          title="Orders by Brand"
          subtitle="Total orders per brand"
          data={brands.length > 0 ? brands.map(brand => ({
            name: brand.name || 'Unknown',
            value: Math.round(brand.orderCount || 0)
          })) : [{ name: 'No brand data', value: 0 }]}
          type="bar"
          dataKey="value"
          colors={['#79d5e9']}
          height={300}
        />
      </div>

      {/* Brand Performance Table */}
      <CardTable
        id="brand-performance-table"
        title="Brand Performance Metrics"
        subtitle="Complete brand analysis"
        columns={[
          { key: 'name', label: 'Brand', width: '25%' },
          { 
            key: 'revenue', 
            label: 'Revenue', 
            align: 'right',
            format: (value) => `£${Math.round(value).toLocaleString()}`
          },
          { key: 'orderCount', label: 'Orders', align: 'right' },
          { key: 'quantity', label: 'Units', align: 'right' },
          { 
            key: 'avgOrderValue', 
            label: 'Avg Order', 
            align: 'right',
            format: (value) => `£${Math.round(value).toLocaleString()}`
          },
          { 
            key: 'marketShare', 
            label: 'Market Share', 
            align: 'right',
            format: (value) => `${Math.round(value)}%`
          }
        ]}
        data={brands.length > 0 ? brands.map(brand => ({
          ...brand,
          avgOrderValue: brand.orderCount > 0 ? brand.revenue / brand.orderCount : 0,
          marketShare: (brand.revenue / (data?.metrics.totalRevenue || 1)) * 100
        })) : []}
        maxRows={20}
        showIndex={true}
        highlightRows={true}
      />

      {/* Brand Growth Trend */}
      <FullGraph
        id="brand-growth-trend"
        title="Brand Revenue Trends"
        subtitle="Revenue growth over time by brand"
        data={brandGrowthTrendData}
        type="composed"
        lines={brands.slice(0, 5).map((brand, index) => ({
          dataKey: brand.name,
          color: CHART_COLORS[index % CHART_COLORS.length],
          name: brand.name,
          type: 'line'
        }))}
        showBrush={true}
        showGrid={true}
        showLegend={true}
        height={400}
      />
    </div>
  );
};

export default BrandsView;