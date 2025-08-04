import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { theme } from '../../theme';
import { AppLayout } from '../../layouts/AppLayout';
import { MetricCard, Button, Text } from '../../components/ui';
import { useResponsive } from '../../hooks/useResponsive';
import { useDashboard } from '../../hooks/useDashboard';

// Mock data matching Splitfin screenshots
const mockDashboardData = {
  totalRevenue: {
    value: '£67,068',
    subtitle: 'All channels combined',
    trend: { value: 14, isPositive: true },
  },
  totalOrders: {
    value: '236',
    subtitle: 'Processed orders',
    trend: { value: 9, isPositive: true },
  },
  activeCustomers: {
    value: '1,467',
    subtitle: 'Unique buyers',
    trend: { value: 5, isPositive: true },
  },
  avgOrderValue: {
    value: '£284',
    subtitle: 'Per transaction',
    trend: { value: 3, isPositive: true },
  },
  outstandingInvoices: {
    value: '£24,049',
    subtitle: 'Pending payment',
    trend: { value: 9, isPositive: false },
  },
  marketplaceOrders: {
    value: '161',
    subtitle: 'Amazon, eBay, etc',
    trend: { value: 12, isPositive: true },
  },
};

const timeFrameOptions = [
  { key: 'last30', label: 'Last 30 Days' },
  { key: 'last7', label: 'Last 7 Days' },
  { key: 'last90', label: 'Last 90 Days' },
  { key: 'thisMonth', label: 'This Month' },
];

export const DashboardOverviewScreen: React.FC = () => {
  const { isTablet } = useResponsive();
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('30_days');
  const { data, loading, error, refreshing, refresh } = useDashboard(selectedTimeFrame);

  const handleRefresh = () => {
    refresh();
  };

  const handleEdit = () => {
    console.log('Edit dashboard');
  };

  const breadcrumbs = [
    { title: 'Home', onPress: () => console.log('Navigate to home') },
    { title: 'Dashboard' },
    { title: 'Overview' },
  ];

  const headerActions = [
    {
      key: 'refresh',
      icon: <Text style={{ color: theme.colors.text.accent }}>🔄</Text>,
      onPress: handleRefresh,
    },
    {
      key: 'edit',
      icon: <Text style={{ color: theme.colors.text.accent }}>✏️</Text>,
      onPress: handleEdit,
    },
  ];

  const renderTimeFrameSelector = () => (
    <View style={styles.timeFrameContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.timeFrameScroll}
      >
        {timeFrameOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.timeFrameOption,
              selectedTimeFrame === option.key && styles.timeFrameOptionActive,
            ]}
            onPress={() => setSelectedTimeFrame(option.key)}
          >
            <Text
              style={[
                styles.timeFrameText,
                selectedTimeFrame === option.key && styles.timeFrameTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.actionButtons}>
        <Button
          title="Edit"
          variant="ghost"
          size="small"
          onPress={handleEdit}
        />
        <Button
          title="Refresh"
          variant="primary"
          size="small"
          onPress={handleRefresh}
          loading={refreshing}
        />
      </View>
    </View>
  );

  const renderMetricCards = () => {
    const cardWidth = isTablet 
      ? (Dimensions.get('window').width - (theme.layout.sidebarWidth + theme.spacing[8])) / 3 - theme.spacing[4]
      : '100%';

    return (
      <View style={[styles.metricsGrid, isTablet && styles.metricsGridTablet]}>
        <MetricCard
          title="TOTAL REVENUE"
          value={mockDashboardData.totalRevenue.value}
          subtitle={mockDashboardData.totalRevenue.subtitle}
          trend={mockDashboardData.totalRevenue.trend}
          style={[styles.metricCard, isTablet && { width: cardWidth }]}
          onPress={() => console.log('Navigate to revenue details')}
        />
        
        <MetricCard
          title="TOTAL ORDERS"
          value={mockDashboardData.totalOrders.value}
          subtitle={mockDashboardData.totalOrders.subtitle}
          trend={mockDashboardData.totalOrders.trend}
          style={[styles.metricCard, isTablet && { width: cardWidth }]}
          onPress={() => console.log('Navigate to orders')}
        />
        
        <MetricCard
          title="ACTIVE CUSTOMERS"
          value={mockDashboardData.activeCustomers.value}
          subtitle={mockDashboardData.activeCustomers.subtitle}
          trend={mockDashboardData.activeCustomers.trend}
          style={[styles.metricCard, isTablet && { width: cardWidth }]}
          onPress={() => console.log('Navigate to customers')}
        />
        
        <MetricCard
          title="AVG ORDER VALUE"
          value={mockDashboardData.avgOrderValue.value}
          subtitle={mockDashboardData.avgOrderValue.subtitle}
          trend={mockDashboardData.avgOrderValue.trend}
          style={[styles.metricCard, isTablet && { width: cardWidth }]}
        />
        
        <MetricCard
          title="OUTSTANDING INVOICES"
          value={mockDashboardData.outstandingInvoices.value}
          subtitle={mockDashboardData.outstandingInvoices.subtitle}
          trend={mockDashboardData.outstandingInvoices.trend}
          style={[styles.metricCard, isTablet && { width: cardWidth }]}
          onPress={() => console.log('Navigate to invoices')}
        />
        
        <MetricCard
          title="MARKETPLACE ORDERS"
          value={mockDashboardData.marketplaceOrders.value}
          subtitle={mockDashboardData.marketplaceOrders.subtitle}
          trend={mockDashboardData.marketplaceOrders.trend}
          style={[styles.metricCard, isTablet && { width: cardWidth }]}
        />
      </View>
    );
  };

  return (
    <AppLayout
      title="Dashboard"
      subtitle="Brand Manager Overview"
      breadcrumbs={breadcrumbs}
      headerActions={headerActions}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Time Frame Selector */}
        {renderTimeFrameSelector()}

        {/* Metrics Grid */}
        {renderMetricCards()}

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <Button
              title="New Order"
              variant="primary"
              style={styles.quickActionButton}
              onPress={() => console.log('Navigate to new order')}
            />
            <Button
              title="Add Customer"
              variant="secondary"
              style={styles.quickActionButton}
              onPress={() => console.log('Navigate to add customer')}
            />
            <Button
              title="View Reports"
              variant="outline"
              style={styles.quickActionButton}
              onPress={() => console.log('Navigate to reports')}
            />
            <Button
              title="Inventory"
              variant="ghost"
              style={styles.quickActionButton}
              onPress={() => console.log('Navigate to inventory')}
            />
          </View>
        </View>
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing[4],
  },
  timeFrameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[6],
  },
  timeFrameScroll: {
    paddingRight: theme.spacing[4],
  },
  timeFrameOption: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.layout.borderRadius.md,
    backgroundColor: theme.colors.background.card,
    borderWidth: theme.layout.borderWidth.thin,
    borderColor: theme.colors.border.primary,
    marginRight: theme.spacing[2],
  },
  timeFrameOptionActive: {
    backgroundColor: theme.colors.background.tertiary,
    borderColor: theme.colors.primary[300],
  },
  timeFrameText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  timeFrameTextActive: {
    color: theme.colors.primary[300],
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  metricsGrid: {
    gap: theme.spacing[4],
    marginBottom: theme.spacing[6],
  },
  metricsGridTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    marginBottom: theme.spacing[4],
  },
  quickActionsContainer: {
    marginTop: theme.spacing[4],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[4],
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[3],
  },
  quickActionButton: {
    flex: 1,
    minWidth: '45%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing[8],
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[4],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing[8],
    paddingHorizontal: theme.spacing[4],
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.status.error,
    textAlign: 'center',
    marginBottom: theme.spacing[4],
  },
  retryButton: {
    minWidth: 120,
  },
});