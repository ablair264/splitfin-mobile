// src/navigation/MainNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuthStore } from '../store/authStore';

// Import screens (we'll create these next)
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ProductsScreen from '../screens/products/ProductsScreen';
import ProductDetailScreen from '../screens/products/ProductDetailScreen';
import CartScreen from '../screens/products/CartScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import CustomersScreen from '../screens/customers/CustomersScreen';
import CustomerDetailScreen from '../screens/customers/CustomerDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Stack navigators for each tab
const DashboardStack = createNativeStackNavigator();
const ProductsStack = createNativeStackNavigator();
const OrdersStack = createNativeStackNavigator();
const CustomersStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function DashboardStackScreen() {
  return (
    <DashboardStack.Navigator>
      <DashboardStack.Screen 
        name="DashboardHome" 
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
    </DashboardStack.Navigator>
  );
}

function ProductsStackScreen() {
  return (
    <ProductsStack.Navigator>
      <ProductsStack.Screen 
        name="ProductsList" 
        component={ProductsScreen}
        options={{ title: 'Products' }}
      />
      <ProductsStack.Screen 
        name="ProductDetail" 
        component={ProductDetailScreen}
        options={{ title: 'Product Details' }}
      />
      <ProductsStack.Screen 
        name="Cart" 
        component={CartScreen}
        options={{ title: 'Shopping Cart' }}
      />
    </ProductsStack.Navigator>
  );
}

function OrdersStackScreen() {
  return (
    <OrdersStack.Navigator>
      <OrdersStack.Screen 
        name="OrdersList" 
        component={OrdersScreen}
        options={{ title: 'Orders' }}
      />
      <OrdersStack.Screen 
        name="OrderDetail" 
        component={OrderDetailScreen}
        options={{ title: 'Order Details' }}
      />
    </OrdersStack.Navigator>
  );
}

function CustomersStackScreen() {
  const { user } = useAuthStore();
  
  // Only show customers tab for sales agents and admins
  if (user?.role === 'customer') {
    return null;
  }
  
  return (
    <CustomersStack.Navigator>
      <CustomersStack.Screen 
        name="CustomersList" 
        component={CustomersScreen}
        options={{ title: 'Customers' }}
      />
      <CustomersStack.Screen 
        name="CustomerDetail" 
        component={CustomerDetailScreen}
        options={{ title: 'Customer Details' }}
      />
    </CustomersStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen 
        name="ProfileHome" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </ProfileStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
  const { user } = useAuthStore();
  const isCustomer = user?.role === 'customer';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home';

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'dashboard' : 'dashboard';
              break;
            case 'Products':
              iconName = focused ? 'inventory' : 'inventory-2';
              break;
            case 'Orders':
              iconName = focused ? 'receipt' : 'receipt-long';
              break;
            case 'Customers':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStackScreen} />
      <Tab.Screen name="Products" component={ProductsStackScreen} />
      <Tab.Screen name="Orders" component={OrdersStackScreen} />
      {!isCustomer && (
        <Tab.Screen name="Customers" component={CustomersStackScreen} />
      )}
      <Tab.Screen name="Profile" component={ProfileStackScreen} />
    </Tab.Navigator>
  );
}
