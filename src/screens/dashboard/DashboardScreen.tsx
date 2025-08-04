import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { theme } from '../../theme';
import { Text, Button, ProgressLoader } from '../../components/ui';
import { useDashboard } from '../../hooks/useDashboard';
import { useNavigation } from '@react-navigation/native';
import {
  OverviewView,
  RevenueView,
  BrandView,
  OrdersView,
  ForecastingView,
} from './views';

type DashboardView = 'overview' | 'revenue' | 'brands' | 'orders' | 'forecasting';

const viewTabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'brands', label: 'Brands' },
  { key: 'orders', label: 'Orders' },
  { key: 'forecasting', label: 'Forecasting' },
] as const;

const timeFrameOptions = [
  { key: '7_days', label: 'Last 7 Days' },
  { key: '30_days', label: 'Last 30 Days' },
  { key: '90_days', label: 'Last 90 Days' },
  { key: 'this_month', label: 'This Month' },
];

export default function DashboardScreen() {
  const navigation = useNavigation();
  // const { isTablet } = useResponsive(); // Removed as not used
  const [activeView, setActiveView] = useState<DashboardView>('overview');
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('30_days');
  const [isEditMode, setIsEditMode] = useState(false);
  
  const { data, loading, error, refreshing, refresh } = useDashboard(selectedTimeFrame);

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleEdit = useCallback(() => {
    setIsEditMode(!isEditMode);
  }, [isEditMode]);

  const handleNavigate = useCallback((route: string) => {
    navigation.navigate(route as never);
  }, [navigation]);

  const breadcrumbs = [
    { title: 'Home', onPress: () => console.log('Navigate to home') },
    { title: 'Dashboard' },
    { title: viewTabs.find(tab => tab.key === activeView)?.label || 'Overview' },
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

  const renderViewTabs = () => (
    <View style={styles.tabContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScroll}
      >
        {viewTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabItem,
              activeView === tab.key && styles.tabItemActive,
            ]}
            onPress={() => setActiveView(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeView === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

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
          title={isEditMode ? 'Done' : 'Edit'}
          variant={isEditMode ? 'primary' : 'ghost'}
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

  const renderActiveView = () => {
    const viewProps = {
      data,
      onNavigate: handleNavigate,
    };

    switch (activeView) {
      case 'revenue':
        return <RevenueView {...viewProps} />;
      case 'brands':
        return <BrandView {...viewProps} />;
      case 'orders':
        return <OrdersView {...viewProps} />;
      case 'forecasting':
        return <ForecastingView {...viewProps} />;
      default:
        return <OverviewView {...viewProps} />;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load dashboard data</Text>
        <Button
          title="Retry"
          variant="primary"
          onPress={handleRefresh}
          style={styles.retryButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* View Tabs */}
      {renderViewTabs()}

      {/* Time Frame Selector */}
      {renderTimeFrameSelector()}

      {/* Active View Content */}
      <View style={styles.viewContainer}>
        {renderActiveView()}
      </View>

      {/* Progress Loader */}
      <ProgressLoader
        visible={loading}
        message="Loading dashboard data..."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Ensure no white background
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
    backgroundColor: theme.colors.background.card,
  },
  tabScroll: {
    paddingHorizontal: theme.spacing[4],
  },
  tabItem: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    marginRight: theme.spacing[2],
    borderRadius: theme.layout.borderRadius.md,
  },
  tabItemActive: {
    backgroundColor: theme.colors.background.tertiary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  tabTextActive: {
    color: theme.colors.primary[300],
    fontWeight: '600',
  },
  timeFrameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing[4],
    backgroundColor: theme.colors.background.elevated,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  timeFrameScroll: {
    paddingRight: theme.spacing[4],
  },
  timeFrameOption: {
    paddingHorizontal: theme.spacing[3],
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
    fontSize: 12,
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
  viewContainer: {
    flex: 1,
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
