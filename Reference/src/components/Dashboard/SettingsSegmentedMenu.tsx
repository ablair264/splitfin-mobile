import React, { useState, useRef, useEffect } from 'react';
import './SettingsSegmentedMenu.css';

interface SettingsSegmentedMenuProps {
  dateRange: string;
  onDateRangeChange: (value: string) => void;
  isEditMode: boolean;
  onEditModeToggle: () => void;
  onRefresh: () => void;
  metricDisplayMode?: 'full' | 'compact';
  onMetricDisplayModeChange?: (value: 'full' | 'compact') => void;
  barChartColors?: 'primary' | 'secondary' | 'tertiary' | 'fourth' | 'fifth' | 'sixth' | 'seventh' | 'eighth' | 'ninth' | 'tenth' | 'eleventh' | 'multicolored';
  onBarChartColorsChange?: (value: 'primary' | 'secondary' | 'tertiary' | 'fourth' | 'fifth' | 'sixth' | 'seventh' | 'eighth' | 'ninth' | 'tenth' | 'eleventh' | 'multicolored') => void;
  chartDesign?: 'default' | 'horizontal-bars' | 'pie-with-legend' | 'table';
  onChartDesignChange?: (value: 'default' | 'horizontal-bars' | 'pie-with-legend' | 'table') => void;
  graphColors?: { primary: string; secondary: string; tertiary: string };
  onGraphColorsChange?: (colors: { primary: string; secondary: string; tertiary: string }) => void;
  isStale?: boolean;
  isCached?: boolean;
  lastUpdated?: Date;
}

const SettingsSegmentedMenu: React.FC<SettingsSegmentedMenuProps> = ({
  dateRange,
  onDateRangeChange,
  isEditMode,
  onEditModeToggle,
  onRefresh,
  metricDisplayMode,
  onMetricDisplayModeChange,
  barChartColors,
  onBarChartColorsChange,
  chartDesign,
  onChartDesignChange,
  graphColors,
  onGraphColorsChange,
  isStale,
  isCached,
  lastUpdated
}) => {

  const [activeTab, setActiveTab] = useState<'date' | 'view' | 'edit' | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
        setActiveTab(null);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  const handleTabClick = (tab: 'date' | 'view' | 'edit') => {
    if (activeTab === tab) {
      setIsExpanded(false);
      setActiveTab(null);
    } else {
      setActiveTab(tab);
      setIsExpanded(true);
    }
  };

  const getTimeSince = (date: Date) => {
    const minutesAgo = Math.round((Date.now() - date.getTime()) / 60000);
    if (minutesAgo < 1) return '<1m ago';
    if (minutesAgo >= 60) return `${Math.round(minutesAgo / 60)}h ago`;
    return `${minutesAgo}m ago`;
  };

  const getDateRangeLabel = (range: string) => {
    switch (range) {
      case '7_days': return '7D';
      case '30_days': return '30D';
      case '90_days': return '90D';
      case 'last_month': return 'LM';
      case 'quarter': return 'Q';
      case 'last_quarter': return 'LQ';
      case 'this_year': return 'YTD';
      case 'last_year': return 'LY';
      case '12_months': return '12M';
      default: return '30D';
    }
  };

  return (
    <div className="settings-segmented-menu-container" ref={menuRef}>
      {/* Segmented Menu */}
      <div className="settings-segmented-menu">
        <button 
          className={`menu-segment ${activeTab === 'date' ? 'active' : ''}`}
          onClick={() => handleTabClick('date')}
        >
          <span className="segment-icon">📅</span>
          <span className="segment-label">{getDateRangeLabel(dateRange)}</span>
        </button>
        
        <button 
          className={`menu-segment ${activeTab === 'view' ? 'active' : ''}`}
          onClick={() => handleTabClick('view')}
        >
          <span className="segment-icon">👁️</span>
          <span className="segment-label">View</span>
        </button>
        
        <button 
          className={`menu-segment ${activeTab === 'edit' ? 'active' : ''} ${isEditMode ? 'edit-active' : ''}`}
          onClick={() => handleTabClick('edit')}
        >
          <span className="segment-icon">✏️</span>
          <span className="segment-label">{isEditMode ? 'Done' : 'Edit'}</span>
        </button>
        
        <button 
          className="menu-segment refresh-segment"
          onClick={onRefresh}
        >
          <span className="segment-icon">🔄</span>
        </button>
      </div>

      {/* Dropdown Panel */}
      <div className={`settings-dropdown-panel ${isExpanded ? 'visible' : ''}`}>
        {activeTab === 'date' && (
          <div className="panel-content">
            <h4 className="panel-title">Date Range</h4>
            <div className="date-range-grid">
              {[
                { value: '7_days', label: '7 Days' },
                { value: '30_days', label: '30 Days' },
                { value: '90_days', label: '90 Days' },
                { value: 'last_month', label: 'Last Month' },
                { value: 'quarter', label: 'This Quarter' },
                { value: 'last_quarter', label: 'Last Quarter' },
                { value: 'this_year', label: 'This Year' },
                { value: 'last_year', label: 'Last Year' },
                { value: '12_months', label: '12 Months' }
              ].map(option => (
                <button
                  key={option.value}
                  className={`date-option ${dateRange === option.value ? 'active' : ''}`}
                  onClick={() => {
                    onDateRangeChange(option.value);
                    setIsExpanded(false);
                    setActiveTab(null);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'view' && (
          <div className="panel-content">
            <h4 className="panel-title">View Settings</h4>
            
            {metricDisplayMode !== undefined && onMetricDisplayModeChange && (
              <div className="settings-group">
                <label className="settings-label">Display Mode</label>
                <div className="settings-button-group">
                  <button 
                    className={`settings-button ${metricDisplayMode === 'full' ? 'active' : ''}`}
                    onClick={() => onMetricDisplayModeChange('full')}
                  >
                    Full
                  </button>
                  <button 
                    className={`settings-button ${metricDisplayMode === 'compact' ? 'active' : ''}`}
                    onClick={() => onMetricDisplayModeChange('compact')}
                  >
                    Compact
                  </button>
                </div>
              </div>
            )}

            {barChartColors !== undefined && onBarChartColorsChange && (
              <div className="settings-group">
                <label className="settings-label">Chart Colors</label>
                <div className="color-options-grid">
                  <button 
                    className={`color-option-circle ${barChartColors === 'primary' ? 'active' : ''}`}
                    onClick={() => onBarChartColorsChange('primary')}
                    style={{ backgroundColor: '#79d5e9' }}
                    title="Primary Blue"
                  />
                  <button 
                    className={`color-option-circle ${barChartColors === 'secondary' ? 'active' : ''}`}
                    onClick={() => onBarChartColorsChange('secondary')}
                    style={{ backgroundColor: '#799de9' }}
                    title="Secondary Blue"
                  />
                  <button 
                    className={`color-option-circle ${barChartColors === 'tertiary' ? 'active' : ''}`}
                    onClick={() => onBarChartColorsChange('tertiary')}
                    style={{ backgroundColor: '#79e9c5' }}
                    title="Teal"
                  />
                  <button 
                    className={`color-option-circle ${barChartColors === 'fourth' ? 'active' : ''}`}
                    onClick={() => onBarChartColorsChange('fourth')}
                    style={{ backgroundColor: '#FF9F00' }}
                    title="Orange"
                  />
                  <button 
                    className={`color-option-circle ${barChartColors === 'fifth' ? 'active' : ''}`}
                    onClick={() => onBarChartColorsChange('fifth')}
                    style={{ backgroundColor: '#C96868' }}
                    title="Coral"
                  />
                  <button 
                    className={`color-option-circle ${barChartColors === 'sixth' ? 'active' : ''}`}
                    onClick={() => onBarChartColorsChange('sixth')}
                    style={{ backgroundColor: '#4daeac' }}
                    title="Turquoise"
                  />
                  <button 
                    className={`color-option-circle ${barChartColors === 'seventh' ? 'active' : ''}`}
                    onClick={() => onBarChartColorsChange('seventh')}
                    style={{ backgroundColor: '#61bc8e' }}
                    title="Green"
                  />
                  <button 
                    className={`color-option-circle ${barChartColors === 'eighth' ? 'active' : ''}`}
                    onClick={() => onBarChartColorsChange('eighth')}
                    style={{ backgroundColor: '#fbbf24' }}
                    title="Yellow"
                  />
                  <button 
                    className={`color-option-circle ${barChartColors === 'ninth' ? 'active' : ''}`}
                    onClick={() => onBarChartColorsChange('ninth')}
                    style={{ backgroundColor: '#dc2626' }}
                    title="Red"
                  />
                  <button 
                    className={`color-option-circle ${barChartColors === 'tenth' ? 'active' : ''}`}
                    onClick={() => onBarChartColorsChange('tenth')}
                    style={{ backgroundColor: '#8b5cf6' }}
                    title="Purple"
                  />
                  <button 
                    className={`color-option-circle ${barChartColors === 'eleventh' ? 'active' : ''}`}
                    onClick={() => onBarChartColorsChange('eleventh')}
                    style={{ backgroundColor: '#ec4899' }}
                    title="Pink"
                  />
                  <button 
                    className={`color-option-circle ${barChartColors === 'multicolored' ? 'active' : ''}`}
                    onClick={() => onBarChartColorsChange('multicolored')}
                    style={{ background: 'linear-gradient(to right, #79d5e9, #799de9, #79e9c5, #FF9F00, #C96868)' }}
                    title="Multicolored"
                  />
                </div>
              </div>
            )}

            {chartDesign !== undefined && onChartDesignChange && (
              <div className="settings-group">
                <label className="settings-label">Chart Design</label>
                <div className="design-options">
                  <button 
                    className={`design-option ${chartDesign === 'table' ? 'active' : ''}`}
                    onClick={() => onChartDesignChange('table')}
                  >
                    📊 Table
                  </button>
                  <button 
                    className={`design-option ${chartDesign === 'default' ? 'active' : ''}`}
                    onClick={() => onChartDesignChange('default')}
                  >
                    📈 Bar
                  </button>
                  <button 
                    className={`design-option ${chartDesign === 'horizontal-bars' ? 'active' : ''}`}
                    onClick={() => onChartDesignChange('horizontal-bars')}
                  >
                    📊 Horizontal
                  </button>
                  <button 
                    className={`design-option ${chartDesign === 'pie-with-legend' ? 'active' : ''}`}
                    onClick={() => onChartDesignChange('pie-with-legend')}
                  >
                    🥧 Pie
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'edit' && (
          <div className="panel-content">
            <h4 className="panel-title">Edit Dashboard</h4>
            
            <div className="edit-actions">
              <button 
                onClick={() => {
                  onEditModeToggle();
                  setIsExpanded(false);
                  setActiveTab(null);
                }}
                className={`edit-toggle-button ${isEditMode ? 'active' : ''}`}
              >
                <span className="edit-icon">✏️</span>
                <span>{isEditMode ? 'Finish Editing' : 'Start Editing'}</span>
              </button>
              
              {isEditMode && (
                <div className="edit-info">
                  <p>Edit mode is active. You can now:</p>
                  <ul>
                    <li>Change chart variants on metric cards</li>
                    <li>Adjust display settings</li>
                    <li>Customize chart colors</li>
                  </ul>
                </div>
              )}
            </div>

            {graphColors !== undefined && onGraphColorsChange && isEditMode && (
              <>
                <div className="settings-divider"></div>
                <div className="settings-group">
                  <label className="settings-label">Custom Graph Colors</label>
                  <div className="color-picker-group">
                    <div className="color-picker-item">
                      <label>Primary</label>
                      <input
                        type="color"
                        value={graphColors.primary}
                        onChange={(e) => onGraphColorsChange({ ...graphColors, primary: e.target.value })}
                        className="color-input"
                      />
                    </div>
                    <div className="color-picker-item">
                      <label>Secondary</label>
                      <input
                        type="color"
                        value={graphColors.secondary}
                        onChange={(e) => onGraphColorsChange({ ...graphColors, secondary: e.target.value })}
                        className="color-input"
                      />
                    </div>
                    <div className="color-picker-item">
                      <label>Tertiary</label>
                      <input
                        type="color"
                        value={graphColors.tertiary}
                        onChange={(e) => onGraphColorsChange({ ...graphColors, tertiary: e.target.value })}
                        className="color-input"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Cache Status */}
        {(isStale || isCached) && lastUpdated && (
          <>
            <div className="settings-divider"></div>
            <div className={`cache-status ${isStale ? 'stale' : 'cached'}`}>
              <span className="status-dot">●</span>
              <span>{isStale ? 'Updating...' : 'Cached'}</span>
              <span className="time-ago">({getTimeSince(lastUpdated)})</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SettingsSegmentedMenu;