// src/components/ThemeSelector/ThemeSelector.tsx
import React, { useState, useEffect, useRef } from 'react';
import { FaPalette, FaCheck } from 'react-icons/fa';
import './ThemeSelector.css';

interface Theme {
  id: string;
  name: string;
  type: 'dark' | 'light';
  colors: {
    primary: string;
    primaryHover: string;
    accent: string;
    cta: string;
    bgPrimary: string;
    bgSecondary: string;
  };
}

interface ThemeSelectorProps {
  isEmbedded?: boolean;
  onClose?: () => void;
}

const themes: Theme[] = [
  // Dark Themes
  {
    id: 'ocean-depths',
    name: 'Ocean Depths',
    type: 'dark',
    colors: {
      primary: '#79d5e9',
      primaryHover: '#4daeac',
      accent: '#61bc8e',
      cta: '#87f5e2',
      bgPrimary: '#0f1419',
      bgSecondary: '#1a1f2a'
    }
  },
  {
    id: 'arctic-teal',
    name: 'Arctic Teal',
    type: 'dark',
    colors: {
      primary: '#4dd0e1',
      primaryHover: '#26a69a',
      accent: '#87f5e2',
      cta: '#64b5f6',
      bgPrimary: '#0d1421',
      bgSecondary: '#1a252f'
    }
  },
  {
    id: 'deep-forest',
    name: 'Deep Forest',
    type: 'dark',
    colors: {
      primary: '#66bb6a',
      primaryHover: '#4caf50',
      accent: '#26a69a',
      cta: '#87f5e2',
      bgPrimary: '#0f1a0f',
      bgSecondary: '#1a2e1a'
    }
  },
  {
    id: 'midnight-ocean',
    name: 'Midnight Ocean',
    type: 'dark',
    colors: {
      primary: '#5c6bc0',
      primaryHover: '#3f51b5',
      accent: '#4daeac',
      cta: '#87f5e2',
      bgPrimary: '#0a0e1a',
      bgSecondary: '#151b2d'
    }
  },
  // Light Themes
  {
    id: 'coastal-breeze',
    name: 'Coastal Breeze',
    type: 'light',
    colors: {
      primary: '#1976d2',
      primaryHover: '#1565c0',
      accent: '#00695c',
      cta: '#2e7d32',
      bgPrimary: '#fafafa',
      bgSecondary: '#ffffff'
    }
  },
  {
    id: 'fresh-mint',
    name: 'Fresh Mint',
    type: 'light',
    colors: {
      primary: '#00897b',
      primaryHover: '#00695c',
      accent: '#4caf50',
      cta: '#1976d2',
      bgPrimary: '#f1f8e9',
      bgSecondary: '#ffffff'
    }
  },
  {
    id: 'sky-garden',
    name: 'Sky Garden',
    type: 'light',
    colors: {
      primary: '#0277bd',
      primaryHover: '#01579b',
      accent: '#388e3c',
      cta: '#00897b',
      bgPrimary: '#e8f4fd',
      bgSecondary: '#ffffff'
    }
  },
  {
    id: 'professional-sage',
    name: 'Professional Sage',
    type: 'light',
    colors: {
      primary: '#455a64',
      primaryHover: '#37474f',
      accent: '#00695c',
      cta: '#1976d2',
      bgPrimary: '#f5f7fa',
      bgSecondary: '#ffffff'
    }
  }
];

export default function ThemeSelector({ isEmbedded = false, onClose }: ThemeSelectorProps) {
  const [currentTheme, setCurrentTheme] = useState<string>(() => 
    localStorage.getItem('app-theme') || 'ocean-depths'
  );
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Apply theme to root element
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('app-theme', currentTheme);

    // Apply CSS variables
    const theme = themes.find(t => t.id === currentTheme);
    if (theme) {
      const root = document.documentElement;
      root.style.setProperty('--primary-color', theme.colors.primary);
      root.style.setProperty('--primary-hover', theme.colors.primaryHover);
      root.style.setProperty('--accent-color', theme.colors.accent);
      root.style.setProperty('--cta-color', theme.colors.cta);
      root.style.setProperty('--bg-primary', theme.colors.bgPrimary);
      root.style.setProperty('--bg-secondary', theme.colors.bgSecondary);
      
      // Update text colors for light themes
      if (theme.type === 'light') {
        root.style.setProperty('--text-primary', '#1a1f2a');
        root.style.setProperty('--text-secondary', 'rgba(26, 31, 42, 0.7)');
        root.style.setProperty('--text-tertiary', 'rgba(26, 31, 42, 0.5)');
        root.style.setProperty('--border-primary', 'rgba(0, 0, 0, 0.12)');
        root.style.setProperty('--border-secondary', 'rgba(0, 0, 0, 0.06)');
      } else {
        root.style.setProperty('--text-primary', '#ffffff');
        root.style.setProperty('--text-secondary', 'rgba(255, 255, 255, 0.7)');
        root.style.setProperty('--text-tertiary', 'rgba(255, 255, 255, 0.5)');
        root.style.setProperty('--border-primary', 'rgba(255, 255, 255, 0.1)');
        root.style.setProperty('--border-secondary', 'rgba(255, 255, 255, 0.05)');
      }
    }
  }, [currentTheme]);

  useEffect(() => {
    // Click outside handler
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  const darkThemes = themes.filter(t => t.type === 'dark');
  const lightThemes = themes.filter(t => t.type === 'light');

  // If embedded, show dropdown directly
  if (isEmbedded) {
    return (
      <div className="theme-dropdown theme-dropdown-from-settings">
        <div className="theme-dropdown-header">
          <h4>Select Theme</h4>
          <p>Choose your preferred color scheme</p>
        </div>

        <div className="theme-section">
          <h5 className="theme-section-title">Dark Themes</h5>
          <div className="theme-list">
            {darkThemes.map(theme => (
              <button
                key={theme.id}
                className={`theme-option ${currentTheme === theme.id ? 'active' : ''}`}
                onClick={() => handleThemeChange(theme.id)}
              >
                <div className="theme-preview">
                  <div 
                    className="color-swatch primary"
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                  <div 
                    className="color-swatch accent"
                    style={{ backgroundColor: theme.colors.accent }}
                  />
                  <div 
                    className="color-swatch cta"
                    style={{ backgroundColor: theme.colors.cta }}
                  />
                </div>
                <span className="theme-name">{theme.name}</span>
                {currentTheme === theme.id && (
                  <FaCheck className="theme-check" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="theme-section">
          <h5 className="theme-section-title">Light Themes</h5>
          <div className="theme-list">
            {lightThemes.map(theme => (
              <button
                key={theme.id}
                className={`theme-option ${currentTheme === theme.id ? 'active' : ''}`}
                onClick={() => handleThemeChange(theme.id)}
              >
                <div className="theme-preview">
                  <div 
                    className="color-swatch primary"
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                  <div 
                    className="color-swatch accent"
                    style={{ backgroundColor: theme.colors.accent }}
                  />
                  <div 
                    className="color-swatch cta"
                    style={{ backgroundColor: theme.colors.cta }}
                  />
                </div>
                <span className="theme-name">{theme.name}</span>
                {currentTheme === theme.id && (
                  <FaCheck className="theme-check" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Normal mode with toggle button
  return (
    <div className="theme-selector" ref={dropdownRef}>
      <button
        className="theme-selector-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select theme"
      >
        <FaPalette className="theme-icon" />
        <span className="theme-label">Theme</span>
      </button>

      {isOpen && (
        <div className="theme-dropdown">
          <div className="theme-dropdown-header">
            <h4>Select Theme</h4>
            <p>Choose your preferred color scheme</p>
          </div>

          <div className="theme-section">
            <h5 className="theme-section-title">Dark Themes</h5>
            <div className="theme-list">
              {darkThemes.map(theme => (
                <button
                  key={theme.id}
                  className={`theme-option ${currentTheme === theme.id ? 'active' : ''}`}
                  onClick={() => handleThemeChange(theme.id)}
                >
                  <div className="theme-preview">
                    <div 
                      className="color-swatch primary"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <div 
                      className="color-swatch accent"
                      style={{ backgroundColor: theme.colors.accent }}
                    />
                    <div 
                      className="color-swatch cta"
                      style={{ backgroundColor: theme.colors.cta }}
                    />
                  </div>
                  <span className="theme-name">{theme.name}</span>
                  {currentTheme === theme.id && (
                    <FaCheck className="theme-check" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="theme-section">
            <h5 className="theme-section-title">Light Themes</h5>
            <div className="theme-list">
              {lightThemes.map(theme => (
                <button
                  key={theme.id}
                  className={`theme-option ${currentTheme === theme.id ? 'active' : ''}`}
                  onClick={() => handleThemeChange(theme.id)}
                >
                  <div className="theme-preview">
                    <div 
                      className="color-swatch primary"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <div 
                      className="color-swatch accent"
                      style={{ backgroundColor: theme.colors.accent }}
                    />
                    <div 
                      className="color-swatch cta"
                      style={{ backgroundColor: theme.colors.cta }}
                    />
                  </div>
                  <span className="theme-name">{theme.name}</span>
                  {currentTheme === theme.id && (
                    <FaCheck className="theme-check" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}