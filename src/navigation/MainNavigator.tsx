// src/navigation/MainNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MasterLayout from '../layouts/MasterLayout';

// Import screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import { DashboardOverviewScreen } from '../screens/dashboard/DashboardOverviewScreen';
import ProductsScreen from '../screens/products/ProductsScreen';
import ProductDetailScreen from '../screens/products/ProductDetailScreen';
import CartScreen from '../screens/products/CartScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import CustomersScreen from '../screens/customers/CustomersScreen';
import CustomerDetailScreen from '../screens/customers/CustomerDetailScreen';
import { InvoiceManagementScreen } from '../screens/invoices/InvoiceManagementScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { ProductsInventoryScreen } from '../screens/products/ProductsInventoryScreen';
import { CustomersManagementScreen } from '../screens/customers/CustomersManagementScreen';
import PlaceholderScreen from '../components/PlaceholderScreen';

const Stack = createNativeStackNavigator();

export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Dashboard Routes */}
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="DashboardHome" component={DashboardOverviewScreen} />
      <Stack.Screen name="DashboardOrders" component={DashboardScreen} />
      <Stack.Screen name="DashboardRevenue" component={DashboardScreen} />
      
      {/* Customer Routes */}
      <Stack.Screen name="Customers" component={CustomersScreen} />
      <Stack.Screen name="CustomersList" component={CustomersScreen} />
      <Stack.Screen name="CustomersNew" component={CustomersManagementScreen} />
      <Stack.Screen name="CustomersMap">
        {() => <PlaceholderScreen title="Customer Map" />}
      </Stack.Screen>
      <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
      
      {/* Order Routes */}
      <Stack.Screen name="Orders" component={OrdersScreen} />
      <Stack.Screen name="OrdersList" component={OrdersScreen} />
      <Stack.Screen name="OrdersNew">
        {() => <PlaceholderScreen title="New Order" />}
      </Stack.Screen>
      <Stack.Screen name="OrdersPending">
        {() => <PlaceholderScreen title="Pending Orders" />}
      </Stack.Screen>
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      
      {/* Inventory Routes */}
      <Stack.Screen name="Inventory" component={ProductsInventoryScreen} />
      <Stack.Screen name="InventoryOverview" component={ProductsInventoryScreen} />
      <Stack.Screen name="InventoryProducts" component={ProductsScreen} />
      <Stack.Screen name="InventoryWarehouse">
        {() => <PlaceholderScreen title="Warehouse" />}
      </Stack.Screen>
      
      {/* Live Stocklists Routes */}
      <Stack.Screen name="LiveStocklists">
        {() => <PlaceholderScreen title="Live Stocklists" />}
      </Stack.Screen>
      <Stack.Screen name="StocklistBlomus">
        {() => <PlaceholderScreen title="Blomus Stocklist" />}
      </Stack.Screen>
      <Stack.Screen name="StocklistElvang">
        {() => <PlaceholderScreen title="Elvang Stocklist" />}
      </Stack.Screen>
      <Stack.Screen name="StocklistGefu">
        {() => <PlaceholderScreen title="GEFU Stocklist" />}
      </Stack.Screen>
      
      {/* Agent Management Routes */}
      <Stack.Screen name="Agents">
        {() => <PlaceholderScreen title="Agent Management" />}
      </Stack.Screen>
      
      {/* Settings Routes */}
      <Stack.Screen name="Settings" component={ProfileScreen} />
      <Stack.Screen name="SettingsGeneral" component={ProfileScreen} />
      <Stack.Screen name="SettingsProfile" component={ProfileScreen} />
      <Stack.Screen name="SettingsSecurity">
        {() => <PlaceholderScreen title="Security Settings" />}
      </Stack.Screen>
      
      {/* Other Routes */}
      <Stack.Screen name="Products" component={ProductsScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Invoices" component={InvoiceManagementScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

// Wrapper component that wraps all screens with MasterLayout
export function MainNavigatorWithLayout() {
  return (
    <MasterLayout>
      <MainNavigator />
    </MasterLayout>
  );
}
