import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';
import { breakpoints } from '../theme';

interface ResponsiveValues {
  width: number;
  height: number;
  isTablet: boolean;
  isMobile: boolean;
  orientation: 'portrait' | 'landscape';
}

export const useResponsive = (): ResponsiveValues => {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;
  const isTablet = width >= breakpoints.tablet;
  const isMobile = !isTablet;
  const orientation = width > height ? 'landscape' : 'portrait';

  return {
    width,
    height,
    isTablet,
    isMobile,
    orientation,
  };
};