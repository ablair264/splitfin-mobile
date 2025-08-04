import React from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useResponsive } from '../../hooks/useResponsive';
import { Text } from '../ui/Typography';

export interface NavigationItem {
  key: string;
  title: string;
  icon?: React.ReactNode;
  route: string;
  children?: NavigationItem[];
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  currentRoute: string;
  onNavigate: (route: string) => void;
  user?: {
    name: string;
    role: string;
    avatar?: string;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggle,
  currentRoute,
  onNavigate,
  user,
}) => {
  const { isTablet } = useResponsive();

  // Navigation items based on Splitfin screenshots
  const navigationItems: NavigationItem[] = [
    {
      key: 'dashboard',
      title: 'Dashboard',
      icon: <Feather name="bar-chart-2" size={20} color={theme.colors.text.accent} />,
      route: 'Dashboard',
      children: [
        { key: 'overview', title: 'Overview', route: 'Dashboard/Overview' },
        { key: 'orders', title: 'Orders', route: 'Dashboard/Orders' },
        { key: 'revenue', title: 'Revenue', route: 'Dashboard/Revenue' },
        { key: 'invoices', title: 'Invoices', route: 'Dashboard/Invoices' },
        { key: 'brands', title: 'Brands', route: 'Dashboard/Brands' },
        { key: 'forecasting', title: 'Forecasting', route: 'Dashboard/Forecasting' },
      ],
    },
    {
      key: 'customers',
      title: 'Customers',
      icon: <Feather name="users" size={20} color={theme.colors.text.accent} />,
      route: 'Customers',
      children: [
        { key: 'add-customer', title: 'Add New Customer', route: 'Customers/Add' },
        { key: 'view-customers', title: 'View All Customers', route: 'Customers/View' },
        { key: 'customer-map', title: 'Customer Map', route: 'Customers/Map' },
        { key: 'pending-approvals', title: 'Pending Approvals', route: 'Customers/Pending' },
        { key: 'account-management', title: 'Account Management', route: 'Customers/Account' },
      ],
    },
    {
      key: 'orders',
      title: 'Orders',
      icon: <Feather name="package" size={20} color={theme.colors.text.accent} />,
      route: 'Orders',
      children: [
        { key: 'new-order', title: 'New Order', route: 'Orders/New' },
        { key: 'view-orders', title: 'View All Orders', route: 'Orders/View' },
        { key: 'order-approvals', title: 'Order Approvals', route: 'Orders/Approvals' },
      ],
    },
    {
      key: 'inventory',
      title: 'Inventory',
      icon: <Feather name="clipboard" size={20} color={theme.colors.text.accent} />,
      route: 'Inventory',
      children: [
        { key: 'overview', title: 'Overview', route: 'Inventory/Overview' },
        { key: 'products', title: 'Products', route: 'Inventory/Products' },
        { key: 'couriers', title: 'Couriers', route: 'Inventory/Couriers' },
        { key: 'warehouse', title: 'Warehouse', route: 'Inventory/Warehouse' },
        { key: 'deliveries', title: 'Deliveries', route: 'Inventory/Deliveries' },
      ],
    },
    {
      key: 'live-stocklists',
      title: 'Live Stocklists',
      icon: <Feather name="trending-up" size={20} color={theme.colors.text.accent} />,
      route: 'LiveStocklists',
    },
    {
      key: 'catalogue-builder',
      title: 'Catalogue Builder',
      icon: <Feather name="book-open" size={20} color={theme.colors.text.accent} />,
      route: 'CatalogueBuilder',
    },
    {
      key: 'purchase-orders',
      title: 'Purchase Orders',
      icon: <Feather name="shopping-cart" size={20} color={theme.colors.text.accent} />,
      route: 'PurchaseOrders',
    },
    {
      key: 'agent-management',
      title: 'Agent Management',
      icon: <Feather name="user" size={20} color={theme.colors.text.accent} />,
      route: 'AgentManagement',
    },
  ];

  // Don't show sidebar on mobile
  if (!isTablet) {
    return null;
  }

  const sidebarWidth = isCollapsed ? theme.layout.sidebarCollapsedWidth : theme.layout.sidebarWidth;

  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());

  const toggleExpanded = (key: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedItems(newExpanded);
  };

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const isExpanded = expandedItems.has(item.key);
    const isActive = currentRoute.startsWith(item.route);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <View key={item.key}>
        <TouchableOpacity
          style={[
            styles.navItem,
            { paddingLeft: theme.spacing[4] + (level * theme.spacing[4]) },
            isActive && styles.activeNavItem,
          ]}
          onPress={() => {
            if (hasChildren) {
              toggleExpanded(item.key);
            } else {
              onNavigate(item.route);
            }
          }}
        >
          {item.icon && !isCollapsed && (
            <View style={styles.navIcon}>
              {item.icon}
            </View>
          )}
          
          {!isCollapsed && (
            <>
              <Text style={[styles.navText, isActive && styles.activeNavText]}>
                {item.title}
              </Text>
              {hasChildren && (
                <Text style={[styles.expandIcon, isActive && styles.activeNavText]}>
                  {isExpanded ? '−' : '+'}
                </Text>
              )}
            </>
          )}
          
          {isCollapsed && item.icon && (
            <View style={styles.collapsedIcon}>
              {item.icon}
            </View>
          )}
        </TouchableOpacity>

        {hasChildren && isExpanded && !isCollapsed && (
          <View>
            {item.children!.map((child) => renderNavigationItem(child, level + 1))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.sidebar, { width: sidebarWidth }]}>
      {/* User Profile Section */}
      {user && (
        <View style={styles.userSection}>
          {!isCollapsed ? (
            <>
              <View style={styles.userAvatar}>
                <Text style={styles.avatarText}>
                  {user.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userRole}>{user.role}</Text>
              </View>
            </>
          ) : (
            <View style={styles.collapsedUserAvatar}>
              <Text style={styles.avatarText}>
                {user.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Toggle Button */}
      <TouchableOpacity style={styles.toggleButton} onPress={onToggle}>
        <Text style={styles.toggleIcon}>
          {isCollapsed ? '→' : '←'}
        </Text>
      </TouchableOpacity>

      {/* Navigation Items */}
      <ScrollView style={styles.navigation} showsVerticalScrollIndicator={false}>
        {navigationItems.map((item) => renderNavigationItem(item))}
      </ScrollView>

      {/* Splitfin Logo */}
      <View style={styles.logoSection}>
        {!isCollapsed ? (
          <Text style={styles.logoText}>Splitfin</Text>
        ) : (
          <Text style={styles.collapsedLogo}>S</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: theme.colors.background.primary,
    borderRightWidth: theme.layout.borderWidth.thin,
    borderRightColor: theme.colors.border.primary,
    height: '100%',
  },
  userSection: {
    padding: theme.spacing[4],
    borderBottomWidth: theme.layout.borderWidth.thin,
    borderBottomColor: theme.colors.border.primary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.button.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },
  collapsedUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.button.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.bold,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...theme.textStyles.body,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  userRole: {
    ...theme.textStyles.caption,
    color: theme.colors.text.secondary,
  },
  toggleButton: {
    position: 'absolute',
    top: theme.spacing[4],
    right: -theme.spacing[3],
    width: theme.spacing[6],
    height: theme.spacing[6],
    borderRadius: theme.spacing[3],
    backgroundColor: theme.colors.background.card,
    borderWidth: theme.layout.borderWidth.thin,
    borderColor: theme.colors.border.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  toggleIcon: {
    color: theme.colors.text.primary,
    fontSize: 12,
  },
  navigation: {
    flex: 1,
    paddingTop: theme.spacing[4],
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing[3],
    paddingRight: theme.spacing[4],
  },
  activeNavItem: {
    backgroundColor: theme.colors.background.tertiary,
    borderRightWidth: 3,
    borderRightColor: theme.colors.primary[300],
  },
  navIcon: {
    marginRight: theme.spacing[3],
    width: 20,
    alignItems: 'center',
  },
  collapsedIcon: {
    width: '100%',
    alignItems: 'center',
  },
  navText: {
    ...theme.textStyles.body,
    color: theme.colors.text.primary,
    flex: 1,
  },
  activeNavText: {
    color: theme.colors.primary[300],
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  expandIcon: {
    ...theme.textStyles.body,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing[2],
  },
  logoSection: {
    padding: theme.spacing[4],
    borderTopWidth: theme.layout.borderWidth.thin,
    borderTopColor: theme.colors.border.primary,
    alignItems: 'center',
  },
  logoText: {
    ...theme.textStyles.h5,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  collapsedLogo: {
    ...theme.textStyles.h4,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
});