export const colors = {
  // Primary colors from Splitfin screenshots
  primary: {
    50: '#E6FFFA',
    100: '#B2F5EA',
    200: '#81E6D9',
    300: '#4FD1C7', // Main teal accent from screenshots
    400: '#38B2AC',
    500: '#319795',
    600: '#2C7A7B',
    700: '#285E61',
    800: '#234E52',
    900: '#1D4044',
  },
  
  // Dark theme background colors
  background: {
    primary: '#1A202C', // Main dark navy background
    secondary: '#2D3748', // Slightly lighter for cards
    tertiary: '#4A5568', // Even lighter for hover states
    card: '#2D3748', // Card backgrounds
    elevated: '#374151', // Elevated surfaces
  },
  
  // Text colors
  text: {
    primary: '#FFFFFF', // White text on dark backgrounds
    secondary: '#E2E8F0', // Slightly dimmed white
    tertiary: '#A0AEC0', // Muted text
    disabled: '#718096', // Disabled text
    accent: '#4FD1C7', // Teal for links/highlights
  },
  
  // Status colors
  status: {
    success: '#48BB78', // Green for "In Stock", "Paid"
    warning: '#ED8936', // Orange for warnings
    error: '#F56565', // Red for errors/overdue
    info: '#4299E1', // Blue for info
  },
  
  // Chart colors (from screenshots)
  chart: {
    primary: '#4FD1C7', // Teal
    secondary: '#63B3ED', // Light blue
    tertiary: '#ED8936', // Orange
    quaternary: '#48BB78', // Green
    line: '#81E6D9', // Light teal for line charts
  },
  
  // Border colors
  border: {
    primary: '#4A5568',
    secondary: '#2D3748',
    accent: '#4FD1C7',
  },
  
  // Button colors
  button: {
    primary: '#4FD1C7', // Teal primary buttons
    primaryHover: '#38B2AC',
    secondary: '#ED8936', // Orange secondary buttons
    secondaryHover: '#DD6B20',
    ghost: 'transparent',
    ghostHover: '#2D3748',
  },
  
  // Input colors
  input: {
    background: '#2D3748',
    border: '#4A5568',
    focus: '#4FD1C7',
    placeholder: '#A0AEC0',
  },
  
  // Common UI colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export type ColorScheme = typeof colors;