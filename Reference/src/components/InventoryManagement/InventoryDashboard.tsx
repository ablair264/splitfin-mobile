import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaBox, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaTimesCircle,
  FaChartBar,
  FaUsers,
  FaShoppingCart,
  FaFileInvoice,
  FaWarehouse
} from 'react-icons/fa';
import { dashboardService } from '../../services/inventoryService';
import { formatCurrency } from '../../types/inventory';
import { ProgressLoader } from '../ProgressLoader';
import { useDeviceDetection, useDeviceConditional } from '../../hooks/useDeviceDetection';
import './InventoryDashboard.css';

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalValue: number;
  lowStockValue: number;
}

const InventoryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalValue: 0,
    lowStockValue: 0,
  });
  
  const deviceInfo = useDeviceDetection();
  const { showOnIPad, showOnDesktop, showInPortrait, showInLandscape } = useDeviceConditional();

  const loadDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const dashboardStats = await dashboardService.getStats();
      setStats(dashboardStats);
    } catch (err) {
      setError('Failed to load dashboard statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'blue', 
    subtitle,
    onClick 
  }: {
    title: string;
    value: string | number;
    icon: any;
    color?: string;
    subtitle?: string;
    onClick?: () => void;
  }) => (
    <div 
      className={`stat-card stat-card-${color} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      <div className="stat-icon">
        <Icon />
      </div>
      <div className="stat-content">
        <h3 className="stat-title">{title}</h3>
        <div className="stat-value">{value}</div>
        {subtitle && <div className="stat-subtitle">{subtitle}</div>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="inventory-dashboard-loading">
        <ProgressLoader 
          progress={0} 
          message="Loading Inventory Dashboard"
          submessage="Fetching your inventory statistics..."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="inventory-dashboard-error">
        <FaTimesCircle />
        <h3>Error Loading Dashboard</h3>
        <p>{error}</p>
        <button onClick={loadDashboardStats}>Retry</button>
      </div>
    );
  }

  return (
    <div className="inventory-dashboard">
      <div className="dashboard-header">
        <h1>Inventory Dashboard</h1>
        <p>Overview of your inventory system</p>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={FaBox}
          color="blue"
          subtitle={`${stats.activeProducts} active`}
          onClick={() => navigate('/inventory/products')}
        />
        
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockProducts}
          icon={FaExclamationTriangle}
          color="warning"
          subtitle={formatCurrency(stats.lowStockValue)}
          onClick={() => navigate('/inventory/products?filter=low-stock')}
        />
        
        <StatCard
          title="Out of Stock"
          value={stats.outOfStockProducts}
          icon={FaTimesCircle}
          color="danger"
          onClick={() => navigate('/inventory/products?filter=out-of-stock')}
        />
        
        <StatCard
          title="Total Value"
          value={formatCurrency(stats.totalValue)}
          icon={FaChartBar}
          color="success"
        />
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button 
            className="action-button"
            onClick={() => navigate('/inventory/products')}
          >
            <FaBox />
            <span>Manage Products</span>
          </button>
          
          <button 
            className="action-button"
            onClick={() => navigate('/inventory/items/new')}
          >
            <FaBox />
            <span>Add New Item</span>
          </button>
          
          <button 
            className="action-button"
            onClick={() => navigate('/inventory/items/import')}
          >
            <FaFileInvoice />
            <span>Import Items</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryDashboard;
