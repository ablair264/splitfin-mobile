import React, { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { useParams, useNavigate, Outlet } from 'react-router-dom';
import { auth } from '../firebase';
import { ProgressLoader } from './ProgressLoader';
import DashboardHeader from './shared/DashboardHeader';
import { ColorProvider } from './shared/ColorProvider';
import DashboardFeatureToggle from './DashboardFeatureToggle';
import './dashboard-minimal.css';

// Lazy load view components
const EnhancedOverviewView = lazy(() => import('./views/EnhancedOverviewView'));
const EnhancedOrdersView = lazy(() => import('./views/EnhancedOrdersView'));
const EnhancedRevenueView = lazy(() => import('./views/EnhancedRevenueView'));
const EnhancedInvoicesView = lazy(() => import('./views/EnhancedInvoicesView'));
const EnhancedBrandsView = lazy(() => import('./views/EnhancedBrandsView'));
const EnhancedForecastingView = lazy(() => import('./views/EnhancedForecastingView'));

interface LightweightDashboardProps {
  userId: string;
}

// View loading fallback
const ViewLoadingFallback = () => (
  <ProgressLoader
    progress={50}
    message="Loading view..."
  />
);

/**
 * Lightweight Brand Manager Dashboard
 * This version doesn't load all data upfront. Instead, each view
 * loads only the data it needs, improving performance for large datasets.
 */
const LightweightBrandManagerDashboard: React.FC<LightweightDashboardProps> = ({ userId }) => {
  const navigate = useNavigate();
  
  // Initialize user preferences
  const userPreferences = useMemo(() => {
    const stored = localStorage.getItem('dashboardPreferences');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse preferences:', e);
      }
    }
    return {
      metricDisplayMode: 'full',
      barChartColors: 'blue',
      chartDesign: 'table',
      cardVariants: {
        totalRevenue: 'variant1',
        totalOrders: 'variant2',
        activeCustomers: 'variant3',
        avgOrderValue: 'variant1',
        outstandingInvoices: 'variant2',
        marketplaceOrders: 'variant3',
      },
      graphColors: {
        primary: '#79d5e9',
        secondary: '#4daeac',
        tertiary: '#f77d11'
      }
    };
  }, []);

  // Dashboard state - no data loading here
  const [dashboardState, setDashboardState] = useState({
    dateRange: '30_days',
    isEditMode: false,
    metricDisplayMode: userPreferences.metricDisplayMode as 'full' | 'compact',
    barChartColors: (userPreferences.barChartColors === 'blue' ? 'primary' : 
                     userPreferences.barChartColors === 'orange' ? 'fourth' : 
                     userPreferences.barChartColors || 'primary') as any,
    chartDesign: userPreferences.chartDesign as 'default' | 'horizontal-bars' | 'pie-with-legend' | 'table',
    cardVariants: userPreferences.cardVariants,
    graphColors: userPreferences.graphColors || {
      primary: '#79d5e9',
      secondary: '#4daeac',
      tertiary: '#f77d11'
    }
  });

  // Update dashboard state helper
  const updateDashboardState = useCallback((updates: Partial<typeof dashboardState>) => {
    setDashboardState(prev => ({ ...prev, ...updates }));
  }, []);

  // Save preferences to localStorage (debounced)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('dashboardPreferences', JSON.stringify({
        metricDisplayMode: dashboardState.metricDisplayMode,
        barChartColors: dashboardState.barChartColors,
        chartDesign: dashboardState.chartDesign,
        cardVariants: dashboardState.cardVariants,
        graphColors: dashboardState.graphColors
      }));
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [
    dashboardState.metricDisplayMode, 
    dashboardState.barChartColors, 
    dashboardState.chartDesign, 
    dashboardState.cardVariants, 
    dashboardState.graphColors
  ]);

  // Context data to pass to child views
  const contextData = useMemo(() => ({
    userId,
    dashboardState,
    updateDashboardState,
    navigate
  }), [userId, dashboardState, updateDashboardState, navigate]);

  return (
    <div className="dashboard-wrapper" style={{ position: 'relative', minHeight: '100vh' }}>
      <div className="enhanced-dashboard brand-manager-view">
        {/* Dashboard Header */}
        <DashboardHeader
          title="Dashboard"
          subtitle="Brand Manager Overview"
          dateRange={dashboardState.dateRange}
          onDateRangeChange={(value) => updateDashboardState({ dateRange: value })}
          isEditMode={dashboardState.isEditMode}
          onEditModeToggle={() => updateDashboardState({ isEditMode: !dashboardState.isEditMode })}
          onRefresh={() => {
            // Trigger refresh in the active view
            window.dispatchEvent(new CustomEvent('dashboard-refresh'));
          }}
          metricDisplayMode={dashboardState.metricDisplayMode}
          onMetricDisplayModeChange={(value) => updateDashboardState({ metricDisplayMode: value })}
          barChartColors={dashboardState.barChartColors}
          onBarChartColorsChange={(value) => updateDashboardState({ barChartColors: value })}
          chartDesign={dashboardState.chartDesign}
          onChartDesignChange={(value) => updateDashboardState({ chartDesign: value })}
        />
        
        {/* Feature Toggle - Only show in edit mode */}
        {dashboardState.isEditMode && <DashboardFeatureToggle />}

        <div className="view-content">
          <div className="dashboard-content-wrapper">
            {/* Wrap with ColorProvider and render child routes */}
            <ColorProvider 
              barChartColors={dashboardState.barChartColors}
              graphColors={dashboardState.graphColors}
            >
              <Suspense fallback={<ViewLoadingFallback />}>
                <Outlet context={contextData} />
              </Suspense>
            </ColorProvider>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LightweightBrandManagerDashboard;