import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { theme } from '../../theme';
import { AppLayout } from '../../layouts/AppLayout';
import { MetricCard, Button, SearchInput, DataTable, Text } from '../../components/ui';
import { useResponsive } from '../../hooks/useResponsive';
import { useCustomers, Customer } from '../../hooks/useCustomers';
import type { TableColumn, TableAction } from '../../components/ui';


export const CustomersManagementScreen: React.FC = () => {
  const { isTablet } = useResponsive();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('customer_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  // Use real customer data
  const { 
    customers, 
    metrics, 
    loading, 
    error, 
    refreshing, 
    refresh, 
    searchCustomers 
  } = useCustomers({
    search: searchQuery,
    autoLoad: true,
  });

  const filterOptions = [
    { key: 'all', label: 'All Customers' },
    { key: 'active', label: 'Active' },
    { key: 'inactive', label: 'Inactive' },
    { key: 'new', label: 'New This Month' },
  ];

  const breadcrumbs = [
    { title: 'Home', onPress: () => console.log('Navigate to home') },
    { title: 'Customers' },
  ];

  const headerActions = [
    {
      key: 'add',
      icon: <Text style={{ color: theme.colors.text.accent }}>👤+</Text>,
      onPress: () => console.log('Add new customer'),
    },
  ];

  // Transform and filter customers data
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesSearch = !searchQuery || 
        customer.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Determine customer status based on last order date
      const now = new Date();
      const lastOrderDate = new Date(customer.last_order_date || '');
      const daysSinceLastOrder = (now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24);
      const status = daysSinceLastOrder <= 90 && customer.last_order_date ? 'Active' : 'Inactive';
      
      const matchesFilter = selectedFilter === 'all' || 
                           (selectedFilter === 'active' && status === 'Active') ||
                           (selectedFilter === 'inactive' && status === 'Inactive') ||
                           (selectedFilter === 'new' && customer.created_time && 
                            new Date(customer.created_time) >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
      
      return matchesSearch && matchesFilter;
    }).map(customer => {
      // Transform customer data for table display
      const now = new Date();
      const lastOrderDate = new Date(customer.last_order_date || '');
      const daysSinceLastOrder = (now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24);
      const status = daysSinceLastOrder <= 90 && customer.last_order_date ? 'Active' : 'Inactive';
      
      return {
        id: customer.id,
        customer: customer.customer_name || customer.company_name || 'Unknown',
        email: customer.email || 'No email',
        lastOrder: customer.last_order_date ? new Date(customer.last_order_date).toLocaleDateString('en-GB') : 'Never',
        totalOrders: customer.order_count || customer.metrics?.order_count || 0,
        totalSpent: `£${(customer.total_spent || customer.metrics?.total_spent || 0).toFixed(2)}`,
        status,
        _originalCustomer: customer,
      };
    });
  }, [customers, searchQuery, selectedFilter]);

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
      key: 'customer',
      title: 'Customer',
      sortable: true,
      flex: 2,
      render: (value, row) => (
        <View style={styles.customerInfo}>
          {row._originalCustomer?.customer_logo ? (
            <Image 
              source={{ uri: row._originalCustomer.customer_logo }} 
              style={styles.customerLogo}
            />
          ) : (
            <View style={styles.customerLogoPlaceholder}>
              <Text style={styles.customerLogoText}>
                {value.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.customerTextContainer}>
            <Text style={styles.customerName}>{value}</Text>
            <Text style={styles.customerEmail}>{row.email}</Text>
          </View>
        </View>
      ),
    },
    {
      key: 'lastOrder',
      title: 'Last Order',
      sortable: true,
      align: 'center',
    },
    {
      key: 'totalOrders',
      title: 'Orders',
      sortable: true,
      align: 'center',
    },
    {
      key: 'totalSpent',
      title: 'Total Spent',
      sortable: true,
      align: 'right',
    },
    {
      key: 'status',
      title: 'Status',
      align: 'center',
      render: (value) => (
        <View style={[
          styles.statusBadge,
          value === 'Active' ? styles.statusActive : styles.statusInactive,
        ]}>
          <Text style={[
            styles.statusText,
            value === 'Active' ? styles.statusTextActive : styles.statusTextInactive,
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
      title: 'New Order',
      variant: 'primary',
      onPress: (row) => console.log('New order for:', row.customer),
    },
    {
      key: 'edit',
      title: 'View',
      variant: 'ghost',
      onPress: (row) => console.log('View customer:', row.customer),
    },
    {
      key: 'orders',
      title: 'Orders',
      variant: 'ghost',
      onPress: (row) => console.log('View orders for:', row.customer),
    },
  ];

  const renderStatsCards = () => (
    <View style={[styles.statsGrid, isTablet && styles.statsGridTablet]}>
      <MetricCard
        title="TOTAL CUSTOMERS"
        value={metrics.totalCustomers.toLocaleString()}
        subtitle="All customers"
        trend={{ value: 0, isPositive: true }}
        style={styles.statCard}
      />
      
      <MetricCard
        title="NEW CUSTOMERS"
        value={metrics.newCustomers.toLocaleString()}
        subtitle="Last 30 days"
        trend={{ 
          value: metrics.totalCustomers > 0 ? Math.round((metrics.newCustomers / metrics.totalCustomers) * 100) : 0, 
          isPositive: metrics.newCustomers > 0 
        }}
        style={styles.statCard}
      />
      
      <MetricCard
        title="ACTIVE CUSTOMERS"
        value={metrics.activeCustomers.toLocaleString()}
        subtitle="With recent orders"
        trend={{ 
          value: metrics.totalCustomers > 0 ? Math.round((metrics.activeCustomers / metrics.totalCustomers) * 100) : 0, 
          isPositive: metrics.activeCustomers > 0 
        }}
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
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.filterOption,
              selectedFilter === option.key && styles.filterOptionActive,
            ]}
            onPress={() => setSelectedFilter(option.key)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === option.key && styles.filterTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <Button
        title="Add New Customer"
        variant="primary"
        size="medium"
        onPress={() => console.log('Add new customer')}
        style={styles.addButton}
      />
    </View>
  );

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
      {/* Stats Cards */}
      {renderStatsCards()}

      {/* Search and Filters */}
      <SearchInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search customers by name, company, or email..."
        onClear={handleClearSearch}
      />

      {/* Loading and Error States */}
      {loading && customers.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[300]} />
          <Text style={styles.loadingText}>Loading customers...</Text>
        </View>
      )}

      {error && customers.length === 0 && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="Retry"
            variant="primary"
            onPress={refresh}
            style={styles.retryButton}
          />
        </View>
      )}

      {renderFilters()}

      {/* Customers Table */}
      <DataTable
        columns={columns}
        data={filteredCustomers}
        actions={actions}
        onSort={handleSort}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        emptyMessage="No customers found"
        style={styles.table}
      />

      {/* Pagination */}
      <View style={styles.paginationContainer}>
        <Text style={styles.paginationText}>
          Showing {filteredCustomers.length} of {customers.length} customers
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing[4],
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
    color: 'rgba(255, 255, 255, 0.7)', // Force white with opacity
  },
  filterTextActive: {
    color: theme.colors.primary[300],
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  addButton: {
    minWidth: 150,
  },
  table: {
    marginBottom: theme.spacing[4],
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerLogo: {
    width: 32,
    height: 32,
    borderRadius: theme.layout.borderRadius.sm,
    marginRight: theme.spacing[3],
  },
  customerLogoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: theme.layout.borderRadius.sm,
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },
  customerLogoText: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.primary[400],
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  customerTextContainer: {
    flex: 1,
  },
  customerName: {
    ...theme.textStyles.body,
    color: '#FFFFFF', // Force white text
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  customerEmail: {
    ...theme.textStyles.caption,
    color: 'rgba(255, 255, 255, 0.6)', // Force white with opacity
    marginTop: theme.spacing[1],
  },
  statusBadge: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.layout.borderRadius.sm,
    alignSelf: 'center',
    minWidth: 60,
    alignItems: 'center',
  },
  statusActive: {
    backgroundColor: theme.colors.status.success + '20',
  },
  statusInactive: {
    backgroundColor: theme.colors.status.error + '20',
  },
  statusText: {
    ...theme.textStyles.caption,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  statusTextActive: {
    color: theme.colors.status.success,
  },
  statusTextInactive: {
    color: theme.colors.status.error,
  },
  paginationContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing[4],
  },
  paginationText: {
    ...theme.textStyles.bodySmall,
    color: 'rgba(255, 255, 255, 0.6)', // Force white with opacity
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing[8],
  },
  loadingText: {
    ...theme.textStyles.body,
    color: 'rgba(255, 255, 255, 0.8)', // Force white with opacity
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