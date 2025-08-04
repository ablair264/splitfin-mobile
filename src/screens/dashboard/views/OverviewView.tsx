import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { theme } from '../../../theme';
import { MetricCard, TableCard, CardChart, FullGraph } from '../../../components/ui';
import { useResponsive } from '../../../hooks/useResponsive';

interface OverviewViewProps {
  data: any;
  onNavigate: (route: string) => void;
  onMetricPress?: (metricType: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  data,
  onNavigate,
  onMetricPress,
}) => {
  const { isTablet } = useResponsive();

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const renderMetricCards = () => {
    // Calculate card width based on device type
    const screenWidth = Dimensions.get('window').width;
    const contentPadding = theme.spacing[3] * 2; // padding on both sides
    const cardGap = theme.spacing[3];
    
    let cardWidth = '100%'; // Default for phones
    
    if (isTablet) {
      const availableWidth = screenWidth - theme.layout.sidebarWidth - contentPadding;
      // 3 cards per row on tablets with gaps
      const cardsPerRow = 3;
      cardWidth = (availableWidth - (cardGap * (cardsPerRow - 1))) / cardsPerRow;
    }

    // Transform revenue over time data for charts
    const revenueChartData = data?.charts?.revenueOverTime?.map((item, index) => ({
      x: index,
      y: item.value,
      date: item.date,
      value: item.value
    })) || [];

    // For orders chart, we can use the same data or order status data
    const ordersChartData = data?.charts?.ordersByStatus?.map((item, index) => ({
      x: index,
      y: item.count,
      value: item.count
    })) || [];

    // Customer growth chart data
    const customerChartData = data?.charts?.customerGrowth?.map((item, index) => ({
      x: index,
      y: item.count,
      value: item.count
    })) || [];

    // Calculate trends from actual data
    const calculateTrend = (dataArray: any[]) => {
      if (!dataArray || dataArray.length < 2) return { value: 0, isPositive: true };
      const lastValue = dataArray[dataArray.length - 1]?.value || dataArray[dataArray.length - 1]?.count || 0;
      const previousValue = dataArray[dataArray.length - 2]?.value || dataArray[dataArray.length - 2]?.count || 0;
      const percentChange = previousValue > 0 ? Math.round(((lastValue - previousValue) / previousValue) * 100) : 0;
      return { value: Math.abs(percentChange), isPositive: percentChange >= 0 };
    };

    return (
      <View style={[styles.metricsGrid, isTablet && styles.metricsGridTablet]}>
        <MetricCard
          title="TOTAL REVENUE"
          value={data?.metrics?.totalRevenue ? formatCurrency(data.metrics.totalRevenue) : '£0.0'}
          subtitle="All channels combined"
          trend={calculateTrend(data?.charts?.revenueOverTime)}
          chartType="line"
          chartData={revenueChartData.slice(-10)} // Last 10 data points
          variant="primary"
          style={StyleSheet.flatten([styles.metricCard, isTablet && { width: cardWidth }])}
          onPress={() => onNavigate('Products')}
        />
        
        <MetricCard
          title="TOTAL ORDERS"
          value={data?.metrics?.totalOrders?.toString() || '0'}
          subtitle="Processed orders"
          trend={calculateTrend(data?.charts?.ordersByStatus)}
          chartType="line"
          chartData={ordersChartData}
          variant="secondary"
          style={StyleSheet.flatten([styles.metricCard, isTablet && { width: cardWidth }])}
          onPress={() => onNavigate('Orders')}
        />
        
        <MetricCard
          title="ACTIVE CUSTOMERS"
          value={data?.metrics?.activeCustomers?.toString() || '0'}
          subtitle="Unique buyers"
          trend={calculateTrend(data?.charts?.customerGrowth)}
          chartType="line"
          chartData={customerChartData}
          variant="primary"
          style={StyleSheet.flatten([styles.metricCard, isTablet && { width: cardWidth }])}
          onPress={() => onNavigate('Customers')}
        />
        
        <MetricCard
          title="AVERAGE ORDER VALUE"
          value={data?.metrics?.avgOrderValue ? formatCurrency(data.metrics.avgOrderValue) : '£0.0'}
          subtitle="Per transaction"
          trend={calculateTrend(data?.charts?.revenueOverTime)}
          chartType="line"
          chartData={revenueChartData.slice(-10)}
          variant="primary"
          style={StyleSheet.flatten([styles.metricCard, isTablet && { width: cardWidth }])}
          onPress={() => onNavigate('Orders')}
        />
        
        <MetricCard
          title="OUTSTANDING INVOICES"
          value={data?.metrics?.outstandingInvoices ? formatCurrency(data.metrics.outstandingInvoices) : '£0.0'}
          subtitle="Pending payment"
          trend={{ value: 9, isPositive: false }}
          chartType="line"
          chartData={revenueChartData.slice(-10)}
          variant="secondary"
          style={StyleSheet.flatten([styles.metricCard, isTablet && { width: cardWidth }])}
          onPress={() => onNavigate('Invoices')}
        />
        
        <MetricCard
          title="MARKETPLACE ORDERS"
          value={data?.metrics?.marketplaceOrders?.toString() || '0'}
          subtitle="Amazon, eBay, etc"
          trend={{ value: 12, isPositive: true }}
          chartType="bar"
          chartData={ordersChartData}
          variant="tertiary"
          style={StyleSheet.flatten([styles.metricCard, isTablet && { width: cardWidth }])}
        />
      </View>
    );
  };

  const renderAdditionalComponents = () => {
    if (!data) return null;

    return (
      <View style={styles.additionalComponents}>
        {/* Brand Performance Table */}
        {data.brandPerformance && data.brandPerformance.length > 0 && (
          <TableCard
            title="Brand Performance"
            columns={[
              { key: 'brand', title: 'Brand', width: 2 },
              { key: 'revenue', title: 'Revenue', width: 1 },
              { key: 'orders', title: 'Orders', width: 1 },
              { key: 'units', title: 'Units', width: 1 },
            ]}
            data={data.brandPerformance.map((brand: any) => ({
              brand: brand.brand || 'Unknown',
              revenue: formatCurrency(brand.revenue || 0),
              orders: brand.orders || 0,
              units: brand.units || 0,
            }))}
            style={styles.componentCard}
          />
        )}

        {/* Revenue Chart */}
        {data.charts?.revenueOverTime && data.charts.revenueOverTime.length > 0 && (
          <CardChart
            title="Revenue Over Time"
            value={data.metrics?.totalRevenue ? formatCurrency(data.metrics.totalRevenue) : '£0'}
            subtitle="Last 30 days trend"
            data={data.charts.revenueOverTime.map((item: any, index: number) => ({
              x: index,
              y: (item.value / Math.max(...data.charts.revenueOverTime.map((d: any) => d.value))) * 100
            }))}
            type="line"
            color="#79d5e9"
            style={styles.componentCard}
          />
        )}

        {/* Orders by Status Chart */}
        {data.charts?.ordersByStatus && data.charts.ordersByStatus.length > 0 && (
          <FullGraph
            title="Orders by Status"
            data={data.charts.ordersByStatus.map(item => ({
              label: item.status,
              value: item.count,
            }))}
            type="donut"
            style={styles.componentCard}
          />
        )}

        {/* Recent Orders Table */}
        {data.recentOrders && data.recentOrders.length > 0 && (
          <TableCard
            title="Recent Orders"
            columns={[
              { key: 'customerName', title: 'Customer', width: 2 },
              { key: 'amount', title: 'Amount', width: 1 },
              { key: 'status', title: 'Status', width: 1 },
            ]}
            data={data.recentOrders.slice(0, 5).map((order: any) => ({
              customerName: order.customerName,
              amount: formatCurrency(order.amount),
              status: order.status,
            }))}
            style={styles.componentCard}
          />
        )}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {renderMetricCards()}
      {renderAdditionalComponents()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Ensure no white background
  },
  contentContainer: {
    padding: theme.spacing[3],
  },
  metricsGrid: {
    gap: theme.spacing[3],
  },
  metricsGridTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing[3],
  },
  metricCard: {
    marginBottom: theme.spacing[3],
    // Phone: full width
    // Tablet: 3 across max
    width: '100%',
  },
  additionalComponents: {
    marginTop: theme.spacing[4],
    gap: theme.spacing[4],
  },
  componentCard: {
    marginBottom: theme.spacing[4],
  },
});