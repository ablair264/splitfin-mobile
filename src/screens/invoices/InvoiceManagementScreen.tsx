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
import { useInvoices, Invoice } from '../../hooks/useInvoices';
import type { TableColumn, TableAction } from '../../components/ui';


const statusFilterOptions = [
  { key: 'all', label: 'All Status' },
  { key: 'paid', label: 'Paid' },
  { key: 'outstanding', label: 'Outstanding' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'draft', label: 'Draft' },
];

const dateFilterOptions = [
  { key: 'all', label: 'All Time' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'quarter', label: 'This Quarter' },
];

export const InvoiceManagementScreen: React.FC = () => {
  const { isTablet } = useResponsive();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  
  // Use real invoices data
  const { 
    invoices, 
    metrics, 
    loading, 
    error, 
    refreshing, 
    refresh, 
    getInvoiceStatus,
    isOverdue 
  } = useInvoices({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchQuery,
    autoLoad: true,
  });

  const breadcrumbs = [
    { title: 'Home', onPress: () => console.log('Navigate to home') },
    { title: 'Invoices' },
  ];

  const headerActions = [
    {
      key: 'add',
      icon: <Text style={{ color: theme.colors.text.accent }}>📄+</Text>,
      onPress: () => console.log('Create new invoice'),
    },
  ];

  // Transform and filter invoices data
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch = !searchQuery || 
        invoice.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const invoiceStatus = getInvoiceStatus(invoice);
      const matchesStatusFilter = statusFilter === 'all' || 
                                 (statusFilter === 'paid' && invoiceStatus === 'paid') ||
                                 (statusFilter === 'outstanding' && invoiceStatus === 'outstanding') ||
                                 (statusFilter === 'overdue' && invoiceStatus === 'overdue') ||
                                 (statusFilter === 'draft' && invoiceStatus === 'draft');
      
      // Date filter implementation
      let matchesDateFilter = true;
      if (dateFilter !== 'all') {
        const invoiceDate = new Date(invoice.date);
        const now = new Date();
        
        switch (dateFilter) {
          case 'today':
            matchesDateFilter = invoiceDate.toDateString() === now.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDateFilter = invoiceDate >= weekAgo;
            break;
          case 'month':
            matchesDateFilter = invoiceDate.getMonth() === now.getMonth() && 
                              invoiceDate.getFullYear() === now.getFullYear();
            break;
          case 'quarter':
            const quarter = Math.floor(now.getMonth() / 3);
            const invoiceQuarter = Math.floor(invoiceDate.getMonth() / 3);
            matchesDateFilter = invoiceQuarter === quarter && 
                              invoiceDate.getFullYear() === now.getFullYear();
            break;
        }
      }
      
      return matchesSearch && matchesStatusFilter && matchesDateFilter;
    }).map(invoice => {
      // Transform invoice data for table display
      const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`;
      const formatDate = (dateString: string) => {
        try {
          return new Date(dateString).toLocaleDateString('en-GB');
        } catch {
          return 'Invalid Date';
        }
      };

      const invoiceStatus = getInvoiceStatus(invoice);
      const invoiceIsOverdue = isOverdue(invoice.due_date);
      
      return {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number || 'N/A',
        customer: invoice.customer_name || invoice.company_name || 'Unknown',
        date: formatDate(invoice.date),
        dueDate: formatDate(invoice.due_date),
        amount: formatCurrency(invoice.total || 0),
        balance: formatCurrency(invoice.balance || 0),
        status: invoiceStatus.charAt(0).toUpperCase() + invoiceStatus.slice(1),
        isOverdue: invoiceIsOverdue,
        _originalInvoice: invoice,
      };
    });
  }, [invoices, searchQuery, statusFilter, dateFilter, getInvoiceStatus, isOverdue]);

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
      key: 'invoiceNumber',
      title: 'Invoice #',
      sortable: true,
      flex: 1,
      render: (value, row) => (
        <TouchableOpacity onPress={() => console.log('View invoice:', value)}>
          <Text style={[styles.invoiceNumber, row.isOverdue && styles.overdueText]}>
            {value}
          </Text>
        </TouchableOpacity>
      ),
    },
    {
      key: 'customer',
      title: 'Customer',
      sortable: true,
      flex: 2,
      render: (value, row) => (
        <Text style={[styles.customerName, row.isOverdue && styles.overdueText]}>
          {value}
        </Text>
      ),
    },
    {
      key: 'date',
      title: 'Date',
      sortable: true,
      align: 'center',
      render: (value, row) => (
        <Text style={[styles.dateText, row.isOverdue && styles.overdueText]}>
          {value}
        </Text>
      ),
    },
    {
      key: 'dueDate',
      title: 'Due Date',
      sortable: true,
      align: 'center',
      render: (value, row) => (
        <View style={styles.dueDateContainer}>
          <Text style={[styles.dateText, row.isOverdue && styles.overdueText]}>
            {value}
          </Text>
          {row.isOverdue && (
            <Text style={styles.overdueLabel}>Overdue</Text>
          )}
        </View>
      ),
    },
    {
      key: 'amount',
      title: 'Amount',
      sortable: true,
      align: 'right',
      render: (value, row) => (
        <Text style={[styles.amountText, row.isOverdue && styles.overdueText]}>
          {value}
        </Text>
      ),
    },
    {
      key: 'balance',
      title: 'Balance',
      sortable: true,
      align: 'right',
      render: (value, row) => (
        <Text style={[
          styles.balanceText,
          value === '£0.00' ? styles.paidBalance : styles.outstandingBalance,
          row.isOverdue && styles.overdueText,
        ]}>
          {value}
        </Text>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      align: 'center',
      render: (value, row) => (
        <View style={[
          styles.statusBadge,
          value === 'Paid' ? styles.statusPaid :
          value === 'Outstanding' ? styles.statusOutstanding : styles.statusOverdue,
        ]}>
          <Text style={[
            styles.statusText,
            value === 'Paid' ? styles.statusTextPaid :
            value === 'Outstanding' ? styles.statusTextOutstanding : styles.statusTextOverdue,
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
      onPress: (row) => console.log('View invoice:', row.invoiceNumber),
    },
    {
      key: 'customer',
      title: 'Customer',
      variant: 'ghost',
      onPress: (row) => console.log('View customer:', row.customer),
    },
    {
      key: 'download',
      title: 'Download',
      variant: 'ghost',
      onPress: (row) => console.log('Download invoice:', row.invoiceNumber),
    },
  ];

  const renderStatsCards = () => (
    <View style={[styles.statsGrid, isTablet && styles.statsGridTablet]}>
      <MetricCard
        title="TOTAL INVOICES"
        value={metrics.totalInvoices.toLocaleString()}
        subtitle="All invoices"
        trend={{ value: 0, isPositive: true }}
        style={styles.statCard}
      />
      
      <MetricCard
        title="TOTAL VALUE"
        value={`£${metrics.totalValue.toLocaleString()}`}
        subtitle="Sum of all invoices"
        trend={{ value: 0, isPositive: true }}
        style={styles.statCard}
      />
      
      <MetricCard
        title="OUTSTANDING"
        value={`£${metrics.outstandingValue.toLocaleString()}`}
        subtitle="Unpaid invoices"
        trend={{ value: 0, isPositive: false }}
        style={styles.statCard}
      />
      
      <MetricCard
        title="OVERDUE"
        value={metrics.overdueInvoices.toLocaleString()}
        subtitle="Past due date"
        trend={{ 
          value: metrics.totalInvoices > 0 ? Math.round((metrics.overdueInvoices / metrics.totalInvoices) * 100) : 0, 
          isPositive: false 
        }}
        style={styles.statCard}
      />
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      {/* Status Filter */}
      <View style={styles.filterGroup}>
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
                statusFilter === option.key && styles.filterOptionActive,
              ]}
              onPress={() => setStatusFilter(option.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  statusFilter === option.key && styles.filterTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Date Filter */}
      <View style={styles.filterGroup}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {dateFilterOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.filterOption,
                dateFilter === option.key && styles.filterOptionActive,
              ]}
              onPress={() => setDateFilter(option.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  dateFilter === option.key && styles.filterTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Actions */}
      <View style={styles.filterActions}>
        <Button
          title="Create Invoice"
          variant="primary"
          size="medium"
          onPress={() => console.log('Create new invoice')}
          style={styles.actionButton}
        />
      </View>
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

        {/* Search */}
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search invoices by number, customer, or company..."
          onClear={handleClearSearch}
        />

        {/* Loading and Error States */}
        {loading && invoices.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary[300]} />
            <Text style={styles.loadingText}>Loading invoices...</Text>
          </View>
        )}

        {error && invoices.length === 0 && (
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

        {/* Filters */}
        {renderFilters()}

        {/* Invoices Table */}
        <DataTable
          columns={columns}
          data={filteredInvoices}
          actions={actions}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          emptyMessage="No invoices found"
          style={styles.table}
        />

        {/* Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>
            Showing {filteredInvoices.length} of {invoices.length} invoices
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
    marginBottom: theme.spacing[4],
  },
  filterGroup: {
    marginBottom: theme.spacing[3],
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
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    minWidth: 150,
  },
  table: {
    marginBottom: theme.spacing[4],
  },
  invoiceNumber: {
    ...theme.textStyles.body,
    color: theme.colors.text.accent,
    fontWeight: theme.typography.fontWeight.semiBold,
    textDecorationLine: 'underline',
  },
  customerName: {
    ...theme.textStyles.body,
    color: theme.colors.text.primary,
  },
  dateText: {
    ...theme.textStyles.body,
    color: theme.colors.text.primary,
  },
  dueDateContainer: {
    alignItems: 'center',
  },
  overdueLabel: {
    ...theme.textStyles.caption,
    color: theme.colors.status.error,
    marginTop: theme.spacing[1],
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  amountText: {
    ...theme.textStyles.body,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  balanceText: {
    ...theme.textStyles.body,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  paidBalance: {
    color: theme.colors.status.success,
  },
  outstandingBalance: {
    color: theme.colors.status.warning,
  },
  overdueText: {
    color: theme.colors.status.error,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.layout.borderRadius.sm,
    alignSelf: 'center',
    minWidth: 80,
    alignItems: 'center',
  },
  statusPaid: {
    backgroundColor: theme.colors.status.success + '20',
  },
  statusOutstanding: {
    backgroundColor: theme.colors.status.warning + '20',
  },
  statusOverdue: {
    backgroundColor: theme.colors.status.error + '20',
  },
  statusText: {
    ...theme.textStyles.caption,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  statusTextPaid: {
    color: theme.colors.status.success,
  },
  statusTextOutstanding: {
    color: theme.colors.status.warning,
  },
  statusTextOverdue: {
    color: theme.colors.status.error,
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