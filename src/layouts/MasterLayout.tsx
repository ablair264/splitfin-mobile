// src/layouts/MasterLayout.tsx - Safe version without problematic dependencies
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Animated,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Text, IconButton, Badge } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { auth, firestore } from '../config/firebase';
import { signOut } from '@react-native-firebase/auth';
import { doc, updateDoc } from '@react-native-firebase/firestore';

// Types
interface NavigationItem {
  id: string;
  title: string;
  icon: string;
  route: string;
  badge?: number;
  subItems?: NavigationItem[];
}

interface LayoutProps {
  children: React.ReactNode;
}

// Constants
const SIDEBAR_WIDTH = 280;
const BOTTOM_MENU_HEIGHT = 80;
const EXPANDED_MENU_HEIGHT = 300;

// Simple orientation hook using only Dimensions (no external dependencies)
const useSimpleOrientation = () => {
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = screenData;
  const orientation = width > height ? 'landscape' : 'portrait';
  const minDimension = Math.min(width, height);
  
  const isTablet = minDimension >= 768;
  const isLandscape = orientation === 'landscape';
  const isPortrait = orientation === 'portrait';
  const shouldShowSidebar = isTablet && isLandscape;
  const shouldShowBottomNav = !shouldShowSidebar;

  return {
    width,
    height,
    orientation,
    isTablet,
    isLandscape,
    isPortrait,
    shouldShowSidebar,
    shouldShowBottomNav,
  };
};

// Navigation Configuration
const getNavigationItems = (userRole: string): NavigationItem[] => {
  const baseItems: NavigationItem[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'analytics',
      route: 'Dashboard',
      subItems: [
        { id: 'dashboard-overview', title: 'Overview', icon: 'home', route: 'DashboardHome' },
        { id: 'dashboard-orders', title: 'Orders', icon: 'receipt', route: 'DashboardOrders' },
        { id: 'dashboard-revenue', title: 'Revenue', icon: 'trending-up', route: 'DashboardRevenue' },
      ]
    },
    {
      id: 'customers',
      title: 'Customers',
      icon: 'people',
      route: 'Customers',
      subItems: [
        { id: 'customers-all', title: 'All Customers', icon: 'list', route: 'CustomersList' },
        { id: 'customers-new', title: 'Add Customer', icon: 'person-add', route: 'CustomersNew' },
        { id: 'customers-map', title: 'Customer Map', icon: 'map', route: 'CustomersMap' },
      ]
    },
    {
      id: 'orders',
      title: 'Orders',
      icon: 'clipboard',
      route: 'Orders',
      subItems: [
        { id: 'orders-all', title: 'All Orders', icon: 'list', route: 'OrdersList' },
        { id: 'orders-new', title: 'New Order', icon: 'add-circle', route: 'OrdersNew' },
        { id: 'orders-pending', title: 'Pending', icon: 'time', route: 'OrdersPending', badge: 3 },
      ]
    },
    {
      id: 'inventory',
      title: 'Inventory',
      icon: 'cube',
      route: 'Inventory',
      subItems: [
        { id: 'inventory-overview', title: 'Overview', icon: 'grid', route: 'InventoryOverview' },
        { id: 'inventory-products', title: 'Products', icon: 'cube', route: 'InventoryProducts' },
        { id: 'inventory-warehouse', title: 'Warehouse', icon: 'business', route: 'InventoryWarehouse' },
      ]
    },
  ];

  if (userRole === 'brandManager') {
    baseItems.push(
      {
        id: 'live-stocklists',
        title: 'Live Stocklists',
        icon: 'list-circle',
        route: 'LiveStocklists',
        subItems: [
          { id: 'stocklist-blomus', title: 'Blomus', icon: 'cube', route: 'StocklistBlomus' },
          { id: 'stocklist-elvang', title: 'Elvang', icon: 'cube', route: 'StocklistElvang' },
          { id: 'stocklist-gefu', title: 'GEFU', icon: 'cube', route: 'StocklistGefu' },
        ]
      },
      {
        id: 'agents',
        title: 'Agent Management',
        icon: 'people-circle',
        route: 'Agents',
      },
      {
        id: 'settings',
        title: 'Settings',
        icon: 'settings',
        route: 'Settings',
        subItems: [
          { id: 'settings-general', title: 'General', icon: 'settings', route: 'SettingsGeneral' },
          { id: 'settings-profile', title: 'Profile', icon: 'person', route: 'SettingsProfile' },
          { id: 'settings-security', title: 'Security', icon: 'shield', route: 'SettingsSecurity' },
        ]
      }
    );
  }

  return baseItems;
};

// Sidebar Component
const Sidebar: React.FC<{
  navigationItems: NavigationItem[];
  activeRoute: string;
  onNavigate: (route: string) => void;
  user: any;
  onLogout: () => void;
}> = ({ navigationItems, activeRoute, onNavigate, user, onLogout }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <View style={styles.sidebar}>
      <LinearGradient
        colors={['#1a1f2a', '#2c3e50']}
        style={StyleSheet.absoluteFillObject}
      />
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
      
      {/* Header Actions */}
      <View style={styles.sidebarHeader}>
        <TouchableOpacity style={styles.sidebarActionBtn}>
          <Ionicons name="notifications" size={20} color="#79d5e9" />
          <View style={styles.actionBadge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sidebarActionBtn}>
          <Ionicons name="mail" size={20} color="#79d5e9" />
          <View style={styles.actionBadge}>
            <Text style={styles.badgeText}>5</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sidebarActionBtn} onPress={onLogout}>
          <Ionicons name="power" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* User Section */}
      <View style={styles.sidebarUserSection}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {user?.name?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userRole}>
            {user?.role === 'salesAgent' ? 'Sales Agent' : 
             user?.role === 'brandManager' ? 'Brand Manager' : 'Admin'}
          </Text>
        </View>
      </View>

      {/* Navigation */}
      <ScrollView style={styles.sidebarNav} showsVerticalScrollIndicator={false}>
        {navigationItems.map((item) => (
          <View key={item.id} style={styles.navSection}>
            <TouchableOpacity
              style={[
                styles.navItem,
                activeRoute.startsWith(item.route) && styles.navItemActive,
              ]}
              onPress={() => {
                if (item.subItems) {
                  toggleSection(item.id);
                } else {
                  onNavigate(item.route);
                }
              }}
            >
              <Ionicons 
                name={item.icon as any} 
                size={20} 
                color={activeRoute.startsWith(item.route) ? '#79d5e9' : '#ffffff'} 
              />
              <Text style={[
                styles.navItemText,
                activeRoute.startsWith(item.route) && styles.navItemTextActive,
              ]}>
                {item.title}
              </Text>
              {item.badge && (
                <View style={styles.navBadge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
              {item.subItems && (
                <Ionicons
                  name={expandedSections.has(item.id) ? 'chevron-down' : 'chevron-forward'}
                  size={16}
                  color="#ffffff"
                />
              )}
            </TouchableOpacity>

            {/* Sub Items */}
            {item.subItems && expandedSections.has(item.id) && (
              <View style={styles.subNavContainer}>
                {item.subItems.map((subItem) => (
                  <TouchableOpacity
                    key={subItem.id}
                    style={[
                      styles.subNavItem,
                      activeRoute === subItem.route && styles.subNavItemActive,
                    ]}
                    onPress={() => onNavigate(subItem.route)}
                  >
                    <View style={styles.subNavDot} />
                    <Ionicons 
                      name={subItem.icon as any} 
                      size={16} 
                      color={activeRoute === subItem.route ? '#79d5e9' : 'rgba(255,255,255,0.7)'} 
                    />
                    <Text style={[
                      styles.subNavItemText,
                      activeRoute === subItem.route && styles.subNavItemTextActive,
                    ]}>
                      {subItem.title}
                    </Text>
                    {subItem.badge && (
                      <View style={styles.subNavBadge}>
                        <Text style={styles.badgeText}>{subItem.badge}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Logo at Bottom */}
      <View style={styles.sidebarFooter}>
        <Text style={styles.logoText}>Splitfin</Text>
      </View>
    </View>
  );
};

// Bottom Navigation Component
const BottomNavigation: React.FC<{
  navigationItems: NavigationItem[];
  activeRoute: string;
  onNavigate: (route: string) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  user: any;
  onLogout: () => void;
}> = ({ navigationItems, activeRoute, onNavigate, isExpanded, onToggleExpanded, user, onLogout }) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isExpanded ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [isExpanded]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -EXPANDED_MENU_HEIGHT],
  });

  // Get primary navigation items (max 4 for bottom bar)
  const primaryItems = navigationItems.slice(0, 4);
  const moreItems = navigationItems.slice(4);

  return (
    <>
      {/* Backdrop */}
      {isExpanded && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onToggleExpanded}
        />
      )}

      {/* Expanded Menu */}
      <Animated.View
        style={[
          styles.expandedMenu,
          { 
            transform: [{ translateY }],
            bottom: BOTTOM_MENU_HEIGHT + insets.bottom,
          },
        ]}
      >
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
        
        {/* User Section */}
        <View style={styles.expandedUserSection}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {user?.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userRole}>
              {user?.role === 'salesAgent' ? 'Sales Agent' : 
               user?.role === 'brandManager' ? 'Brand Manager' : 'Admin'}
            </Text>
          </View>
          <TouchableOpacity style={styles.expandedLogoutBtn} onPress={onLogout}>
            <Ionicons name="power" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* Navigation Grid */}
        <ScrollView style={styles.expandedNavGrid} showsVerticalScrollIndicator={false}>
          <View style={styles.navGrid}>
            {[...primaryItems, ...moreItems].map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.navGridItem,
                  activeRoute.startsWith(item.route) && styles.navGridItemActive,
                ]}
                onPress={() => {
                  onNavigate(item.route);
                  onToggleExpanded();
                }}
              >
                <View style={styles.navGridIconContainer}>
                  <Ionicons 
                    name={item.icon as any} 
                    size={24} 
                    color={activeRoute.startsWith(item.route) ? '#79d5e9' : '#ffffff'} 
                  />
                  {item.badge && (
                    <View style={styles.navGridBadge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={[
                  styles.navGridItemText,
                  activeRoute.startsWith(item.route) && styles.navGridItemTextActive,
                ]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Animated.View>

      {/* Bottom Bar */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
        
        <View style={styles.bottomNavContent}>
          {/* Primary Navigation Items */}
          {primaryItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.bottomNavItem}
              onPress={() => onNavigate(item.route)}
            >
              <View style={styles.bottomNavIconContainer}>
                <Ionicons 
                  name={item.icon as any} 
                  size={24} 
                  color={activeRoute.startsWith(item.route) ? '#79d5e9' : 'rgba(255,255,255,0.7)'} 
                />
                {item.badge && (
                  <View style={styles.bottomNavBadge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={[
                styles.bottomNavItemText,
                activeRoute.startsWith(item.route) && styles.bottomNavItemTextActive,
              ]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}

          {/* More Button */}
          {moreItems.length > 0 && (
            <TouchableOpacity
              style={styles.bottomNavItem}
              onPress={onToggleExpanded}
            >
              <View style={styles.bottomNavIconContainer}>
                <Ionicons 
                  name={isExpanded ? 'close' : 'grid'} 
                  size={24} 
                  color={isExpanded ? '#79d5e9' : 'rgba(255,255,255,0.7)'} 
                />
              </View>
              <Text style={[
                styles.bottomNavItemText,
                isExpanded && styles.bottomNavItemTextActive,
              ]}>
                {isExpanded ? 'Close' : 'More'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </>
  );
};

// Breadcrumbs Component
const Breadcrumbs: React.FC<{ route: string }> = ({ route }) => {
  const breadcrumbMap: { [key: string]: string } = {
    Dashboard: 'Dashboard',
    DashboardHome: 'Dashboard > Overview',
    DashboardOrders: 'Dashboard > Orders',
    DashboardRevenue: 'Dashboard > Revenue',
    Customers: 'Customers',
    CustomersList: 'Customers > All Customers',
    CustomersNew: 'Customers > Add Customer',
    Orders: 'Orders',
    OrdersList: 'Orders > All Orders',
    Inventory: 'Inventory',
  };

  const breadcrumb = breadcrumbMap[route] || route;

  return (
    <View style={styles.breadcrumbContainer}>
      <Text style={styles.breadcrumbText}>{breadcrumb}</Text>
    </View>
  );
};

// Main MasterLayout Component
const MasterLayout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuthStore();
  const navigation = useNavigation();
  const route = useRoute();
  const orientation = useSimpleOrientation();
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);

  const navigationItems = getNavigationItems(user?.role || 'salesAgent');
  const activeRoute = route.name;

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              if (user?.uid) {
                await updateDoc(doc(firestore, 'users', user.uid), {
                  isOnline: false,
                  lastSeen: new Date().toISOString(),
                });
              }
              await signOut(auth);
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        },
      ]
    );
  };

  const handleNavigate = (routeName: string) => {
    navigation.navigate(routeName as never);
    setIsMenuExpanded(false);
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0f1419', '#1a1f2a', '#2c3e50']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.layoutContainer}>
        {/* Sidebar for landscape tablets */}
        {orientation.shouldShowSidebar && (
          <Sidebar
            navigationItems={navigationItems}
            activeRoute={activeRoute}
            onNavigate={handleNavigate}
            user={user}
            onLogout={handleLogout}
          />
        )}

        {/* Main Content */}
        <View style={[
          styles.mainContent,
          orientation.shouldShowSidebar && styles.mainContentWithSidebar,
          orientation.shouldShowBottomNav && styles.mainContentWithBottomNav,
        ]}>
          {/* Header with breadcrumbs (only for sidebar layout) */}
          {orientation.shouldShowSidebar && (
            <View style={styles.header}>
              <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
              <Breadcrumbs route={activeRoute} />
            </View>
          )}

          {/* Content Area */}
          <View style={styles.contentArea}>
            {children}
          </View>
        </View>

        {/* Bottom Navigation for mobile/portrait */}
        {orientation.shouldShowBottomNav && (
          <BottomNavigation
            navigationItems={navigationItems}
            activeRoute={activeRoute}
            onNavigate={handleNavigate}
            isExpanded={isMenuExpanded}
            onToggleExpanded={() => setIsMenuExpanded(!isMenuExpanded)}
            user={user}
            onLogout={handleLogout}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1419',
  },
  layoutContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f1419',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
  },

  // Badge styles (replacing react-native-paper Badge)
  actionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  navBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  subNavBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  navGridBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  bottomNavBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },

  // Sidebar Styles
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: '#1a1f2a',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  sidebarActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  sidebarUserSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    gap: 16,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  userAvatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userRole: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  sidebarNav: {
    flex: 1,
    paddingVertical: 16,
  },
  navSection: {
    marginBottom: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 16,
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: 'rgba(121, 213, 233, 0.1)',
  },
  navItemText: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 15,
    fontWeight: '500',
  },
  navItemTextActive: {
    color: '#79d5e9',
  },
  subNavContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  subNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    paddingLeft: 56,
    gap: 12,
    position: 'relative',
  },
  subNavItemActive: {
    backgroundColor: 'rgba(121, 213, 233, 0.05)',
  },
  subNavDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    position: 'absolute',
    left: 40,
  },
  subNavItemText: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
  subNavItemTextActive: {
    color: '#79d5e9',
  },
  sidebarFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  logoText: {
    color: '#79d5e9',
    fontSize: 24,
    fontWeight: '700',
  },

  // Main Content Styles
  mainContent: {
    flex: 1,
  },
  mainContentWithSidebar: {
    marginLeft: 0,
  },
  mainContentWithBottomNav: {
    marginBottom: BOTTOM_MENU_HEIGHT,
  },
  header: {
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
  contentArea: {
    flex: 1,
    padding: 0,
  },

  // Bottom Navigation Styles
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BOTTOM_MENU_HEIGHT,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1001,
  },
  bottomNavContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  bottomNavIconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  bottomNavItemText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  bottomNavItemTextActive: {
    color: '#79d5e9',
  },

  // Expanded Menu Styles
  expandedMenu: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: EXPANDED_MENU_HEIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1002,
    overflow: 'hidden',
  },
  expandedUserSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    gap: 16,
  },
  expandedLogoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedNavGrid: {
    flex: 1,
    paddingHorizontal: 20,
  },
  navGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  navGridItem: {
    width: '22%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  navGridItemActive: {
    backgroundColor: 'rgba(121, 213, 233, 0.1)',
    borderColor: '#79d5e9',
  },
  navGridIconContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  navGridItemText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 12,
  },
  navGridItemTextActive: {
    color: '#79d5e9',
  },
});

export default MasterLayout;