import { useState, useEffect } from 'react';
import { isIPad, isIPadPro, isIPadAir, isIPadMini, getDeviceClass } from '../utils/deviceDetection';

interface DeviceInfo {
  isIPad: boolean;
  isIPadPro: boolean;
  isIPadAir: boolean;
  isIPadMini: boolean;
  deviceClass: string;
  orientation: 'portrait' | 'landscape';
  isTouch: boolean;
}

export const useDeviceDetection = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isIPad: isIPad(),
    isIPadPro: isIPadPro(),
    isIPadAir: isIPadAir(),
    isIPadMini: isIPadMini(),
    deviceClass: getDeviceClass(),
    orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
    isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(prev => ({
        ...prev,
        orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceInfo;
};

// Hook for conditional rendering based on device
export const useDeviceConditional = () => {
  const deviceInfo = useDeviceDetection();
  
  return {
    // Show only on iPad
    showOnIPad: (component: React.ReactNode) => deviceInfo.isIPad ? component : null,
    
    // Show only on desktop
    showOnDesktop: (component: React.ReactNode) => !deviceInfo.isIPad ? component : null,
    
    // Show only on specific iPad models
    showOnIPadPro: (component: React.ReactNode) => deviceInfo.isIPadPro ? component : null,
    showOnIPadAir: (component: React.ReactNode) => deviceInfo.isIPadAir ? component : null,
    showOnIPadMini: (component: React.ReactNode) => deviceInfo.isIPadMini ? component : null,
    
    // Show based on orientation
    showInPortrait: (component: React.ReactNode) => deviceInfo.orientation === 'portrait' ? component : null,
    showInLandscape: (component: React.ReactNode) => deviceInfo.orientation === 'landscape' ? component : null,
  };
}; 