export const spacing = {
  // Base spacing unit
  unit: 4,
  
  // Spacing scale
  0: 0,
  1: 4,   // 0.25rem
  2: 8,   // 0.5rem
  3: 12,  // 0.75rem
  4: 16,  // 1rem
  5: 20,  // 1.25rem
  6: 24,  // 1.5rem
  7: 28,  // 1.75rem
  8: 32,  // 2rem
  9: 36,  // 2.25rem
  10: 40, // 2.5rem
  11: 44, // 2.75rem
  12: 48, // 3rem
  14: 56, // 3.5rem
  16: 64, // 4rem
  20: 80, // 5rem
  24: 96, // 6rem
  28: 112, // 7rem
  32: 128, // 8rem
  36: 144, // 9rem
  40: 160, // 10rem
  44: 176, // 11rem
  48: 192, // 12rem
  52: 208, // 13rem
  56: 224, // 14rem
  60: 240, // 15rem
  64: 256, // 16rem
  72: 288, // 18rem
  80: 320, // 20rem
  96: 384, // 24rem
};

// Layout specific spacing
export const layout = {
  // Container padding
  containerPadding: spacing[4],
  containerPaddingLarge: spacing[6],
  
  // Card spacing
  cardPadding: spacing[4],
  cardMargin: spacing[4],
  cardGap: spacing[3],
  
  // Component spacing
  componentMargin: spacing[4],
  componentPadding: spacing[3],
  
  // Header heights
  headerHeight: 60,
  tabBarHeight: 80,
  
  // Sidebar width (for tablet)
  sidebarWidth: 240,
  sidebarCollapsedWidth: 60,
  
  // Input dimensions
  inputHeight: 48,
  inputPadding: spacing[3],
  
  // Button dimensions
  buttonHeight: {
    small: 32,
    medium: 40,
    large: 48,
  },
  buttonPadding: {
    small: spacing[2],
    medium: spacing[3],
    large: spacing[4],
  },
  
  // Border radius
  borderRadius: {
    none: 0,
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
    '2xl': 16,
    '3xl': 24,
    full: 9999,
  },
  
  // Border width
  borderWidth: {
    none: 0,
    thin: 1,
    medium: 2,
    thick: 4,
  },
  
  // Shadow/elevation
  elevation: {
    none: 0,
    small: 2,
    medium: 4,
    large: 8,
    xl: 16,
  },
};

export type Spacing = typeof spacing;
export type Layout = typeof layout;