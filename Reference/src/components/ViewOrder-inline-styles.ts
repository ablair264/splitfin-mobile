// Inline styles fallback for ViewOrder component
// Use these if CSS files aren't working

export const viewOrderInlineStyles = {
  container: {
    color: '#ffffff',
  },
  label: {
    color: '#8b98a5',
  },
  value: {
    color: '#ffffff',
  },
  tableCell: {
    color: '#e5e7eb',
  },
  headerText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: '#e5e7eb',
  },
  mutedText: {
    color: '#8b98a5',
  },
  accentText: {
    color: '#79d5e9',
  },
  errorText: {
    color: '#ef4444',
  },
  successText: {
    color: '#22c55e',
  },
  warningText: {
    color: '#fbbf24',
  }
};

// Usage example:
// <div className={styles.orderDetailContainer} style={viewOrderInlineStyles.container}>
//   <span className={styles.label} style={viewOrderInlineStyles.label}>Label</span>
//   <span className={styles.value} style={viewOrderInlineStyles.value}>Value</span>
// </div>
