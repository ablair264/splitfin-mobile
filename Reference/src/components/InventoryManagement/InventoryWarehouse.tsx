import React from 'react';
import { FaWarehouse } from 'react-icons/fa';
import './InventoryWarehouse.css';

const InventoryWarehouse: React.FC = () => {
  return (
    <div className="inventory-warehouse">
      <div className="warehouse-header">
        <h1>Warehouse</h1>
        <p>Manage your warehouse operations and storage</p>
      </div>

      <div className="coming-soon-container">
        <FaWarehouse className="coming-soon-icon" />
        <h2>Coming Soon</h2>
        <p>Warehouse management features are currently under development.</p>
      </div>
    </div>
  );
};

export default InventoryWarehouse;
