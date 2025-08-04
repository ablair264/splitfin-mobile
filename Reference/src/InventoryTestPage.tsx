// Test page to verify inventory setup
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import InventoryDashboard from './components/InventoryManagement/InventoryDashboard';
import InventoryProducts from './components/InventoryManagement/InventoryProducts';

const InventoryTestPage: React.FC = () => {
  return (
    <Router>
      <div style={{ padding: '20px' }}>
        <h1>Inventory Management Test</h1>
        <nav style={{ marginBottom: '20px' }}>
          <Link to="/inventory/dashboard" style={{ marginRight: '20px' }}>Dashboard</Link>
          <Link to="/inventory/products">Products</Link>
        </nav>
        
        <Routes>
          <Route path="/inventory/dashboard" element={<InventoryDashboard />} />
          <Route path="/inventory/products" element={<InventoryProducts />} />
          <Route path="/" element={
            <div>
              <p>Click on the links above to test the inventory system.</p>
              <ul>
                <li>Dashboard - Shows inventory statistics</li>
                <li>Products - Lists all items from items_data collection</li>
              </ul>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
};

export default InventoryTestPage;
