// src/layouts/MasterLayout.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, getDocs, doc, updateDoc } from 'firebase/firestore';
import {
  FaChartLine, FaUsers, FaClipboardList, FaWarehouse, FaShoppingCart, FaCog, 
  FaPowerOff, FaChevronDown, FaChevronRight, FaPlus, FaKey, FaBars, FaTimes,
  FaMap, FaUserPlus, FaEnvelope, FaBell, FaFileInvoice, FaUserTie, FaFileAlt,
  FaUser, FaQuestionCircle, FaPalette, FaHome, FaDatabase, FaShieldAlt,
  FaBoxes, FaBox, FaImages, FaBook, FaFileAlt as FaCatalogue
} from 'react-icons/fa';
import './MasterLayout.css';
import { useUser } from '../components/UserContext';
import NotificationCenter from '../components/Notifications/NotificationCenter';
import { useMessaging } from '../contexts/MessagingContext';
import ThemeSelector from '../components/ThemeSelector/ThemeSelector';

type Section = 'Dashboard' | 'Customers' | 'Orders' | 'Inventory' | 'Live Stocklists' | 'Catalogue Builder' | 'Purchase Orders' | 'Agent Management' | 'Image Management' | 'Settings' | 'Catalogue Library';

interface NavLink {
  to: string;
  label: string;
  icon?: React.ReactNode;
}

const brands = [
  { name: 'Blomus', path: 'blomus', id: 'blomus' },
  { name: 'Elvang', path: 'elvang', id: 'elvang' },
  { name: 'My Flame Lifestyle', path: 'my-flame-lifestyle', id: 'my-flame-lifestyle' },
  { name: 'GEFU', path: 'gefu', id: 'gefu' },
  { name: 'PPD', path: 'ppd', id: 'ppd' },
  { name: 'Räder', path: 'rader', id: 'rader' },
  { name: 'Remember', path: 'remember', id: 'remember' },
  { name: 'Relaxound', path: 'relaxound', id: 'relaxound' },
];

// Settings Dropdown Component
function SettingsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowThemeDropdown(false);
      }
    }

    if (isOpen || showThemeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, showThemeDropdown]);

  const handleThemeClick = () => {
    setShowThemeDropdown(!showThemeDropdown);
    setIsOpen(false);
  };

  return (
    <div className="settings-dropdown-wrapper" ref={dropdownRef}>
      <button 
        className="master-sidebar-action-btn settings-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Settings"
      >
        <FaCog />
      </button>
      
      {isOpen && (
        <div className="settings-dropdown">
          <button onClick={handleThemeClick} className="settings-option">
            <FaPalette /> Theme
          </button>
          <button onClick={() => { navigate('/profile'); setIsOpen(false); }} className="settings-option">
            <FaUser /> Profile
          </button>
          <button onClick={() => { navigate('/help'); setIsOpen(false); }} className="settings-option">
            <FaQuestionCircle /> Help
          </button>
        </div>
      )}
      
      {showThemeDropdown && (
        <div className="theme-dropdown-wrapper">
          <ThemeSelector isEmbedded={true} onClose={() => setShowThemeDropdown(false)} />
        </div>
      )}
    </div>
  );
}

function Breadcrumbs() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    
    // Don't show breadcrumbs on dashboard
    if (pathnames.length === 0 || (pathnames.length === 1 && pathnames[0] === 'dashboard')) {
      return [];
    }
    
    const breadcrumbNameMap: { [key: string]: string } = {
      dashboard: 'Dashboard',
      customers: 'Customers',
      'new': 'New Customer',
      orders: 'Orders',
      approval: 'Approvals',
      invoices: 'Invoices',
      inventory: 'Inventory',
      products: 'Products',
      images: 'Image Management',
      items: 'Items',
      edit: 'Edit',
      brand: 'Brands',
      blomus: 'Blomus',
      elvang: 'Elvang',
      'my-flame-lifestyle': 'My Flame',
      myflamelifestyle: 'My Flame Lifestyle',
      gefu: 'GEFU',
      ppd: 'PPD',
      rader: 'Räder',
      remember: 'Remember',
      relaxound: 'Relaxound',
      'purchase-orders': 'Purchase Orders',
      'order-management': 'Order Management',
      'purchase-suggestions': 'Purchase Assistant',
      reports: 'Reports',
      saved: 'Saved Reports',
      templates: 'Report Templates',
      agents: 'Agent Management',
      settings: 'Settings',
      profile: 'Profile',
      help: 'Help',
      map: 'Customer Map',
      management: 'Account Management',
      'catalogue-library': 'Catalogue Library',
      catalogues: 'Catalogue Library',
      'catalogue-builder': 'Catalogue Builder'
    };
    
    return pathnames.map((value, index) => {
      const to = `/${pathnames.slice(0, index + 1).join('/')}`;
      const isLast = index === pathnames.length - 1;
      const name = breadcrumbNameMap[value] || value.charAt(0).toUpperCase() + value.slice(1);
      
      return { name, to, isLast };
    });
  };
  
  const breadcrumbs = generateBreadcrumbs();
  
  if (breadcrumbs.length === 0) {
    return null;
  }
  
  return (
    <div className="breadcrumbs">
      <Link to="/dashboard" className="breadcrumb-item">
        <FaHome className="breadcrumb-icon" />
        <span>Home</span>
      </Link>
      {breadcrumbs.map((breadcrumb, index) => (
        <React.Fragment key={breadcrumb.to}>
          <span className="breadcrumb-separator">/</span>
          {breadcrumb.isLast ? (
            <span className="breadcrumb-item active">{breadcrumb.name}</span>
          ) : (
            <Link to={breadcrumb.to} className="breadcrumb-item">
              {breadcrumb.name}
            </Link>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function MasterLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useUser();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  
  const messaging = useMessaging();

  // Close mobile menu whenever the route changes
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  // Auto-open settings, dashboard, and inventory sections when on their respective pages
  useEffect(() => {
    if (location.pathname.startsWith('/settings') && !openSections.has('Settings')) {
      setOpenSections(prev => new Set([...prev, 'Settings']));
    }
    if (location.pathname.startsWith('/dashboard') && !openSections.has('Dashboard')) {
      setOpenSections(prev => new Set([...prev, 'Dashboard']));
    }
    if (location.pathname.startsWith('/inventory') && !openSections.has('Inventory')) {
      setOpenSections(prev => new Set([...prev, 'Inventory']));
    }
    if (location.pathname.startsWith('/images') && !openSections.has('Image Management')) {
      setOpenSections(prev => new Set([...prev, 'Image Management']));
    }
    if (location.pathname.includes('/catalogue-builder') && !openSections.has('Catalogue Builder')) {
      setOpenSections(prev => new Set([...prev, 'Catalogue Builder']));
    }
  }, [location.pathname, openSections]);

  // Set user online when component mounts
  useEffect(() => {
    if (user?.uid) {
      const setUserOnline = async () => {
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            isOnline: true,
            lastSeen: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error setting user online:', error);
        }
      };
      setUserOnline();
    }
  }, [user]);

  // Fetch pending approvals count for brand managers
  useEffect(() => {
    if (user?.role === 'brandManager') {
      const fetchPendingOrders = async () => {
        try {
          const q = query(
            collection(db, 'pending_orders'),
            where('status', '==', 'pending_approval')
          );
          const snapshot = await getDocs(q);
          setPendingOrders(snapshot.size);
        } catch (error) {
          console.error('Error fetching pending orders:', error);
        }
      };
      
      fetchPendingOrders();
      
      const unsubscribe = onSnapshot(
        query(collection(db, 'pending_orders'), where('status', '==', 'pending_approval')),
        (snapshot) => {
          setPendingOrders(snapshot.size);
        },
        (error) => {
          console.error('Error listening to pending orders:', error);
        }
      );
      
      return () => unsubscribe();
    }
  }, [user]);

  // Update message unread count from messaging context
  useEffect(() => {
    if (messaging?.unreadTotal !== undefined) {
      setUnreadMessagesCount(messaging.unreadTotal);
    }
  }, [messaging?.unreadTotal]);

  const toggleSection = (section: string) => {
    setOpenSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const handleLogout = async () => {
    try {
      if (user?.uid) {
        await updateDoc(doc(db, 'users', user.uid), {
          isOnline: false,
          lastSeen: new Date().toISOString()
        });
      }
      
      await signOut(auth);
      localStorage.clear();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleMessagesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (messaging?.openMessaging) {
      messaging.openMessaging();
    }
  };

  const getSectionConfig = () => {
    const config: Record<Section, { icon: React.ReactNode; links: NavLink[] }> = {
      Dashboard: {
        icon: <FaChartLine />,
        links: user?.role === 'brandManager' ? [
          { to: '/dashboard', label: 'Overview', icon: <FaChartLine /> },
          { to: '/dashboard/orders', label: 'Orders', icon: <FaClipboardList /> },
          { to: '/dashboard/revenue', label: 'Revenue', icon: <FaShoppingCart /> },
          { to: '/dashboard/invoices', label: 'Invoices', icon: <FaFileInvoice /> },
          { to: '/dashboard/brands', label: 'Brands', icon: <FaBoxes /> },
          { to: '/dashboard/forecasting', label: 'Forecasting', icon: <FaChartLine /> }
        ] : user?.role === 'salesAgent' ? [
          { to: '/dashboard', label: 'Overview', icon: <FaChartLine /> },
          { to: '/dashboard/orders', label: 'My Orders', icon: <FaClipboardList /> },
          { to: '/dashboard/invoices', label: 'Invoices', icon: <FaFileInvoice /> }
        ] : [
          { to: '/dashboard', label: 'Overview', icon: <FaChartLine /> }
        ]
      },
      Customers: {
        icon: <FaUsers />,
        links: [
          { to: '/customers/new', label: 'Add New Customer', icon: <FaPlus /> },
          { to: '/customers', label: 'View All Customers', icon: <FaKey /> },
          { to: '/customers/map', label: 'Customer Map', icon: <FaMap /> },
          ...(user?.role === 'brandManager' ? [
            { 
              to: '/customers/approval', 
              label: `Pending Approvals${pendingApprovals > 0 ? ` (${pendingApprovals})` : ''}`, 
              icon: <FaUserPlus /> 
            },
            { 
              to: '/customers/management', 
              label: 'Account Management', 
              icon: <FaKey /> 
            }
          ] : [])
        ]
      },
      Orders: {
        icon: <FaClipboardList />,
        links: [
          { to: '/customers', label: 'New Order', icon: <FaPlus /> },
          { to: '/orders', label: 'View All Orders', icon: <FaKey /> },
          ...(user?.role === 'brandManager' ? [
            { 
              to: '/orders/approval', 
              label: `Order Approvals${pendingOrders > 0 ? ` (${pendingOrders})` : ''}`, 
              icon: <FaUserPlus /> 
            },
            { to: '/invoices', label: 'Invoices', icon: <FaFileInvoice /> }
          ] : [])
        ]
      },
      Inventory: {
        icon: <FaBoxes />,
        links: [
          { to: '/inventory/overview', label: 'Overview', icon: <FaChartLine /> },
          { to: '/inventory/products', label: 'Products', icon: <FaBox /> },
          { to: '/inventory/couriers', label: 'Couriers', icon: <FaShoppingCart /> },
          { to: '/inventory/warehouse', label: 'Warehouse', icon: <FaWarehouse /> },
          { to: '/inventory/deliveries', label: 'Deliveries', icon: <FaClipboardList /> }
        ]
      },
      'Image Management': {
        icon: <FaImages />,
        links: [
          { to: '/images', label: 'All Images', icon: <FaImages /> },
          ...brands.map(b => ({ 
            to: `/images/${b.id}`, 
            label: b.name,
            icon: <FaBox />
          }))
        ]
      },
      'Live Stocklists': {
        icon: <FaWarehouse />,
        links: brands.map(b => ({ to: `/brand/${b.path}`, label: b.name }))
      },
      'Catalogue Builder': {
        icon: <FaCatalogue />,
        links: brands.map(b => ({ to: `/brand/${b.path}/catalogue-builder`, label: b.name, icon: <FaBox /> }))
      },
      'Purchase Orders': {
        icon: <FaShoppingCart />,
        links: user?.role !== 'salesAgent' ? [
          { to: '/purchase-orders/new', label: 'New Purchase Order', icon: <FaPlus /> },
          { to: '/purchase-orders', label: 'View Purchase Orders', icon: <FaKey /> },
          { to: '/purchase-orders/order-management', label: 'Order Management', icon: <FaCog /> },
          { to: '/purchase-orders/purchase-suggestions', label: 'Purchase Assistant', icon: <FaKey /> }
        ] : []
      },
      'Agent Management': {
        icon: <FaUserTie />,
        links: []
      },
      Settings: {
        icon: <FaCog />,
        links: [
          { to: '/settings/general', label: 'General', icon: <FaCog /> },
          { to: '/settings/profile', label: 'Profile', icon: <FaUser /> },
          { to: '/settings/notifications', label: 'Notifications', icon: <FaBell /> },
          ...(user?.role === 'admin' || user?.role === 'brandManager' ? [
            { to: '/settings/database', label: 'Database', icon: <FaDatabase /> }
          ] : []),
          { to: '/settings/security', label: 'Security', icon: <FaShieldAlt /> }
        ]
      },
      'Catalogue Library': {
        icon: <FaBook />,
        links: []
      }
    };
    return config;
  };

  const getAvailableSections = (): Section[] => {
    if (!user) return ['Dashboard'];
    
    if (user.role === 'salesAgent') {
      return ['Dashboard', 'Customers', 'Orders', 'Live Stocklists', 'Catalogue Builder', 'Catalogue Library', 'Image Management'];
    } else if (user.role === 'brandManager') {
      return ['Dashboard', 'Customers', 'Orders', 'Inventory', 'Live Stocklists', 'Catalogue Builder', 'Purchase Orders', 'Agent Management', 'Catalogue Library', 'Image Management', 'Settings'];
    } else {
      return ['Dashboard', 'Customers', 'Orders', 'Inventory', 'Live Stocklists', 'Catalogue Builder', 'Purchase Orders', 'Agent Management', 'Image Management', 'Settings'];
    }
  };

  if (!user) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading...</p>
        </div>
      </div>
    );
  }

  const availableSections = getAvailableSections();
  const sectionConfig = getSectionConfig();
  
  const renderNavLinks = () => (
    availableSections.map(section => {
      const config = sectionConfig[section];
      const isOpen = openSections.has(section);
      const hasSubItems = config.links.length > 0;
      const isDashboard = section === 'Dashboard';
      const isSettings = section === 'Settings';
      const isInventory = section === 'Inventory';
      const isAgentManagement = section === 'Agent Management';
      const isCatalogueLibrary = section === 'Catalogue Library';
      const isCatalogueBuilder = section === 'Catalogue Builder';
      if (isAgentManagement) {
        return <Link key={section} to="/agents" className={`master-sidebar-nav-item ${location.pathname === '/agents' ? 'active' : ''}`}><span className="nav-icon">{config.icon}</span><span className="nav-text">{section}</span></Link>;
      }
      if (isCatalogueLibrary) {
        return <Link key={section} to="/catalogue-library" className={`master-sidebar-nav-item ${location.pathname === '/catalogue-library' ? 'active' : ''}`}><span className="nav-icon">{config.icon}</span><span className="nav-text">{section}</span></Link>;
      }
      return (
        <div key={section} className="master-sidebar-nav-section">
          <button className={`master-sidebar-nav-item ${isOpen ? 'active' : ''} ${location.pathname.startsWith('/settings') && isSettings ? 'active' : ''} ${location.pathname.startsWith('/dashboard') && isDashboard ? 'active' : ''} ${location.pathname.startsWith('/inventory') && isInventory ? 'active' : ''} ${location.pathname.includes('/catalogue-builder') && isCatalogueBuilder ? 'active' : ''}`} onClick={() => toggleSection(section)}>
            <span className="nav-icon">{config.icon}</span>
            <span className="nav-text">{section}</span>
            {hasSubItems && <span className="nav-chevron">{isOpen ? <FaChevronDown /> : <FaChevronRight />}</span>}
          </button>
          {hasSubItems && (
            <div className={`master-sidebar-dropdown ${isOpen ? 'open' : ''}`}>
              {config.links.map(link => (
                <Link key={link.to} to={link.to} className={`master-sidebar-dropdown-item ${location.pathname === link.to ? 'active' : ''}`}>
                  {link.icon && <span className="dropdown-icon">{link.icon}</span>}
                  <span className="dropdown-text">{link.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    })
  );

  return (
    <div className="master-layout-container">
      {/* Desktop Sidebar */}
      <nav className="master-sidebar-nav desktop-only">
        {/* Top Actions Bar */}
        <div className="master-sidebar-top-actions">
          <NotificationCenter />
          <button 
            className="master-sidebar-action-btn messages-btn"
            onClick={handleMessagesClick}
          >
            <FaEnvelope />
            {unreadMessagesCount > 0 && (
              <span className="action-badge">{unreadMessagesCount}</span>
            )}
          </button>
          <button 
            className="master-sidebar-action-btn logout-btn"
            onClick={handleLogout}
          >
            <FaPowerOff />
          </button>
        </div>

        {/* User Section */}
        <div className="master-sidebar-user-section">
          <div className="master-user-avatar"><span>{user.name.charAt(0).toUpperCase()}</span></div>
          <div className="master-user-info">
            <h4>{user.name}</h4>
            <p>{user.role === 'salesAgent' ? 'Sales Agent' : user.role === 'brandManager' ? 'Brand Manager' : 'Admin'}</p>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="master-sidebar-nav-sections">
          {renderNavLinks()}
        </div>

        {/* Logo at Bottom */}
        <div className="master-sidebar-footer">
          <div className="master-sidebar-logo">
            <img src="/logos/splitfinrow.png" alt="Splitfin Logo" className="master-logo-image" />
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="master-main-content">
        {/* Desktop Header Bar with Breadcrumbs */}
        <div className="master-header-bar desktop-only">
          <div className="master-header-left">
            <Breadcrumbs />
          </div>
        </div>

        {/* Mobile Top Bar */}
        <header className="master-mobile-top-bar mobile-only">
          <div className="master-sidebar-logo">
            <img src="/logos/splitfinrow.png" alt="Splitfin Logo" className="master-mobile-logo" />
          </div>
          <div className="master-mobile-controls">
            <NotificationCenter />
            <button 
              type="button"
              className="master-mobile-menu-toggle" 
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            >
              {isMobileNavOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {isMobileNavOpen && (
          <div 
            className="master-mobile-overlay mobile-only"
            onClick={() => setIsMobileNavOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <nav className={`master-mobile-nav mobile-only ${isMobileNavOpen ? 'open' : ''}`}>
          <div className="master-mobile-nav-header">
            <button
              onClick={() => setIsMobileNavOpen(false)}
              className="master-mobile-close"
            >
              <FaTimes />
            </button>
          </div>
          <div className="master-mobile-user-section">
            <div className="master-user-avatar"><span>{user.name.charAt(0).toUpperCase()}</span></div>
            <div className="master-user-info">
              <h4>{user.name}</h4>
              <p>{user.role === 'salesAgent' ? 'Sales Agent' : user.role === 'brandManager' ? 'Brand Manager' : 'Admin'}</p>
            </div>
          </div>
          <div className="master-sidebar-nav-sections">
            {renderNavLinks()}
          </div>
          <div className="master-mobile-nav-footer">
            <ThemeSelector />
            <button onClick={handleLogout} className="master-logout-btn">
              <FaPowerOff />
              <span>Logout</span>
            </button>
          </div>
        </nav>

        {/* Content Area */}
        <div className="master-content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
}