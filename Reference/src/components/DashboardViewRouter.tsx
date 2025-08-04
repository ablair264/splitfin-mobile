import React, { lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { auth } from '../firebase';

// Regular Views
const OverviewView = lazy(() => import('./views/OverviewView'));
const OrdersView = lazy(() => import('./views/OrdersView'));
const RevenueView = lazy(() => import('./views/RevenueView'));
const InvoicesView = lazy(() => import('./views/InvoicesView'));
const BrandsView = lazy(() => import('./views/BrandsView'));
const ForecastingView = lazy(() => import('./views/ForecastingView'));

// Enhanced Views for lightweight dashboard
const EnhancedOverviewView = lazy(() => import('./views/EnhancedOverviewView'));
const EnhancedOrdersView = lazy(() => import('./views/EnhancedOrdersView'));
const EnhancedRevenueView = lazy(() => import('./views/EnhancedRevenueView'));
const EnhancedInvoicesView = lazy(() => import('./views/EnhancedInvoicesView'));
const EnhancedBrandsView = lazy(() => import('./views/EnhancedBrandsView'));
const EnhancedForecastingView = lazy(() => import('./views/EnhancedForecastingView'));

interface DashboardViewRouterProps {
  view: 'overview' | 'orders' | 'revenue' | 'invoices' | 'brands' | 'forecasting';
  userRole: string;
}

// Check if lightweight dashboard is enabled
const isLightweightEnabled = () => {
  return localStorage.getItem('useLightweightDashboard') === 'true' || 
    import.meta.env.VITE_USE_LIGHTWEIGHT_DASHBOARD === 'true';
};

const DashboardViewRouter: React.FC<DashboardViewRouterProps> = ({ view, userRole }) => {
  // Use enhanced views only for brand managers with lightweight dashboard enabled
  const useEnhanced = userRole === 'brandManager' && isLightweightEnabled();

  const ViewComponent = React.useMemo(() => {
    if (useEnhanced) {
      switch (view) {
        case 'overview':
          return EnhancedOverviewView;
        case 'orders':
          return EnhancedOrdersView;
        case 'revenue':
          return EnhancedRevenueView;
        case 'invoices':
          return EnhancedInvoicesView;
        case 'brands':
          return EnhancedBrandsView;
        case 'forecasting':
          return EnhancedForecastingView;
        default:
          return OverviewView;
      }
    } else {
      switch (view) {
        case 'overview':
          return OverviewView;
        case 'orders':
          return OrdersView;
        case 'revenue':
          return RevenueView;
        case 'invoices':
          return InvoicesView;
        case 'brands':
          return BrandsView;
        case 'forecasting':
          return ForecastingView;
        default:
          return OverviewView;
      }
    }
  }, [view, useEnhanced]);

  return (
    <Suspense fallback={
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Loading {view} view...
      </div>
    }>
      <ViewComponent />
    </Suspense>
  );
};

export default DashboardViewRouter;
