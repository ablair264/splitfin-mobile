// Inline style objects to force text visibility in ViewOrder component

export const viewOrderStyles = {
  // Container styles
  container: {
    color: '#ffffff',
    backgroundColor: '#0f1419',
  },
  
  // Header styles
  orderNumber: {
    color: '#ffffff',
    fontSize: '28px',
    fontWeight: 700,
    margin: 0,
  },
  
  // Card title styles
  cardTitle: {
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 600,
    margin: '0 0 20px 0',
  },
  
  // Label styles
  label: {
    color: '#8b98a5',
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  
  // Value styles
  value: {
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 500,
  },
  
  // Status label styles
  statusLabel: {
    color: '#e5e7eb',
    fontSize: '14px',
  },
  
  // Active status
  activeStatusLabel: {
    color: '#79d5e9',
    fontWeight: 600,
  },
  
  // Table cell styles
  tableCell: {
    color: '#e5e7eb',
    fontSize: '14px',
  },
  
  // Table header styles
  tableHeader: {
    color: '#8b98a5',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  
  // Info group styles
  infoGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  
  // Summary row styles
  summaryLabel: {
    color: '#8b98a5',
    fontSize: '14px',
  },
  
  summaryValue: {
    color: '#e5e7eb',
    fontSize: '14px',
    fontWeight: 500,
  },
  
  // Total row styles
  totalLabel: {
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 700,
  },
  
  totalValue: {
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 700,
  },
  
  // Button styles
  button: {
    color: '#79d5e9',
  },
  
  // Error text
  errorText: {
    color: '#ef4444',
  },
  
  // Success text
  successText: {
    color: '#22c55e',
  },
  
  // Warning text
  warningText: {
    color: '#fbbf24',
  },
  
  // Tracking number
  trackingNumber: {
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: 600,
    fontFamily: "'Courier New', monospace",
  },
  
  // Delivery date
  deliveryDate: {
    color: '#79d5e9',
    fontSize: '16px',
    fontWeight: 600,
  },
  
  // Section background
  sectionBg: {
    backgroundColor: 'rgba(26, 31, 42, 0.95)',
    border: '1px solid rgba(121, 213, 233, 0.2)',
    borderRadius: '20px',
    padding: '24px',
  },
  
  // Hover state
  hoverBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  
  // Active state
  activeBg: {
    backgroundColor: 'rgba(121, 213, 233, 0.1)',
  },
  
  // Tab styles
  tab: {
    color: '#8b98a5',
  },
  
  activeTab: {
    color: '#79d5e9',
  },
  
  // General text fix
  whiteText: {
    color: '#ffffff !important',
  },
  
  lightGrayText: {
    color: '#e5e7eb !important',
  },
  
  mutedGrayText: {
    color: '#8b98a5 !important',
  },
  
  accentBlueText: {
    color: '#79d5e9 !important',
  },
};

// Helper function to apply styles
export const applyStyles = (baseClass: string, inlineStyle: any) => ({
  className: baseClass,
  style: inlineStyle
});
