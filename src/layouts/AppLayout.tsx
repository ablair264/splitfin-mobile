import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { theme } from '../theme';
import { useResponsive } from '../hooks/useResponsive';
import { Sidebar, TabBar, Header } from '../components/navigation';
import { useAuthStore } from '../store/authStore';
import { StaticBackground } from '../components/ui/StaticBackground';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  headerActions?: Array<{
    key: string;
    icon: React.ReactNode;
    onPress: () => void;
  }>;
  breadcrumbs?: Array<{
    title: string;
    onPress?: () => void;
  }>;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title = 'Splitfin',
  subtitle,
  showHeader = true,
  headerActions = [],
  breadcrumbs,
}) => {
  const { isTablet } = useResponsive();
  const { user } = useAuthStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentRoute, setCurrentRoute] = useState('Dashboard');

  const handleNavigate = (route: string) => {
    setCurrentRoute(route);
    // Here you would integrate with your navigation system
    console.log('Navigate to:', route);
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const mockUser = {
    name: user?.name || 'Matt Langford',
    role: user?.role || 'Brand Manager',
    avatar: user?.avatar,
  };

  return (
    <StaticBackground edges="all">
      <SafeAreaView style={styles.container}>
        <View style={styles.layoutContainer}>
          {/* Sidebar for tablet */}
          {isTablet && (
            <Sidebar
              isCollapsed={sidebarCollapsed}
              onToggle={handleSidebarToggle}
              currentRoute={currentRoute}
              onNavigate={handleNavigate}
              user={mockUser}
            />
          )}

          {/* Main Content Area */}
          <View style={[
            styles.mainContent,
            isTablet && styles.mainContentWithSidebar,
            !isTablet && styles.mainContentWithTabBar,
          ]}>
            {/* Header */}
            {showHeader && (
              <Header
                title={title}
                subtitle={subtitle}
                rightActions={headerActions}
                breadcrumbs={breadcrumbs}
              />
            )}

            {/* Content */}
            <View style={styles.contentArea}>
              {children}
            </View>
          </View>

          {/* Tab Bar for mobile */}
          {!isTablet && (
            <TabBar
              currentRoute={currentRoute}
              onNavigate={handleNavigate}
            />
          )}
        </View>
      </SafeAreaView>
    </StaticBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Let StaticBackground show through
  },
  layoutContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  mainContent: {
    flex: 1,
    backgroundColor: 'transparent', // Let StaticBackground show through
  },
  mainContentWithSidebar: {
    // Sidebar automatically takes its width
  },
  mainContentWithTabBar: {
    paddingBottom: theme.layout.tabBarHeight,
  },
  contentArea: {
    flex: 1,
    // Remove any white background that might be showing
    backgroundColor: 'transparent',
  },
});