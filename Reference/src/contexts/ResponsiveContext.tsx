import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ResponsiveContextType {
  isCompactMode: boolean;
  breakpoint: number;
  setBreakpoint: (breakpoint: number) => void;
}

const ResponsiveContext = createContext<ResponsiveContextType | undefined>(undefined);

interface ResponsiveProviderProps {
  children: ReactNode;
  defaultBreakpoint?: number;
}

export const ResponsiveProvider: React.FC<ResponsiveProviderProps> = ({ 
  children, 
  defaultBreakpoint = 768 
}) => {
  const [breakpoint, setBreakpoint] = useState(defaultBreakpoint);
  const [isCompactMode, setIsCompactMode] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsCompactMode(window.innerWidth <= breakpoint);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [breakpoint]);

  return (
    <ResponsiveContext.Provider value={{ isCompactMode, breakpoint, setBreakpoint }}>
      {children}
    </ResponsiveContext.Provider>
  );
};

export const useResponsive = () => {
  const context = useContext(ResponsiveContext);
  if (context === undefined) {
    throw new Error('useResponsive must be used within a ResponsiveProvider');
  }
  return context;
};