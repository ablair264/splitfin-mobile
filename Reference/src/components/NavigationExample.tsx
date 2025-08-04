import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaHome, 
  FaShoppingCart, 
  FaUsers, 
  FaBoxes, 
  FaChartLine, 
  FaCog,
  FaSignOutAlt 
} from 'react-icons/fa';
import { auth } from '../firebase';
import './Navigation.css';

// Example navigation component with Settings link
export default function Navigation() {
  const location = useLocation();
  const currentPath = location.pathname;

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <FaHome /> },
    { path: '/orders', label: 'Orders', icon: <FaShoppingCart /> },
    { path: '/customers', label: 'Customers', icon: <FaUsers /> },
    { path: '/inventory', label: 'Inventory', icon: <FaBoxes /> },
    { path: '/analytics', label: 'Analytics', icon: <FaChartLine /> },
    { path: '/settings', label: 'Settings', icon: <FaCog /> },
  ];

  return (
    <nav className="navigation">
      <div className="nav-header">
        <h2>Splitfin</h2>
      </div>

      <div className="nav-menu">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${currentPath === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="nav-footer">
        <button onClick={handleLogout} className="nav-item logout">
          <span className="nav-icon"><FaSignOutAlt /></span>
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </nav>
  );
}

// CSS for navigation (Navigation.css)
const navigationStyles = `
.navigation {
  width: 250px;
  height: 100vh;
  background: #1a1f2a;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
}

.nav-header {
  padding: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-header h2 {
  margin: 0;
  color: #79d5e9;
  font-size: 1.5rem;
}

.nav-menu {
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: 8px;
  color: #a0a0a0;
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #e0e0e0;
}

.nav-item.active {
  background: rgba(68, 131, 130, 0.15);
  color: #79d5e9;
}

.nav-icon {
  font-size: 1.1rem;
  width: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-label {
  font-size: 0.95rem;
  font-weight: 500;
}

.nav-footer {
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-item.logout {
  color: #f44336;
}

.nav-item.logout:hover {
  background: rgba(244, 67, 54, 0.1);
}
`;