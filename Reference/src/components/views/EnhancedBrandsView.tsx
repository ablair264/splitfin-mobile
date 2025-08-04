import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useBrandsData } from '../../hooks/useViewData';
import { ProgressLoader } from '../ProgressLoader';
import MetricCard from '../shared/MetricCard';
import CardChart from '../shared/CardChart';
import CardTable from '../shared/CardTable';
import FullGraph from '../shared/FullGraph';

interface DashboardContext {
  userId: string;
  dashboardState: any;
  updateDashboardState: (updates: any) => void;
  navigate: (path: string) => void;
}

const EnhancedBrandsView: React.FC = () => {
  const context = useOutletContext<DashboardContext>();
  const { userId, dashboardState, navigate } = context;
  
  // Local state for selected brand
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  // Load brands data
  const { 
    data, 
    loading, 
    error, 
    refresh, 
    isStale, 
    isCached 
  } = useBrandsData({
    userId,
    dateRange: dashboardState.dateRange,
    useCache: true,
    staleWhileRevalidate: true
  });

  // Process data for display
  const processedData = useMemo(() => {
    if (!data) return null;

    const { brands = [], orders = [], metrics = {} } = data;

    // Calculate brand trends over time
    const brandTrends = calculateBrandTrends(orders);
    
    // Get top items by brand
    const topItemsByBrand = calculateTopItemsByBrand(orders);
    
    // Calculate brand performance metrics
    const brandMetrics = brands.map(brand => ({
      ...brand,
      avgOrderValue: brand.orderCount > 0 ? brand.revenue / brand.orderCount : 0,
      avgQuantityPerOrder: brand.orderCount > 0 ? brand.quantity / brand.orderCount : 0,
      marketShare: metrics.totalRevenue > 0 ? (brand.revenue / metrics.totalRevenue) * 100 : 0
    }));

    // Get selected brand details
    const selectedBrandData = selectedBrand 
      ? {
          brand: brandMetrics.find(b => b.name === selectedBrand),
          items: topItemsByBrand[selectedBrand] || [],
          trends: brandTrends.filter(t => t.brand === selectedBrand)
        }
      : null;

    // Calculate brand growth rates
    const brandGrowth = calculateBrandGrowth(brandTrends);

    return {
      brands: brandMetrics,
      brandTrends,
      topItemsByBrand,
      selectedBrandData,
      brandGrowth,
      metrics,
      totalBrands: brands.length
    };
  }, [data, selectedBrand]);

  // Refresh handler
  React.useEffect(() => {
    const handleRefresh = () => refresh();
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, [refresh]);

  if (loading && !isStale) {
    return <ProgressLoader progress={50} message="Loading brands data..." />;
  }

  if (error && !processedData) {
    return (
      <div className="error-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h3>Unable to load brands data</h3>
        <p>{error}</p>
        <button onClick={refresh} className="retry-button">Try Again</button>
      </div>
    );
  }

  if (!processedData) {
    return <ProgressLoader progress={30} message="Processing brands data..." />;
  }

  const { 
    brands, 
    brandTrends, 
    topItemsByBrand, 
    selectedBrandData,
    brandGrowth,
    metrics,
    totalBrands
  } = processedData;

  return (
    <div className="brands-view-container" style={{ position: 'relative' }}>
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

      {/* Summary Metrics */}
      <div className="metrics-row" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <MetricCard
          id="total-brands"
          title="Total Brands"
          value={totalBrands}
          subtitle="Active brands"
          format="number"
          displayMode={dashboardState.metricDisplayMode}
        />
        <MetricCard
          id="total-revenue"
          title="Total Revenue"
          value={metrics.totalRevenue || 0}
          subtitle="All brands combined"
          format="currency"
          displayMode={dashboardState.metricDisplayMode}
        />
        <MetricCard
          id="top-brand-revenue"
          title="Top Brand Revenue"
          value={brands[0]?.revenue || 0}
          subtitle={brands[0]?.name || 'N/A'}
          format="currency"
          displayMode={dashboardState.metricDisplayMode}
        />
        <MetricCard
          id="avg-brand-revenue"
          title="Avg Brand Revenue"
          value={totalBrands > 0 ? (metrics.totalRevenue || 0) / totalBrands : 0}
          subtitle="Per brand average"
          format="currency"
          displayMode={dashboardState.metricDisplayMode}
        />
      </div>

      {/* Brand Performance Chart */}
      <CardChart
        id="brand-performance"
        title="Brand Performance"
        subtitle="Revenue by brand"
        data={brands.slice(0, 15).map(brand => ({
          name: brand.name,
          revenue: Math.round(brand.revenue)
        }))}
        type="bar"
        dataKey="revenue"
        height={400}
        colors={[dashboardState.graphColors.primary]}
        onClick={() => {/* Handled via table row click */}}
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
          id="brand-market-share"
          title="Market Share"
          subtitle="Revenue distribution"
          data={brands.slice(0, 8).map(brand => ({
            name: brand.name,
            value: Math.round(brand.marketShare * 100) / 100
          }))}
          type="pie"
          dataKey="value"
          showLegend={true}
          height={300}
        />
        
        <CardChart
          id="brand-growth"
          title="Brand Growth"
          subtitle="Month-over-month change"
          data={brandGrowth.slice(0, 10)}
          type="bar"
          design="horizontal-bars"
          dataKey="growth"
          height={300}
          colors={brandGrowth.map(item => item.growth >= 0 ? '#10b981' : '#ef4444')}
        />
      </div>

      {/* Brand Details Table */}
      <CardTable
        id="brand-details"
        title="Brand Details"
        subtitle="Performance metrics by brand"
        columns={[
          { key: 'name', label: 'Brand', width: '25%' },
          { 
            key: 'revenue', 
            label: 'Revenue', 
            align: 'right',
            format: (value) => `£${Math.round(value).toLocaleString()}`
          },
          { key: 'orderCount', label: 'Orders', align: 'right' },
          { key: 'quantity', label: 'Units Sold', align: 'right' },
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
            format: (value) => `${value.toFixed(1)}%`
          }
        ]}
        data={brands}
        onRowClick={(row) => setSelectedBrand(row.name)}
        maxRows={20}
        showIndex={true}
        highlightRows={true}
      />

      {/* Selected Brand Details */}
      {selectedBrandData && (
        <div className="selected-brand-details" style={{
          marginTop: '32px',
          padding: '24px',
          background: '#f9fafb',
          borderRadius: '12px'
        }}>
          <h3 style={{ marginBottom: '16px' }}>
            {selectedBrand} Details
            <button
              onClick={() => setSelectedBrand(null)}
              style={{
                float: 'right',
                padding: '4px 12px',
                borderRadius: '4px',
                border: '1px solid #e5e7eb',
                background: '#fff',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </h3>
          
          {/* Brand Trend Chart */}
          <FullGraph
            id="selected-brand-trend"
            title={`${selectedBrand} Revenue Trend`}
            subtitle="Daily revenue over time"
            data={calculateDailyBrandRevenue(selectedBrandData.trends)}
            type="line"
            lines={[
              { dataKey: 'revenue', color: dashboardState.graphColors.primary, name: 'Revenue' }
            ]}
            height={300}
          />
          
          {/* Top Items for Selected Brand */}
          <CardTable
            id="brand-top-items"
            title={`Top Items - ${selectedBrand}`}
            subtitle="Best selling products"
            columns={[
              { key: 'name', label: 'Product', width: '40%' },
              { key: 'sku', label: 'SKU', width: '20%' },
              { key: 'quantity', label: 'Units Sold', align: 'right' },
              { 
                key: 'revenue', 
                label: 'Revenue', 
                align: 'right',
                format: (value) => `£${Math.round(value).toLocaleString()}`
              }
            ]}
            data={selectedBrandData.items.slice(0, 10)}
            maxRows={10}
          />
        </div>
      )}

      {/* Brand Trends Over Time */}
      <FullGraph
        id="brand-trends"
        title="Brand Trends Over Time"
        subtitle="Top 5 brands revenue trends"
        data={aggregateBrandTrends(brandTrends, brands.slice(0, 5).map(b => b.name))}
        type="line"
        lines={brands.slice(0, 5).map((brand, index) => ({
          dataKey: brand.name,
          color: [
            dashboardState.graphColors.primary,
            dashboardState.graphColors.secondary,
            dashboardState.graphColors.tertiary,
            '#FF9F00',
            '#C96868'
          ][index],
          name: brand.name
        }))}
        height={400}
        showLegend={true}
        showBrush={true}
      />
    </div>
  );
};

// Helper functions
function calculateBrandTrends(orders: any[]) {
  const trendMap = new Map();
  
  orders.forEach(order => {
    const date = new Date(order.date).toISOString().split('T')[0];
    
    if (order.line_items) {
      order.line_items.forEach(item => {
        const brand = item.brand_normalized || item.brand || 'Unknown';
        const key = `${brand}-${date}`;
        
        if (!trendMap.has(key)) {
          trendMap.set(key, {
            brand,
            date,
            revenue: 0,
            quantity: 0,
            orders: 0
          });
        }
        
        const trend = trendMap.get(key);
        trend.revenue += item.total || item.item_total || 0;
        trend.quantity += item.quantity || 0;
        trend.orders += 1;
      });
    }
  });
  
  return Array.from(trendMap.values());
}

function calculateTopItemsByBrand(orders: any[]) {
  const brandItemMap: Record<string, Map<string, any>> = {};
  
  orders.forEach(order => {
    if (order.line_items) {
      order.line_items.forEach(item => {
        const brand = item.brand_normalized || item.brand || 'Unknown';
        
        if (!brandItemMap[brand]) {
          brandItemMap[brand] = new Map();
        }
        
        const itemId = item.item_id || item.sku || item.name;
        if (!brandItemMap[brand].has(itemId)) {
          brandItemMap[brand].set(itemId, {
            id: itemId,
            name: item.name || item.item_name || 'Unknown',
            sku: item.sku || '',
            quantity: 0,
            revenue: 0
          });
        }
        
        const brandItem = brandItemMap[brand].get(itemId);
        brandItem.quantity += item.quantity || 0;
        brandItem.revenue += item.total || item.item_total || 0;
      });
    }
  });
  
  // Convert to sorted arrays
  const result: Record<string, any[]> = {};
  Object.entries(brandItemMap).forEach(([brand, itemsMap]) => {
    result[brand] = Array.from(itemsMap.values())
      .sort((a, b) => b.revenue - a.revenue);
  });
  
  return result;
}

function calculateBrandGrowth(trends: any[]) {
  // Group by brand and month
  const monthlyData: Record<string, Record<string, number>> = {};
  
  trends.forEach(trend => {
    const month = trend.date.substring(0, 7); // YYYY-MM
    if (!monthlyData[trend.brand]) {
      monthlyData[trend.brand] = {};
    }
    if (!monthlyData[trend.brand][month]) {
      monthlyData[trend.brand][month] = 0;
    }
    monthlyData[trend.brand][month] += trend.revenue;
  });
  
  // Calculate growth
  const growthData = [];
  Object.entries(monthlyData).forEach(([brand, months]) => {
    const sortedMonths = Object.keys(months).sort();
    if (sortedMonths.length >= 2) {
      const lastMonth = months[sortedMonths[sortedMonths.length - 1]];
      const prevMonth = months[sortedMonths[sortedMonths.length - 2]];
      const growth = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0;
      
      growthData.push({
        name: brand,
        growth: Math.round(growth * 10) / 10
      });
    }
  });
  
  return growthData.sort((a, b) => b.growth - a.growth);
}

function calculateDailyBrandRevenue(trends: any[]) {
  const dailyMap = new Map();
  
  trends.forEach(trend => {
    const date = new Date(trend.date).toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit' 
    });
    
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { date, revenue: 0 });
    }
    
    dailyMap.get(date).revenue += trend.revenue;
  });
  
  return Array.from(dailyMap.values()).sort((a, b) => {
    const [dayA, monthA] = a.date.split('/');
    const [dayB, monthB] = b.date.split('/');
    return new Date(`${monthA}/${dayA}`).getTime() - new Date(`${monthB}/${dayB}`).getTime();
  });
}

function aggregateBrandTrends(trends: any[], brandNames: string[]) {
  const dateMap = new Map();
  
  // Get all unique dates
  trends.forEach(trend => {
    if (brandNames.includes(trend.brand)) {
      const date = new Date(trend.date).toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: '2-digit' 
      });
      
      if (!dateMap.has(date)) {
        const dataPoint: any = { date };
        brandNames.forEach(brand => {
          dataPoint[brand] = 0;
        });
        dateMap.set(date, dataPoint);
      }
      
      dateMap.get(date)[trend.brand] += trend.revenue;
    }
  });
  
  return Array.from(dateMap.values()).sort((a, b) => {
    const [dayA, monthA] = a.date.split('/');
    const [dayB, monthB] = b.date.split('/');
    return new Date(`${monthA}/${dayA}`).getTime() - new Date(`${monthB}/${dayB}`).getTime();
  });
}

export default EnhancedBrandsView;