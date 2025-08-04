import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { theme } from '../../theme';
// Removed AppLayout import since using MasterLayout globally
import { MetricCard, Button, SearchInput, DataTable, Card, Text } from '../../components/ui';
import { useResponsive } from '../../hooks/useResponsive';
import { useOrders, SalesOrder } from '../../hooks/useOrders';
import type { TableColumn, TableAction } from '../../components/ui';

const statusFilterOptions = [
  { key: 'all', label: 'All Orders' },
  { key: 'pending', label: 'Pending' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'closed', label: 'Closed' },
];

export default function OrdersScreen() {
  const { isTablet } = useResponsive();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // Use real orders data
  const { 
    orders, 
    metrics, 
    loading, 
    error, 
    refreshing, 
    refresh, 
    searchOrders 
  } = useOrders({
    status: selectedStatus === 'all' ? undefined : selectedStatus,
    autoLoad: true,
  });

  const breadcrumbs = [
    { title: 'Home', onPress: () => console.log('Navigate to home') },
    { title: 'Orders' },
  ];

  const headerActions = [
    {
      key: 'add',
      icon: <Text style={{ color: theme.colors.text.accent }}>📋+</Text>,
      onPress: () => console.log('Create new order'),
    },
  ];

  // Transform and filter orders data
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch = !searchQuery || 
        order.salesorder_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    }).map(order => {
      // Transform order data for table display
      const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`;
      const formatDate = (dateString: string) => {
        try {
          return new Date(dateString).toLocaleDateString('en-GB');
        } catch {
          return 'Invalid Date';
        }
      };

      const getStatusDisplay = (order: SalesOrder) => {
        const status = order.current_sub_status || order.status || 'Unknown';
        return status.charAt(0).toUpperCase() + status.slice(1);
      };

      const getStatusVariant = (order: SalesOrder) => {
        const status = (order.current_sub_status || order.status || '').toLowerCase();
        if (['draft', 'sent', 'open'].includes(status)) return 'warning';
        if (['fulfilled', 'shipped'].includes(status)) return 'success';
        if (['closed', 'cancelled'].includes(status)) return 'error';
        return 'default';
      };

      return {
        id: order.id,
        orderNumber: order.salesorder_number || 'N/A',
        customer: order.customer_name || order.company_name || 'Unknown',
        date: formatDate(order.date || order.created_time),
        total: formatCurrency(order.total || 0),
        status: getStatusDisplay(order),
        statusVariant: getStatusVariant(order),
        itemsCount: order.line_items_count || 0,
        _originalOrder: order,
      };
    });
  }, [orders, searchQuery]);

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Table columns configuration
  const columns: TableColumn[] = [
    {
      key: 'orderNumber',
      title: 'Order Number',
      sortable: true,
      flex: 2,
      render: (value, row) => (
        <View>
          <Text style={styles.orderNumber}>{value}</Text>
          <Text style={styles.orderDate}>{row.date}</Text>
        </View>
      ),
    },
    {
      key: 'customer',
      title: 'Customer',
      sortable: true,
      flex: 2,
      render: (value, row) => (
        <View>
          <Text style={styles.customerName}>{value}</Text>
          <Text style={styles.itemsCount}>{row.itemsCount} items</Text>
        </View>
      ),
    },
    {
      key: 'total',
      title: 'Total',
      sortable: true,
      align: 'right',
      flex: 1,
      render: (value) => (
        <Text style={styles.orderTotal}>{value}</Text>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      align: 'center',
      render: (value, row) => (
        <View style={[
          styles.statusBadge,
          row.statusVariant === 'success' ? styles.statusSuccess :
          row.statusVariant === 'warning' ? styles.statusWarning :
          row.statusVariant === 'error' ? styles.statusError : styles.statusDefault,
        ]}>
          <Text style={[
            styles.statusText,
            row.statusVariant === 'success' ? styles.statusTextSuccess :
            row.statusVariant === 'warning' ? styles.statusTextWarning :
            row.statusVariant === 'error' ? styles.statusTextError : styles.statusTextDefault,
          ]}>
            {value}
          </Text>
        </View>
      ),
    },
  ];

  // Table actions
  const actions: TableAction[] = [
    {
      key: 'view',
      title: 'View',
      variant: 'ghost',
      onPress: (row) => console.log('View order:', row.orderNumber),
    },
    {
      key: 'edit',
      title: 'Edit',
      variant: 'ghost',
      onPress: (row) => console.log('Edit order:', row.orderNumber),
    },
    {
      key: 'invoice',
      title: 'Invoice',
      variant: 'primary',
      onPress: (row) => console.log('Create invoice for:', row.orderNumber),
    },
  ];

  const renderStatsCards = () => (
    <View style={[styles.statsGrid, isTablet && styles.statsGridTablet]}>
      <MetricCard
        title="TOTAL ORDERS"
        value={metrics.totalOrders.toLocaleString()}
        subtitle="All time"
        trend={{ value: 0, isPositive: true }}
        style={styles.statCard}
      />
      
      <MetricCard
        title="TOTAL VALUE"
        value={`£${metrics.totalValue.toLocaleString()}`}
        subtitle="All orders"
        trend={{ value: 0, isPositive: true }}
        style={styles.statCard}
      />
      
      <MetricCard
        title="AVG ORDER VALUE"
        value={`£${metrics.avgOrderValue.toFixed(0)}`}
        subtitle="Per order"
        trend={{ value: 0, isPositive: true }}
        style={styles.statCard}
      />

      <MetricCard
        title="THIS MONTH"
        value={metrics.thisMonthOrders.toLocaleString()}
        subtitle="New orders"
        trend={{ value: 0, isPositive: true }}
        style={styles.statCard}
      />
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {statusFilterOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.filterOption,
              selectedStatus === option.key && styles.filterOptionActive,
            ]}
            onPress={() => setSelectedStatus(option.key)}
          >
            <Text
              style={[
                styles.filterText,
                selectedStatus === option.key && styles.filterTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <Button
        title="New Order"
        variant="primary"
        size="medium"
        onPress={() => console.log('Create new order')}
        style={styles.addButton}
      />
    </View>
  );

  const renderHeader = () => (
    <Card style={styles.headerCard}>
      <View style={styles.headerContent}>
        <View>
          <Text style={styles.headerTitle}>Orders</Text>
          <Text style={styles.headerSubtitle}>Manage sales orders and shipments</Text>
        </View>
        <View style={styles.headerStats}>
          <Text style={styles.statsText}>
            {filteredOrders.length} orders found
          </Text>
        </View>
      </View>
    </Card>
  );

  if (loading && orders.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[300]} />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  if (error && orders.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button
          title="Retry"
          variant="primary"
          onPress={refresh}
          style={styles.retryButton}
        />
      </View>
    );
  }

  return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={theme.colors.primary[300]}
          />
        }
      >
        {/* Header */}
        {renderHeader()}

        {/* Stats Cards */}
        {renderStatsCards()}

        {/* Search */}
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search orders by number, customer, or company..."
          onClear={handleClearSearch}
        />

        {/* Filters */}
        {renderFilters()}

        {/* Orders Table */}
        <DataTable
          columns={columns}
          data={filteredOrders}
          actions={actions}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          emptyMessage="No orders found"
          style={styles.table}
        />

        {/* Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>
            Showing {filteredOrders.length} of {orders.length} orders
          </Text>
        </View>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing[4],
  },
  headerCard: {
    marginBottom: theme.spacing[4],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    ...theme.textStyles.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  headerSubtitle: {
    ...theme.textStyles.body,
    color: theme.colors.text.secondary,
  },
  headerStats: {
    alignItems: 'flex-end',
  },
  statsText: {
    ...theme.textStyles.caption,
    color: theme.colors.text.tertiary,
  },
  statsGrid: {
    gap: theme.spacing[4],
    marginBottom: theme.spacing[6],
  },
  statsGridTablet: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },
  filterScroll: {
    paddingRight: theme.spacing[4],
  },
  filterOption: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.layout.borderRadius.md,
    backgroundColor: theme.colors.background.card,
    borderWidth: theme.layout.borderWidth.thin,
    borderColor: theme.colors.border.primary,
    marginRight: theme.spacing[2],
  },
  filterOptionActive: {
    backgroundColor: theme.colors.background.tertiary,
    borderColor: theme.colors.primary[300],
  },
  filterText: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.text.secondary,
  },
  filterTextActive: {
    color: theme.colors.primary[300],
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  addButton: {
    minWidth: 120,
  },
  table: {
    marginBottom: theme.spacing[4],
  },
  orderNumber: {
    ...theme.textStyles.body,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  orderDate: {
    ...theme.textStyles.caption,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing[1],
  },
  customerName: {
    ...theme.textStyles.body,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  itemsCount: {
    ...theme.textStyles.caption,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing[1],
  },
  orderTotal: {
    ...theme.textStyles.body,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.layout.borderRadius.sm,
    alignSelf: 'center',
    minWidth: 70,
    alignItems: 'center',
  },
  statusSuccess: {
    backgroundColor: theme.colors.status.success + '20',
  },
  statusWarning: {
    backgroundColor: theme.colors.status.warning + '20',
  },
  statusError: {
    backgroundColor: theme.colors.status.error + '20',
  },
  statusDefault: {
    backgroundColor: theme.colors.text.tertiary + '20',
  },
  statusText: {
    ...theme.textStyles.caption,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  statusTextSuccess: {
    color: theme.colors.status.success,
  },
  statusTextWarning: {
    color: theme.colors.status.warning,
  },
  statusTextError: {
    color: theme.colors.status.error,
  },
  statusTextDefault: {
    color: theme.colors.text.secondary,
  },
  summaryContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing[4],
  },
  summaryText: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing[8],
  },
  loadingText: {
    ...theme.textStyles.body,
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
    ...theme.textStyles.body,
    color: theme.colors.status.error,
    textAlign: 'center',
    marginBottom: theme.spacing[4],
  },
  retryButton: {
    minWidth: 120,
  },
});