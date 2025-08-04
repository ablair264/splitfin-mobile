import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Text } from '../ui/Typography';
import { useResponsive } from '../../hooks/useResponsive';

interface TabItem {
  key: string;
  title: string;
  icon: React.ReactNode;
  route: string;
}

interface TabBarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ currentRoute, onNavigate }) => {
  const { isTablet } = useResponsive();

  // Don't show tab bar on tablet (sidebar is used instead)
  if (isTablet) {
    return null;
  }

  // Main navigation tabs for mobile (simplified from full sidebar)
  const tabItems: TabItem[] = [
    {
      key: 'dashboard',
      title: 'Dashboard',
      icon: <Feather name="bar-chart-2" size={20} color={theme.colors.text.tertiary} />,
      route: 'Dashboard',
    },
    {
      key: 'customers',
      title: 'Customers',
      icon: <Feather name="users" size={20} color={theme.colors.text.tertiary} />,
      route: 'Customers',
    },
    {
      key: 'orders',
      title: 'Orders',
      icon: <Feather name="shopping-cart" size={20} color={theme.colors.text.tertiary} />,
      route: 'Orders',
    },
    {
      key: 'inventory',
      title: 'Products',
      icon: <Feather name="package" size={20} color={theme.colors.text.tertiary} />,
      route: 'Inventory',
    },
    {
      key: 'more',
      title: 'More',
      icon: <Feather name="more-horizontal" size={20} color={theme.colors.text.tertiary} />,
      route: 'More',
    },
  ];

  const renderTabItem = (item: TabItem) => {
    const isActive = currentRoute.startsWith(item.route);

    return (
      <TouchableOpacity
        key={item.key}
        style={styles.tabItem}
        onPress={() => onNavigate(item.route)}
        activeOpacity={0.7}
      >
        <View style={[styles.tabIconContainer, isActive && styles.activeTabIconContainer]}>
          {item.icon}
        </View>
        <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
          {item.title}
        </Text>
        {isActive && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabBar}>
        {tabItems.map(renderTabItem)}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    borderTopWidth: theme.layout.borderWidth.thin,
    borderTopColor: theme.colors.border.primary,
  },
  tabBar: {
    flexDirection: 'row',
    height: theme.layout.tabBarHeight,
    backgroundColor: theme.colors.background.primary,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[2],
    position: 'relative',
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[1],
  },
  activeTabIconContainer: {
    // Could add background color or other styling
  },
  tabIcon: {
    fontSize: 20,
    color: theme.colors.text.tertiary,
  },
  tabLabel: {
    ...theme.textStyles.caption,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  activeTabLabel: {
    color: theme.colors.primary[300],
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: theme.colors.primary[300],
  },
});