import React from 'react';

const DashboardFeatureToggle: React.FC = () => {
  const [isLightweight, setIsLightweight] = React.useState(
    localStorage.getItem('useLightweightDashboard') === 'true'
  );

  const handleToggle = () => {
    const newValue = !isLightweight;
    setIsLightweight(newValue);
    localStorage.setItem('useLightweightDashboard', newValue.toString());
    
    // Show confirmation and reload
    if (window.confirm(`Dashboard will switch to ${newValue ? 'lightweight' : 'standard'} mode. Page will reload.`)) {
      window.location.reload();
    } else {
      // Revert if cancelled
      setIsLightweight(!newValue);
      localStorage.setItem('useLightweightDashboard', (!newValue).toString());
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px 15px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    }}>
      <span>Dashboard Mode:</span>
      <button
        onClick={handleToggle}
        style={{
          background: isLightweight ? '#10b981' : '#6366f1',
          color: 'white',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        {isLightweight ? 'Lightweight (On-Demand)' : 'Standard (Full Load)'}
      </button>
    </div>
  );
};

export default DashboardFeatureToggle;
