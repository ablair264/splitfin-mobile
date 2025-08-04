// src/components/CustomerLayout/CustomerSidebar.tsx
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { 
  FaHome, 
  FaShoppingCart, 
  FaFileInvoice, 
  FaBook, 
  FaUser,
  FaChevronDown,
  FaChevronRight,
  FaPlus,
  FaEye,
  FaEdit,
  FaMoneyBill,
  FaBookOpen,
  FaEnvelope,
  FaBell,
  FaComments,
  FaSignOutAlt
} from 'react-icons/fa';
import { auth, db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useMessaging } from '../../contexts/MessagingContext';
import NotificationCenter from '../Notifications/NotificationCenter';
import './CustomerSidebar.css';

interface MenuItem {
  label: string;
  path?: string;
  icon: React.ReactNode;
  submenu?: {
    label: string;
    path: string;
    icon: React.ReactNode;
  }[];
}

interface CustomerSidebarProps {
  onNavigate?: () => void;
  orderCount?: number;
  onLogout?: () => void;
  isMobile?: boolean;
}

export default function CustomerSidebar({ onNavigate, orderCount = 0, onLogout, isMobile = false }: CustomerSidebarProps) {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [customerDetails, setCustomerDetails] = useState({
    name: 'Customer Portal',
    company: 'Trade Account'
  });

  // Get messaging context for unread messages
  const { unreadTotal, openMessaging } = useMessaging();

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Query customers collection by firebase_uid
        const customerDataQuery = query(
          collection(db, 'customers'),
          where('firebase_uid', '==', user.uid)
        );
        const customerDataSnapshot = await getDocs(customerDataQuery);
        
        if (!customerDataSnapshot.empty) {
          const data = customerDataSnapshot.docs[0].data();
          
          // Get customer name - try different fields
          let name = 'Customer';
          if (data.customer_name && data.customer_name !== data.email) {
            name = data.customer_name;
          } else if (data.first_name || data.last_name) {
            name = `${data.first_name || ''} ${data.last_name || ''}`.trim();
          } else if (data.name) {
            name = data.name;
          } else if (data.contact_name) {
            name = data.contact_name;
          }
          
          // Get company name if available
          const company = data.company_name || data.company || 'Trade Account';
          
          setCustomerDetails({ name, company });
        }
      } catch (error) {
        console.error('Error fetching customer details:', error);
      }
    };

    fetchCustomerDetails();
  }, []);

  useEffect(() => {
    // Auto-expand parent menu if child is active
    menuItems.forEach(item => {
      if (item.submenu) {
        const hasActiveChild = item.submenu.some(sub => isActive(sub.path));
        if (hasActiveChild) {
          setExpandedItems(prev => new Set([...prev, item.label]));
        }
      }
    });
  }, [location.pathname]);

  const toggleExpanded = (label: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(label)) {
      newExpanded.delete(label);
    } else {
      newExpanded.add(label);
    }
    setExpandedItems(newExpanded);
  };

  const handleNavigation = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  const handleActionClick = (action: () => void) => {
    action();
    if (onNavigate) {
      onNavigate();
    }
  };

  const menuItems: MenuItem[] = [
    {
      label: 'Home',
      path: '/customer/dashboard',
      icon: <FaHome />
    },
    {
      label: 'Orders',
      icon: <FaShoppingCart />,
      submenu: [
        { label: 'New Order', path: '/customer/new-order', icon: <FaPlus /> },
        { label: 'View Orders', path: '/customer/orders', icon: <FaEye /> },
      ]
    },
    {
      label: 'Invoices',
      icon: <FaFileInvoice />,
      submenu: [
        { label: 'View Invoices', path: '/customer/invoices', icon: <FaEye /> },
      ]
    },
    {
      label: 'Catalogues',
      icon: <FaBook />,
      submenu: [
        { label: 'View Catalogues', path: '/customer/catalogues', icon: <FaBookOpen /> },
        { label: 'Request Catalogue', path: '/customer/request-catalogue', icon: <FaEnvelope /> }
      ]
    }
  ];

  const isActive = (path: string) => location.pathname === path;
  const isParentActive = (item: MenuItem) => {
    if (item.path) return isActive(item.path);
    return item.submenu?.some(sub => isActive(sub.path)) || false;
  };

  return (
    <aside className="customer-sidebar">
      <div className="sidebar-header">
        <Link to="/customer/dashboard">
          <img src="/logos/dmb-logo.png" alt="DM Brands" className="sidebar-logo" />
        </Link>
      </div>

      {/* Sidebar Actions - Only show on desktop */}
      {!isMobile && (
        <div className="sidebar-actions">
          {/* Shopping Cart */}
          <Link 
            to="/customer/cart" 
            className="sidebar-icon-btn"
            title="Shopping Cart"
          >
            <span className="icon"><FaShoppingCart /></span>
            <span className="label">Shopping Cart</span>
            {orderCount > 0 && <span className="badge">{orderCount}</span>}
          </Link>
          
          {/* Messages */}
          <button 
            className="sidebar-icon-btn messages-btn"
            onClick={() => handleActionClick(openMessaging)}
            title="Messages"
          >
            <span className="icon"><FaComments /></span>
            <span className="label">Messages</span>
            {unreadTotal > 0 && <span className="badge">{unreadTotal}</span>}
          </button>
          
          {/* Notifications - Using NotificationCenter component directly */}
          <div className="notification-center-wrapper">
            <NotificationCenter />
          </div>
          
          {/* Logout */}
          <button 
            className="sidebar-icon-btn logout-btn"
            onClick={() => handleActionClick(onLogout || (() => {}))}
            title="Logout"
          >
            <span className="icon"><FaSignOutAlt /></span>
            <span className="label">Logout</span>
          </button>
        </div>
      )}
      
      <nav className="customer-sidebar-nav">
        {menuItems.map((item) => (
          <div key={item.label} className="nav-item-wrapper">
            {item.path ? (
              <NavLink
                to={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={handleNavigation}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ) : (
              <>
                <button
                  className={`nav-item accordion-toggle ${isParentActive(item) ? 'active' : ''} ${expandedItems.has(item.label) ? 'expanded' : ''}`}
                  onClick={() => toggleExpanded(item.label)}
                  aria-expanded={expandedItems.has(item.label)}
                  aria-controls={`submenu-${item.label.toLowerCase()}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  <span className="nav-chevron">
                    {expandedItems.has(item.label) ? <FaChevronDown /> : <FaChevronRight />}
                  </span>
                </button>
                
                <div 
                  className={`submenu ${expandedItems.has(item.label) ? 'expanded' : ''}`}
                  id={`submenu-${item.label.toLowerCase()}`}
                  role="region"
                  aria-labelledby={`accordion-${item.label.toLowerCase()}`}
                >
                  {item.submenu?.map((subItem) => (
                    <NavLink
                      key={subItem.path}
                      to={subItem.path}
                      className={`submenu-item ${isActive(subItem.path) ? 'active' : ''}`}
                      onClick={handleNavigation}
                    >
                      <span className="submenu-icon">{subItem.icon}</span>
                      <span className="submenu-label">{subItem.label}</span>
                    </NavLink>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </nav>
      
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {customerDetails.name.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <p className="user-name" title={customerDetails.name}>
              {customerDetails.name}
            </p>
            <p className="user-role" title={customerDetails.company}>
              {customerDetails.company}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}