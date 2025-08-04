// src/components/CustomerLayout/CustomerLayout.tsx
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import CustomerSidebar from './CustomerSidebar';
import { FaBars, FaTimes } from 'react-icons/fa';
import { auth, db } from '../../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import './CustomerLayout.css';

export default function CustomerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Calculate initial order count
    updateOrderCount();

    // Listen for order updates
    const handleOrderUpdate = () => {
      updateOrderCount();
    };

    // Listen for resize events to close mobile sidebar
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('orderUpdated', handleOrderUpdate);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('orderUpdated', handleOrderUpdate);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const updateOrderCount = () => {
    const order = JSON.parse(localStorage.getItem('customerOrder') || '[]');
    const totalItems = order.reduce((sum: number, item: any) => sum + item.quantity, 0);
    setOrderCount(totalItems);
  };

 // Update the handleCustomerLogout function in CustomerLayout.tsx
const handleCustomerLogout = async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      // Update customers collection
      const customerQuery = query(
        collection(db, 'customers'),
        where('firebase_uid', '==', user.uid)
      );
      const snapshot = await getDocs(customerQuery);
      
      if (!snapshot.empty) {
        await updateDoc(snapshot.docs[0].ref, {
          isOnline: false,
          lastSeen: new Date().toISOString()
        });
      }
      
      // Update users collection if exists
      const customerId = sessionStorage.getItem('customerId');
      if (customerId) {
        const userRef = doc(db, 'users', customerId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          await updateDoc(userRef, {
            isOnline: false,
            lastSeen: new Date().toISOString()
          });
        }
      }
    }
    
    // Clear session storage
    sessionStorage.clear();
    
    await signOut(auth);
    navigate('/customer/login');
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

  const closeMobileSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="customer-layout">
      {/* Desktop Sidebar */}
      <CustomerSidebar 
        orderCount={orderCount}
        onLogout={handleCustomerLogout}
      />
      
      {/* Main Content Area */}
      <div className="layout-content">
        {/* Mobile Header - Only visible on mobile */}
        <header className="mobile-header">
          <button 
            className="mobile-menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle navigation menu"
          >
            <FaBars />
          </button>
          <img src="/logos/dmb-logo.png" alt="DM Brands" className="mobile-page-logo" />
        </header>
        
        {/* Main Content */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
      
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`mobile-sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={closeMobileSidebar}
        aria-hidden={!sidebarOpen}
      />
      
      {/* Mobile Sidebar */}
      <div className={`mobile-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="mobile-sidebar-header">
          <img src="/logos/dmb-logo.png" alt="DM Brands" className="mobile-logo" />
          <button 
            className="close-sidebar"
            onClick={closeMobileSidebar}
            aria-label="Close navigation menu"
          >
            <FaTimes />
          </button>
        </div>
        <CustomerSidebar 
          onNavigate={closeMobileSidebar}
          orderCount={orderCount}
          onLogout={handleCustomerLogout}
          isMobile={true}
        />
      </div>
    </div>
  );
}