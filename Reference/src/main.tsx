import './styles/global.css';
import './components/fixes/dashboard-overlap-fixes.css';
import { applyDeviceClasses } from './utils/deviceDetection';
import { performAutoMigration } from './utils/cacheMigration';

// Apply device-specific classes
applyDeviceClasses();

// Perform cache migration on app startup
performAutoMigration().catch(console.error);
import React, { useState, useEffect, lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth, db } from './firebase'
import { doc, getDoc } from 'firebase/firestore'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { PurchaseOrderSuggestions } from './components/PurchaseOrderSuggestions';
import { MessagingProvider } from './contexts/MessagingContext';

ModuleRegistry.registerModules([AllCommunityModule])

// Import components
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import BrandManagerDashboard from './components/BrandManagerDashboard'
import LightweightBrandManagerDashboard from './components/LightweightBrandManagerDashboard'
import DashboardViewRouter from './components/DashboardViewRouter'
import SalesAgentDashboard from './components/SalesAgentDashboard'
import CustomersManagement from './components/CustomersManagement'
import NewCustomer from './components/NewCustomer'
import AllProducts from './components/AllProducts'
import ReviewOrder from './components/ReviewOrderPage'
import BrandSelector from './components/BrandSelector'
import ViewOrders from './components/ViewOrders'
import LiveStockList from './components/ProductList'
import OrderManagement from './components/OrderManagement'
import NewPurchaseOrder from './components/NewPurchaseOrder'
import ViewPurchaseOrders from './components/ViewPurchaseOrders'
import MasterLayout from './layouts/MasterLayout'
import { UserProvider } from './components/UserContext'
import LottieLoader from './components/LottieLoader'
import CustomerMapGoogle from './components/CustomerMapGoogle'
import CustomerDetail from './components/CustomerDetail';
import CustomerCheckout from './components/CustomerCheckout/CustomerCheckout';
import CustomerOrderConfirmation from './components/CustomerOrderConfirmation/CustomerOrderConfirmation';
import OrderSummary from './components/OrderSummary';
import OrderConfirmation from './components/OrderConfirmation';
import CustomerOrderDetail from './components/CustomerOrderDetail/CustomerOrderDetail';
import Settings from './components/Settings';
import ImageManagement from './components/ImageManagement';
import CatalogueLibrary from './components/CatalogueLibrary/CatalogueLibrary';
import { 
  InventoryOverview, 
  InventoryProducts, 
  InventoryCouriers, 
  InventoryWarehouse, 
  InventoryDeliveries 
} from './components/InventoryManagement';

// Import specific views that are used directly
const SalesAgentOverviewView = lazy(() => import('./components/views/SalesAgentOverviewView'));

import CustomerLogin from './components/CustomerAuth/CustomerLogin';
import CustomerLayout from './components/CustomerLayout/CustomerLayout';
import CustomerDashboard from './components/CustomerDashboard/CustomerDashboard';
import CustomerProducts from './components/CustomerProducts/CustomerProducts';
import CustomerCart from './components/CustomerCart/CustomerCart';
import CustomerOrders from './components/CustomerOrders/CustomerOrders';
import CustomerOrderView from './components/CustomerOrderView/CustomerOrderView';
import CustomerAccount from './components/CustomerAccount/CustomerAccount';
import BrandSelection from './components/BrandSelection/BrandSelection';
import CreateCustomer from './components/CreateCustomer';
import CatalogueBuilder from './components/CatalogueBuilder';
import PendingCustomers from './components/PendingCustomers/PendingCustomers';
import CustomerSignup from './components/CustomerSignup/CustomerSignup';
import OrderDetail from './components/OrderDetail';
import InvoiceManagement from './components/InvoiceManagement';
import NewInvoice from './components/NewInvoice';
import ViewOrder from './components/ViewOrder';
import CustomerProtectedRoute from './components/CustomerAuth/CustomerProtectedRoute';
import CustomerNewOrder from './components/CustomerNewOrder/CustomerNewOrder';
import CustomerAmendOrder from './components/CustomerAmendOrder/CustomerAmendOrder';
import CustomerInvoices from './components/CustomerInvoices/CustomerInvoices';
import CustomerPayInvoice from './components/CustomerPayInvoice/CustomerPayInvoice';
import CustomerCatalogues from './components/CustomerCatalogues/CustomerCatalogues';
import CustomerRequestCatalogue from './components/CustomerRequestCatalogue/CustomerRequestCatalogue';
import CustomerBrands from './components/CustomerBrands/CustomerBrands';
import AgentManagement from './components/AgentManagement'
import CustomerApproval from './components/CustomerApproval/CustomerApproval';
import OrderApproval from './components/OrderApproval/OrderApproval';
import CustomerSettings from './components/CustomerSettings/CustomerSettings';

// Import messaging CSS
import './contexts/Messaging.css';

// Feature flag for lightweight dashboard - can be toggled easily
const USE_LIGHTWEIGHT_DASHBOARD = localStorage.getItem('useLightweightDashboard') === 'true' || 
  import.meta.env.VITE_USE_LIGHTWEIGHT_DASHBOARD === 'true';

// Dashboard Route Component that determines which dashboard to show
function DashboardRouter({ userId, userRole }: { userId: string; userRole: string }) {
  // Return the appropriate dashboard component based on user role
  if (userRole === 'brandManager') {
    // Use lightweight dashboard if feature flag is enabled
    return USE_LIGHTWEIGHT_DASHBOARD 
      ? <LightweightBrandManagerDashboard userId={userId} />
      : <BrandManagerDashboard userId={userId} />;
  } else if (userRole === 'salesAgent') {
    return <SalesAgentDashboard userId={userId} />;
  } else {
    return <Dashboard userId={userId} userRole={userRole} />;
  }
}

// Component to redirect authenticated users based on their role
function AuthenticatedRedirect({ userRole }: { userRole: string }) {
  if (userRole === 'customer') {
    return <Navigate to="/customer/dashboard" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [userLoading, setUserLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        try {
          const userRef = doc(db, 'users', u.uid)
          const userSnap = await getDoc(userRef)
          if (userSnap.exists()) {
            const userData = userSnap.data()
            setUserRole(userData?.role || '')
            if (userData?.role === 'salesAgent' && userData?.agentID) {
              localStorage.setItem('agentID', userData.agentID)
            }
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error)
        }
      } else {
        localStorage.removeItem('agentID')
        setUserRole('')
      }
      setUserLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (userLoading) {
    return (
      <LottieLoader
        size="large"
        message="Loading Splitfin Dashboard..."
        subMessage="Initializing your workspace"
        overlay={true}
        style={{ backgroundColor: '#0f1419' }}
      />
    )
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route index element={user ? <AuthenticatedRedirect userRole={userRole} /> : <Navigate to="/login" replace />} />
      <Route path="/customer/login" element={<CustomerLogin />} />
      <Route path="/customer/signup" element={<CustomerSignup />} /> 

      {/* Customer Routes - MessagingProvider is already wrapping these via the root provider */}
      <Route path="/customer" element={<CustomerProtectedRoute><CustomerLayout /></CustomerProtectedRoute>}>
        <Route path="dashboard" element={<CustomerDashboard />} />
        <Route path="new-order" element={<CustomerNewOrder />} />
        <Route path="orders" element={<CustomerOrders />} />
        <Route path="view-order/:orderId" element={<CustomerOrderView />} />
        <Route path="orders/amend" element={<CustomerAmendOrder />} />
        <Route path="orders/detail" element={<CustomerOrderDetail />} />
        <Route path="invoices" element={<CustomerInvoices />} />
        <Route path="invoices/pay" element={<CustomerPayInvoice />} />
        <Route path="catalogues" element={<CustomerCatalogues />} />
        <Route path="catalogues/request" element={<CustomerRequestCatalogue />} />
        <Route path="account" element={<CustomerAccount />} />
        <Route path="brands" element={<CustomerBrands />} />
        <Route path="brand/:brandId" element={<CustomerProducts />} />
        <Route path="cart" element={<CustomerCart />} />
        <Route path="checkout" element={<CustomerCheckout />} />
        <Route path="order-confirmation" element={<CustomerOrderConfirmation />} />
        <Route index element={<Navigate to="/customer/dashboard" />} />
      </Route>

      {/* Protected Routes */}
      <Route element={user ? <MasterLayout /> : <Navigate to="/login" replace />}>
        {/* Dashboard Routes - Now properly nested */}
        <Route path="/dashboard" element={<DashboardRouter userId={user?.uid || ''} userRole={userRole} />}>
          <Route index element={<Navigate to="/dashboard/overview" replace />} />
          <Route path="overview" element={
            userRole === 'salesAgent' ? (
              <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
                <SalesAgentOverviewView />
              </Suspense>
            ) : (
              <DashboardViewRouter view="overview" userRole={userRole} />
            )
          } />
          <Route path="orders" element={
            <DashboardViewRouter view="orders" userRole={userRole} />
          } />
          <Route path="revenue" element={
            <DashboardViewRouter view="revenue" userRole={userRole} />
          } />
          <Route path="invoices" element={
            <DashboardViewRouter view="invoices" userRole={userRole} />
          } />
          <Route path="brands" element={
            <DashboardViewRouter view="brands" userRole={userRole} />
          } />
          <Route path="forecasting" element={
            <DashboardViewRouter view="forecasting" userRole={userRole} />
          } />
        </Route>
        
        {/* Customers */}
        <Route path="/customers" element={<CustomersManagement />} />
        <Route path="/customers/new" element={<NewCustomer />} />
        <Route path="/customers/map" element={<CustomerMapGoogle />} /> 
        <Route path="/customers/create-account" element={<CreateCustomer />} />
        <Route path="/customers/pending" element={<PendingCustomers />} />
        <Route path="/customer/:customerId" element={<CustomerDetail />} />
        <Route path="/customers/approval" element={<CustomerApproval />} />
        <Route path="/customers/management" element={<CustomerSettings />} />
        
        {/* Orders */}
        <Route path="/orders" element={<ViewOrders />} />
        <Route path="/orders/approval" element={<OrderApproval />} />
        <Route path="/select-brand/:customerId" element={<BrandSelector />} />
        <Route path="/products/:customerId/:brandID" element={<AllProducts />} />
        <Route path="/review-order" element={<ReviewOrder />} />
        <Route path="/order/:orderId" element={<OrderDetail />} />
        <Route path="/new-customer" element={<NewCustomer />} />
        <Route path="/order-summary" element={<OrderSummary />} />
        <Route path="/order-confirmation" element={<OrderConfirmation />} />
        
        {/* Inventory Management */}
        <Route path="/inventory" element={<Navigate to="/inventory/overview" />} />
        <Route path="/inventory/overview" element={<InventoryOverview />} />
        <Route path="/inventory/products" element={<InventoryProducts />} />
        <Route path="/inventory/couriers" element={<InventoryCouriers />} />
        <Route path="/inventory/warehouse" element={<InventoryWarehouse />} />
        <Route path="/inventory/deliveries" element={<InventoryDeliveries />} />
        <Route path="/inventory/items/new" element={<InventoryProducts />} />
        <Route path="/inventory/items/edit/:itemId" element={<InventoryProducts />} />
        <Route path="/item/:itemId" element={<InventoryProducts />} />
        
        {/* Image Management */}
        <Route path="/images" element={<ImageManagement />} />
        <Route path="/images/:brandId" element={<ImageManagement />} />
        
        {/* Catalogue Library */}
        <Route path="/catalogue-library" element={<CatalogueLibrary />} />
        
        {/* Live Stocklists */}
        <Route path="/brand/:brandName" element={<LiveStockList />} />
        <Route path="/brand/:brandName/catalogue-builder" element={<CatalogueBuilder />} />
        
        {/* Purchase Orders */}
        <Route path="/purchase-orders" element={<ViewPurchaseOrders />} />
        <Route path="/purchase-orders/new" element={<NewPurchaseOrder />} />
        <Route path="/purchase-orders/order-management" element={<OrderManagement />} />
        <Route path="/purchase-orders/purchase-suggestions" element={<PurchaseOrderSuggestions />} />
        
        {/* Invoices */}
        <Route path="/invoices" element={<InvoiceManagement />} />
        <Route path="/invoice/new" element={<NewInvoice />} />
        <Route path="/invoice/edit/:invoiceId" element={<NewInvoice />} />
        <Route path="/invoice/:invoiceId" element={<InvoiceManagement />} />
        
        {/* Agent Management */}
        <Route path="/agents" element={<AgentManagement />} />
        
        {/* Settings */}
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/general" element={<Settings />} />
        <Route path="/settings/profile" element={<Settings />} />
        <Route path="/settings/notifications" element={<Settings />} />
        <Route path="/settings/database" element={<Settings />} />
        <Route path="/settings/security" element={<Settings />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={user ? <AuthenticatedRedirect userRole={userRole} /> : <Navigate to="/login" replace />} />
    </Routes>
  )
}

// Root App Component with all providers
function RootApp() {
  return (
    <React.StrictMode>
      <BrowserRouter>
        <UserProvider>
              <MessagingProvider>
                <App />
              </MessagingProvider>
        </UserProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<RootApp />);