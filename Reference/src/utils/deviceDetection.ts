// Device detection utilities
export const isIPad = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return /ipad/.test(userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

export const isIPadPro = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return /ipad pro/.test(userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1 && window.screen.width >= 1024);
};

export const isIPadAir = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return /ipad air/.test(userAgent);
};

export const isIPadMini = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return /ipad mini/.test(userAgent);
};

export const getDeviceClass = (): string => {
  if (isIPadPro()) return 'ipad-pro';
  if (isIPadAir()) return 'ipad-air';
  if (isIPadMini()) return 'ipad-mini';
  if (isIPad()) return 'ipad';
  return 'desktop';
};

export const applyDeviceClasses = (): void => {
  const deviceClass = getDeviceClass();
  document.body.classList.add(deviceClass);
  
  // Add orientation class
  const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  document.body.classList.add(`orientation-${orientation}`);
  
  // Listen for orientation changes
  window.addEventListener('resize', () => {
    document.body.classList.remove('orientation-landscape', 'orientation-portrait');
    const newOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    document.body.classList.add(`orientation-${newOrientation}`);
  });
}; 