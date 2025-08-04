import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FaArrowLeft } from 'react-icons/fa';
import MigrationPanel from './MigrationPanel';
import CustomerOrdersMigrationPanel from './CustomerOrdersMigrationPanel';
import CustomerAccountMigration from './CustomerAccountMigration';
import './Settings.css';

export default function Settings() {
  const [userRole, setUserRole] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.data();
        
        setUserRole(userData?.role || '');
        setUserName(userData?.name || currentUser.displayName || '');
        setUserEmail(currentUser.email || '');
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [currentUser, navigate]);

  // Get the current settings tab from the URL
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes('/settings/general')) return 'general';
    if (path.includes('/settings/profile')) return 'profile';
    if (path.includes('/settings/notifications')) return 'notifications';
    if (path.includes('/settings/database')) return 'database';
    if (path.includes('/settings/security')) return 'security';
    return 'general'; // default
  };

  const currentTab = getCurrentTab();

  if (loading) {
    return (
      <div className="settings-loading">
        <div className="spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  // Redirect to general settings if no specific tab is selected
  if (location.pathname === '/settings') {
    navigate('/settings/general');
    return null;
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
          title="Go back"
        >
          <FaArrowLeft />
        </button>
        <h1>Settings - {currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}</h1>
      </div>

      <div className="settings-content">
        <div className="settings-main">
          <div className="settings-section">
            <div className="section-content">
              {currentTab === 'general' && <GeneralSettings userName={userName} userEmail={userEmail} userRole={userRole} />}
              {currentTab === 'profile' && <ProfileSettings />}
              {currentTab === 'notifications' && <NotificationSettings />}
              {currentTab === 'database' && <DatabaseSettings />}
              {currentTab === 'security' && <SecuritySettings />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// General Settings Component
function GeneralSettings({ userName, userEmail, userRole }: { userName: string; userEmail: string; userRole: string }) {
  return (
    <div className="general-settings">
      <div className="setting-group">
        <h3>Account Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Name</label>
            <p>{userName || 'Not set'}</p>
          </div>
          <div className="info-item">
            <label>Email</label>
            <p>{userEmail}</p>
          </div>
          <div className="info-item">
            <label>Role</label>
            <p className="role-badge">{userRole || 'User'}</p>
          </div>
        </div>
      </div>

      <div className="setting-group">
        <h3>Application Preferences</h3>
        <div className="preference-item">
          <div className="preference-info">
            <h4>Theme</h4>
            <p>Choose your preferred color theme</p>
          </div>
          <select className="preference-select" defaultValue="dark">
            <option value="dark">Dark</option>
            <option value="light">Light (Coming soon)</option>
          </select>
        </div>
        
        <div className="preference-item">
          <div className="preference-info">
            <h4>Language</h4>
            <p>Select your preferred language</p>
          </div>
          <select className="preference-select" defaultValue="en">
            <option value="en">English</option>
            <option value="es">Spanish (Coming soon)</option>
            <option value="fr">French (Coming soon)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// Profile Settings Component
function ProfileSettings() {
  return (
    <div className="profile-settings">
      <div className="setting-group">
        <h3>Profile Information</h3>
        <form className="profile-form">
          <div className="form-group">
            <label htmlFor="displayName">Display Name</label>
            <input 
              type="text" 
              id="displayName" 
              placeholder="Enter your display name"
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input 
              type="tel" 
              id="phone" 
              placeholder="Enter your phone number"
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="department">Department</label>
            <input 
              type="text" 
              id="department" 
              placeholder="Enter your department"
              className="form-input"
            />
          </div>
          
          <button type="submit" className="save-button">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}

// Notification Settings Component
function NotificationSettings() {
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    newCustomers: true,
    lowInventory: false,
    dailyReports: true,
    weeklyReports: false
  });

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="notification-settings">
      <div className="setting-group">
        <h3>Email Notifications</h3>
        <div className="notification-list">
          <div className="notification-item">
            <div className="notification-info">
              <h4>Order Updates</h4>
              <p>Receive notifications when order status changes</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={notifications.orderUpdates}
                onChange={() => handleToggle('orderUpdates')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="notification-item">
            <div className="notification-info">
              <h4>New Customers</h4>
              <p>Get notified when new customers are added</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={notifications.newCustomers}
                onChange={() => handleToggle('newCustomers')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="notification-item">
            <div className="notification-info">
              <h4>Low Inventory Alerts</h4>
              <p>Alerts when inventory falls below threshold</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={notifications.lowInventory}
                onChange={() => handleToggle('lowInventory')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div className="setting-group">
        <h3>Report Emails</h3>
        <div className="notification-list">
          <div className="notification-item">
            <div className="notification-info">
              <h4>Daily Reports</h4>
              <p>Receive daily sales and activity reports</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={notifications.dailyReports}
                onChange={() => handleToggle('dailyReports')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="notification-item">
            <div className="notification-info">
              <h4>Weekly Summary</h4>
              <p>Get weekly performance summaries</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={notifications.weeklyReports}
                onChange={() => handleToggle('weeklyReports')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// Database Settings Component (includes Migration Panel) - Admin & Brand Manager only
function DatabaseSettings() {
  const [activeTab, setActiveTab] = useState<'customers' | 'orders' | 'accounts'>('customers');
  
  return (
    <div className="database-settings">
      <div className="setting-group">
        <h3>Database Management - FOR BLAIR'S USE - DO NOT TOUCH!!</h3>
        <p className="setting-description">
          Manage database operations, migrations, and maintenance tasks. These operations should be performed during off-peak hours.
          <br /><small style={{ color: '#a0a0a0', marginTop: '0.5rem', display: 'block' }}>Access restricted to Admins and Brand Managers</small>
        </p>
      </div>

      {/* Migration Tabs */}
      <div className="setting-group">
        <div className="migration-tabs">
          <button 
            className={`migration-tab ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            Customer Data Migration
          </button>
          <button 
            className={`migration-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            Customer Orders Migration
          </button>
          <button 
            className={`migration-tab ${activeTab === 'accounts' ? 'active' : ''}`}
            onClick={() => setActiveTab('accounts')}
          >
            Customer Account Creation
          </button>
        </div>
        
        {/* Migration Panels */}
        {activeTab === 'customers' && <MigrationPanel />}
        {activeTab === 'orders' && <CustomerOrdersMigrationPanel />}
        {activeTab === 'accounts' && <CustomerAccountMigration />}
      </div>

      {/* Additional Database Tools */}
      <div className="setting-group">
        <h3>Additional Tools</h3>
        <div className="tools-grid">
          <button className="tool-button" disabled>
            <span>Export Data</span>
            <small>Coming soon</small>
          </button>
          
          <button className="tool-button" disabled>
            <span>Backup Database</span>
            <small>Coming soon</small>
          </button>
          
          <button className="tool-button" disabled>
            <span>Clear Cache</span>
            <small>Coming soon</small>
          </button>
        </div>
      </div>
    </div>
  );
}

// Security Settings Component
function SecuritySettings() {
  return (
    <div className="security-settings">
      <div className="setting-group">
        <h3>Password & Authentication</h3>
        <button className="action-button">
          Change Password
        </button>
      </div>

      <div className="setting-group">
        <h3>Two-Factor Authentication</h3>
        <p className="setting-description">
          Add an extra layer of security to your account by enabling two-factor authentication.
        </p>
        <button className="action-button secondary" disabled>
          Enable 2FA (Coming soon)
        </button>
      </div>

      <div className="setting-group">
        <h3>Active Sessions</h3>
        <p className="setting-description">
          View and manage your active sessions across different devices.
        </p>
        <div className="session-list">
          <div className="session-item">
            <div className="session-info">
              <h4>Current Session</h4>
              <p>Chrome on Windows • Active now</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}