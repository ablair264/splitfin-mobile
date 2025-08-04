import React from 'react';
import SettingsSegmentedMenu from './Dashboard/SettingsSegmentedMenu';

interface SalesAgentSettingsBadgeProps {
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

// Custom SettingsBadge for Sales Agents with limited date range options
const SalesAgentSettingsBadge: React.FC<SalesAgentSettingsBadgeProps> = (props) => {
  // Create a custom date range change handler that filters allowed values
  const handleDateRangeChange = (value: string) => {
    const allowedRanges = [
      'this_week',
      'last_week',
      'this_month',
      'last_month',
      'this_quarter',
      'last_quarter',
      'this_year',
      'last_year'
    ];
    
    if (allowedRanges.includes(value)) {
      props.onDateRangeChange(value);
    }
  };

  // Create a custom component that overrides the date range panel
  const CustomSettingsSegmentedMenu = () => {
    const [activeTab, setActiveTab] = React.useState<'date' | 'view' | 'edit' | null>(null);
    const [isExpanded, setIsExpanded] = React.useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
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

    const getDateRangeLabel = (range: string) => {
      switch (range) {
        case 'this_week': return 'TW';
        case 'last_week': return 'LW';
        case 'this_month': return 'TM';
        case 'last_month': return 'LM';
        case 'this_quarter': return 'TQ';
        case 'last_quarter': return 'LQ';
        case 'this_year': return 'TY';
        case 'last_year': return 'LY';
        default: return 'TM';
      }
    };

    return (
      <div className="settings-segmented-menu-container" ref={menuRef}>
        <div className="settings-segmented-menu">
          <button 
            className={`menu-segment ${activeTab === 'date' ? 'active' : ''}`}
            onClick={() => handleTabClick('date')}
          >
            <span className="segment-icon">📅</span>
            <span className="segment-label">{getDateRangeLabel(props.dateRange)}</span>
          </button>
          
          <button 
            className={`menu-segment ${activeTab === 'view' ? 'active' : ''}`}
            onClick={() => handleTabClick('view')}
          >
            <span className="segment-icon">👁️</span>
            <span className="segment-label">View</span>
          </button>
          
          <button 
            className={`menu-segment ${activeTab === 'edit' ? 'active' : ''} ${props.isEditMode ? 'edit-active' : ''}`}
            onClick={() => handleTabClick('edit')}
          >
            <span className="segment-icon">✏️</span>
            <span className="segment-label">{props.isEditMode ? 'Done' : 'Edit'}</span>
          </button>
          
          <button 
            className="menu-segment refresh-segment"
            onClick={props.onRefresh}
          >
            <span className="segment-icon">🔄</span>
          </button>
        </div>

        <div className={`settings-dropdown-panel ${isExpanded ? 'visible' : ''}`}>
          {activeTab === 'date' && (
            <div className="panel-content">
              <h4 className="panel-title">Date Range</h4>
              <div className="date-range-grid">
                {[
                  { value: 'this_week', label: 'This Week' },
                  { value: 'last_week', label: 'Last Week' },
                  { value: 'this_month', label: 'This Month' },
                  { value: 'last_month', label: 'Last Month' },
                  { value: 'this_quarter', label: 'This Quarter' },
                  { value: 'last_quarter', label: 'Last Quarter' },
                  { value: 'this_year', label: 'This Year' },
                  { value: 'last_year', label: 'Last Year' }
                ].map(option => (
                  <button
                    key={option.value}
                    className={`date-option ${props.dateRange === option.value ? 'active' : ''}`}
                    onClick={() => {
                      handleDateRangeChange(option.value);
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

          {/* Rest of the panels remain the same */}
          {activeTab === 'view' && (
            <SettingsSegmentedMenu {...props} />
          )}

          {activeTab === 'edit' && (
            <SettingsSegmentedMenu {...props} />
          )}
        </div>
      </div>
    );
  };

  // For simplicity, we'll just use the standard component but with our custom handler
  // This approach keeps the styling consistent
  return <SettingsSegmentedMenu {...props} onDateRangeChange={handleDateRangeChange} />;
};

export default SalesAgentSettingsBadge;
