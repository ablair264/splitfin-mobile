// src/hooks/useResponsive.ts
import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

export interface ResponsiveInfo {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  deviceType: 'phone' | 'large-phone' | 'tablet';
  isTablet: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  shouldShowSidebar: boolean;
  shouldShowBottomNav: boolean;
}

export const useResponsive = (): ResponsiveInfo => {
  const [screenData, setScreenData] = useState<ScaledSize>(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = screenData;
  const orientation = width > height ? 'landscape' : 'portrait';
  const minDimension = Math.min(width, height);
  
  let deviceType: 'phone' | 'large-phone' | 'tablet';
  if (minDimension >= 768) {
    deviceType = 'tablet';
  } else if (minDimension >= 414) {
    deviceType = 'large-phone';
  } else {
    deviceType = 'phone';
  }

  const isTablet = deviceType === 'tablet';
  const isLandscape = orientation === 'landscape';
  const isPortrait = orientation === 'portrait';
  const shouldShowSidebar = isTablet && isLandscape;
  const shouldShowBottomNav = !shouldShowSidebar;

  return {
    width,
    height,
    orientation,
    deviceType,
    isTablet,
    isLandscape,
    isPortrait,
    shouldShowSidebar,
    shouldShowBottomNav,
  };
};

// src/components/ResponsiveWrapper.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';

interface ResponsiveWrapperProps {
  children: React.ReactNode;
  style?: any;
}

export const ResponsiveWrapper: React.FC<ResponsiveWrapperProps> = ({ 
  children, 
  style 
}) => {
  const responsive = useResponsive();

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      ...style,
      // Add responsive adjustments
      ...(responsive.isTablet && responsive.isLandscape && {
        flexDirection: 'row',
      }),
      ...(responsive.deviceType === 'phone' && {
        paddingHorizontal: 16,
      }),
      ...(responsive.deviceType === 'large-phone' && {
        paddingHorizontal: 20,
      }),
      ...(responsive.isTablet && {
        paddingHorizontal: 24,
      }),
    },
  });

  return <View style={dynamicStyles.container}>{children}</View>;
};

// src/utils/responsive.ts
import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Based on iPhone 6/7/8 (375x667)
const scale = SCREEN_WIDTH / 375;

export const normalize = (size: number): number => {
  const newSize = size * scale;
  
  if (PixelRatio.get() >= 2 && PixelRatio.get() < 3) {
    // iPhone 6/7/8
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  
  if (PixelRatio.get() >= 3) {
    // iPhone 6/7/8 Plus and newer
    return Math.round(PixelRatio.roundToNearestPixel(newSize - 0.5));
  }
  
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Responsive font sizes
export const responsiveFontSize = {
  xs: normalize(10),
  sm: normalize(12),
  base: normalize(14),
  md: normalize(16),
  lg: normalize(18),
  xl: normalize(20),
  '2xl': normalize(24),
  '3xl': normalize(30),
};

// Responsive spacing
export const responsiveSpacing = {
  xs: normalize(4),
  sm: normalize(8),
  md: normalize(16),
  lg: normalize(24),
  xl: normalize(32),
  '2xl': normalize(48),
  '3xl': normalize(64),
};

// Device type helpers
export const isTablet = (): boolean => {
  const minDimension = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT);
  return minDimension >= 768;
};

export const isLargePhone = (): boolean => {
  const minDimension = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT);
  return minDimension >= 414 && minDimension < 768;
};

export const isPhone = (): boolean => {
  const minDimension = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT);
  return minDimension < 414;
};

// Breakpoint helpers
export const breakpoints = {
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
};

export const isBreakpoint = (breakpoint: keyof typeof breakpoints): boolean => {
  return SCREEN_WIDTH >= breakpoints[breakpoint];
};

// Touch target sizes (accessibility)
export const touchTargets = {
  small: 44,
  medium: 48,
  large: 56,
};

// Safe area helpers for different devices
export const getSafeAreaPadding = (deviceType: 'phone' | 'tablet') => {
  if (deviceType === 'tablet') {
    return {
      horizontal: responsiveSpacing.xl,
      vertical: responsiveSpacing.lg,
    };
  }
  
  return {
    horizontal: responsiveSpacing.md,
    vertical: responsiveSpacing.sm,
  };
};

// Grid system
export const getGridColumns = (deviceType: 'phone' | 'large-phone' | 'tablet'): number => {
  switch (deviceType) {
    case 'phone':
      return 2;
    case 'large-phone':
      return 3;
    case 'tablet':
      return 4;
    default:
      return 2;
  }
};

// Animation durations based on device performance
export const getAnimationDuration = (deviceType: 'phone' | 'large-phone' | 'tablet'): number => {
  // Tablets can handle longer, smoother animations
  if (deviceType === 'tablet') return 300;
  // Large phones get medium duration
  if (deviceType === 'large-phone') return 250;
  // Phones get shorter, snappier animations for better performance
  return 200;
};

// src/constants/responsive.ts
export const LAYOUT_CONSTANTS = {
  SIDEBAR_WIDTH: 280,
  SIDEBAR_WIDTH_COLLAPSED: 60,
  HEADER_HEIGHT: 56,
  BOTTOM_NAV_HEIGHT: 80,
  EXPANDED_MENU_HEIGHT: 300,
  
  // Responsive adjustments
  SIDEBAR_WIDTH_TABLET: 320,
  HEADER_HEIGHT_TABLET: 64,
  BOTTOM_NAV_HEIGHT_TABLET: 88,
  
  // Animation constants
  ANIMATION_DURATION_FAST: 150,
  ANIMATION_DURATION_NORMAL: 250,
  ANIMATION_DURATION_SLOW: 350,
  
  // Z-index scale
  Z_INDEX: {
    BASE: 0,
    DROPDOWN: 1000,
    STICKY: 1100,
    FIXED: 1200,
    MODAL_BACKDROP: 1300,
    MODAL: 1400,
    POPOVER: 1500,
    TOOLTIP: 1600,
  },
};

// Color system with opacity variations
export const COLORS = {
  primary: '#79d5e9',
  primaryHover: '#4daeac',
  primaryDark: '#448382',
  
  accent: '#79d5e9',
  accentTeal: '#4daeac',
  accentCta: '#fbbf24',
  
  success: '#22c55e',
  warning: '#fbbf24',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Background layers
  bgPrimary: '#0f1419',
  bgSecondary: '#1a1f2a',
  bgTertiary: '#252b35',
  bgHover: 'rgba(255, 255, 255, 0.05)',
  bgActive: 'rgba(121, 213, 233, 0.1)',
  
  // Text colors
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textTertiary: 'rgba(255, 255, 255, 0.5)',
  textMuted: 'rgba(255, 255, 255, 0.4)',
  textDisabled: 'rgba(255, 255, 255, 0.3)',
  textOnPrimary: '#0f1419',
  
  // Borders
  borderPrimary: 'rgba(255, 255, 255, 0.1)',
  borderSecondary: 'rgba(255, 255, 255, 0.05)',
  borderHover: '#79d5e9',
  
  // Gradients
  gradientPrimary: ['#79d5e9', '#4daeac'],
  gradientSecondary: ['#6366f1', '#8b5cf6'],
  gradientDark: ['#1a1f2a', '#2c3e50', '#34495e'],
  gradientSuccess: ['#22c55e', '#16a34a'],
  gradientWarning: ['#fbbf24', '#f59e0b'],
  gradientError: ['#ef4444', '#dc2626'],
};

// Typography system
export const TYPOGRAPHY = {
  fontFamily: {
    base: Platform.select({
      ios: '-apple-system',
      android: 'Roboto',
      default: 'sans-serif',
    }),
    mono: Platform.select({
      ios: 'SF Mono',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  
  fontSize: responsiveFontSize,
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Shadow system
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.5,
    shadowRadius: 50,
    elevation: 16,
  },
};

// Border radius system
export const RADIUS = {
  sm: 6,
  base: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};