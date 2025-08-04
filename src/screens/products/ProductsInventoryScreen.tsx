import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../theme';
// Removed AppLayout import since using MasterLayout globally
import { Button, SearchInput, DataTable, Card, Text } from '../../components/ui';
import { useResponsive } from '../../hooks/useResponsive';
import { useItems } from '../../hooks/useItems';
import type { TableColumn, TableAction } from '../../components/ui';


const stockFilterOptions = [
  { key: 'all', label: 'All' },
  { key: 'in-stock', label: 'In Stock' },
  { key: 'out-of-stock', label: 'Out of Stock' },
  { key: 'low-stock', label: 'Low Stock' },
];

const brandFilterOptions = [
  { key: 'all-brands', label: 'All Brands' },
  { key: 'blomus', label: 'Blomus' },
  { key: 'elvang', label: 'Elvang' },
  { key: 'my-flame-lifestyle', label: 'My Flame Lifestyle' },
  { key: 'rader', label: 'Rader' },
  { key: 'remember', label: 'Remember' },
  { key: 'relaxound', label: 'Relaxound' },
];

export const ProductsInventoryScreen: React.FC = () => {
  const { isTablet } = useResponsive();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('item_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [stockFilter, setStockFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all-brands');
  
  const { items, loading, error, refreshing, refresh } = useItems({
    search: searchQuery,
    autoLoad: true,
  });

  const breadcrumbs = [
    { title: 'Home', onPress: () => console.log('Navigate to home') },
    { title: 'Inventory' },
    { title: 'Products' },
  ];

  const headerActions = [
    {
      key: 'add',
      icon: <Feather name="plus" size={20} color={theme.colors.text.accent} />,
      onPress: () => console.log('Add new product'),
    },
  ];

  // Transform items data and apply filters
  const filteredProducts = useMemo(() => {
    return items.filter((item) => {
      // Search filter
      const matchesSearch = !searchQuery || 
        item.item_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Stock filter
      const stockLevel = item.stock_on_hand || 0;
      const status = stockLevel === 0 ? 'Out of Stock' : stockLevel < 50 ? 'Low Stock' : 'In Stock';
      const matchesStockFilter = stockFilter === 'all' || 
                                (stockFilter === 'in-stock' && status === 'In Stock') ||
                                (stockFilter === 'low-stock' && status === 'Low Stock') ||
                                (stockFilter === 'out-of-stock' && status === 'Out of Stock');
      
      // Brand filter
      const itemBrand = (item.brand || item.manufacturer || 'unknown').toLowerCase();
      const matchesBrandFilter = brandFilter === 'all-brands' || 
                                itemBrand.includes(brandFilter.replace('-', ' '));
      
      return matchesSearch && matchesStockFilter && matchesBrandFilter;
    }).map(item => {
      // Transform item to match table format
      const stockLevel = item.stock_on_hand || 0;
      const status = stockLevel === 0 ? 'Out of Stock' : stockLevel < 50 ? 'Low Stock' : 'In Stock';
      
      return {
        id: item.id,
        image: item.imageUrl || null,
        productName: item.item_name || 'Unnamed Item',
        description: item.pro_desc || item.item_name || '',
        sku: item.sku || 'N/A',
        brand: item.brand || item.manufacturer || 'Unknown',
        stock: stockLevel,
        reorderLevel: 0, // You might want to add this to your items_data
        purchasePrice: `£${(item.cost_price || 0).toFixed(2)}`,
        sellingPrice: `£${(item.selling_price || item.retail_price || 0).toFixed(2)}`,
        status,
        // Keep original item data for reference
        _originalItem: item,
      };
    });
  }, [items, searchQuery, stockFilter, brandFilter]);

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  if (loading && items.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[300]} />
        <Text style={styles.loadingText}>Loading inventory...</Text>
      </View>
    );
  }

  if (error && items.length === 0) {
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

  // Table columns configuration
  const columns: TableColumn[] = [
    {
      key: 'image',
      title: 'Image',
      width: 60,
      render: (value, row) => (
        <View style={styles.productImageContainer}>
          {value ? (
            <Image source={{ uri: value }} style={styles.productImage} />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Feather name="package" size={32} color={theme.colors.text.tertiary} />
            </View>
          )}
        </View>
      ),
    },
    {
      key: 'productName',
      title: 'Product Name',
      sortable: true,
      flex: 3,
      render: (value, row) => (
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{value}</Text>
          <Text style={styles.productDescription} numberOfLines={1}>{row.description}</Text>
        </View>
      ),
    },
    {
      key: 'sku',
      title: 'SKU',
      sortable: true,
      flex: 1,
    },
    {
      key: 'brand',
      title: 'Brand',
      sortable: true,
      flex: 1,
    },
    {
      key: 'stock',
      title: 'Stock',
      sortable: true,
      align: 'center',
      render: (value, row) => (
        <View style={styles.stockContainer}>
          <Text style={styles.stockValue}>{value}</Text>
          <Text style={styles.stockReorder}>Reorder: {row.reorderLevel}</Text>
        </View>
      ),
    },
    {
      key: 'purchasePrice',
      title: 'Purchase Price',
      sortable: true,
      align: 'right',
    },
    {
      key: 'sellingPrice',
      title: 'Selling Price',
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
          value === 'In Stock' ? styles.statusInStock :
          value === 'Low Stock' ? styles.statusLowStock : styles.statusOutOfStock,
        ]}>
          <Text style={[
            styles.statusText,
            value === 'In Stock' ? styles.statusTextInStock :
            value === 'Low Stock' ? styles.statusTextLowStock : styles.statusTextOutOfStock,
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
      onPress: (row) => console.log('View product:', row.productName),
    },
    {
      key: 'edit',
      title: 'Edit',
      variant: 'ghost',
      onPress: (row) => console.log('Edit product:', row.productName),
    },
  ];

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      {/* Stock Status Filter */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Filter by Stock Status</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {stockFilterOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.filterOption,
                stockFilter === option.key && styles.filterOptionActive,
              ]}
              onPress={() => setStockFilter(option.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  stockFilter === option.key && styles.filterTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Brand Filter */}
      <View style={styles.filterGroup}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {brandFilterOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.filterOption,
                brandFilter === option.key && styles.filterOptionActive,
              ]}
              onPress={() => setBrandFilter(option.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  brandFilter === option.key && styles.filterTextActive,
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
          title="Add New Product"
          variant="primary"
          size="medium"
          onPress={() => console.log('Add new product')}
          style={styles.actionButton}
        />
      </View>
    </View>
  );

  const renderHeader = () => (
    <Card style={styles.headerCard}>
      <View style={styles.headerContent}>
        <View>
          <Text style={styles.headerTitle}>Products</Text>
          <Text style={styles.headerSubtitle}>Manage your inventory items</Text>
        </View>
        <View style={styles.headerStats}>
          <Text style={styles.statsText}>
            Sort by: Stock Count (Descending)
          </Text>
        </View>
      </View>
    </Card>
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
        {/* Header */}
        {renderHeader()}

        {/* Search */}
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search products by name, SKU, or description..."
          onClear={handleClearSearch}
        />

        {/* Filters */}
        {renderFilters()}

        {/* Products Table */}
        <DataTable
          columns={columns}
          data={filteredProducts}
          actions={actions}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          emptyMessage="No products found"
          style={styles.table}
        />

        {/* Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>
            Showing {filteredProducts.length} of {items.length} products
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
  filtersContainer: {
    marginBottom: theme.spacing[4],
  },
  filterGroup: {
    marginBottom: theme.spacing[3],
  },
  filterLabel: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
    fontWeight: theme.typography.fontWeight.medium,
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
  productImageContainer: {
    alignItems: 'center',
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: theme.layout.borderRadius.sm,
  },
  productImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: theme.layout.borderRadius.sm,
    backgroundColor: theme.colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImageText: {
    fontSize: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    ...theme.textStyles.body,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semiBold,
    marginBottom: theme.spacing[1],
  },
  productDescription: {
    ...theme.textStyles.caption,
    color: theme.colors.text.tertiary,
  },
  stockContainer: {
    alignItems: 'center',
  },
  stockValue: {
    ...theme.textStyles.body,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  stockReorder: {
    ...theme.textStyles.caption,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing[1],
  },
  statusBadge: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.layout.borderRadius.sm,
    alignSelf: 'center',
    minWidth: 70,
    alignItems: 'center',
  },
  statusInStock: {
    backgroundColor: theme.colors.status.success + '20',
  },
  statusLowStock: {
    backgroundColor: theme.colors.status.warning + '20',
  },
  statusOutOfStock: {
    backgroundColor: theme.colors.status.error + '20',
  },
  statusText: {
    ...theme.textStyles.caption,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  statusTextInStock: {
    color: theme.colors.status.success,
  },
  statusTextLowStock: {
    color: theme.colors.status.warning,
  },
  statusTextOutOfStock: {
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

