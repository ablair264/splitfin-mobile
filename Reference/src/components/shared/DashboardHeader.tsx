import React from 'react';
import styles from './DashboardHeader.module.css';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  dateRange: string;
  onDateRangeChange: (value: string) => void;
  onRefresh: () => void;
  isEditMode: boolean;
  onEditModeToggle: () => void;
  metricDisplayMode?: 'full' | 'compact';
  onMetricDisplayModeChange?: (value: 'full' | 'compact') => void;
  barChartColors?: 'primary' | 'secondary' | 'tertiary' | 'fourth' | 'fifth' | 'sixth' | 'seventh' | 'eighth' | 'ninth' | 'tenth' | 'eleventh' | 'multicolored';
  onBarChartColorsChange?: (value: 'primary' | 'secondary' | 'tertiary' | 'fourth' | 'fifth' | 'sixth' | 'seventh' | 'eighth' | 'ninth' | 'tenth' | 'eleventh' | 'multicolored') => void;
  chartDesign?: 'default' | 'horizontal-bars' | 'pie-with-legend' | 'table';
  onChartDesignChange?: (value: 'default' | 'horizontal-bars' | 'pie-with-legend' | 'table') => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  dateRange,
  onDateRangeChange,
  onRefresh,
  isEditMode,
  onEditModeToggle,
  metricDisplayMode,
  onMetricDisplayModeChange,
  barChartColors,
  onBarChartColorsChange,
  chartDesign,
  onChartDesignChange
}) => {
  const [showEditOptions, setShowEditOptions] = React.useState(false);

  return (
    <div className={styles.dashboardHeaderBar}>
      <div className={styles.headerLeft}>
        <div className={styles.headerTitleGroup}>
          <h1 className={styles.headerTitle}>{title}</h1>
          {subtitle && <p className={styles.headerSubtitle}>{subtitle}</p>}
        </div>
      </div>

      <div className={styles.headerControls}>
        {/* Date Range Selector */}
        <div className={styles.dateRangeSelector}>
          <select 
            value={dateRange} 
            onChange={(e) => onDateRangeChange(e.target.value)}
            className={styles.dateSelect}
          >
            <option value="7_days">Last 7 Days</option>
            <option value="30_days">Last 30 Days</option>
            <option value="90_days">Last 90 Days</option>
            <option value="last_month">Last Month</option>
            <option value="quarter">This Quarter</option>
            <option value="last_quarter">Last Quarter</option>
            <option value="this_year">This Year</option>
            <option value="last_year">Last Year</option>
            <option value="12_months">Last 12 Months</option>
          </select>
        </div>

        {/* Edit Mode Toggle */}
        <button 
          className={`${styles.editModeBtn} ${isEditMode ? styles.active : ''}`}
          onClick={() => {
            onEditModeToggle();
            setShowEditOptions(isEditMode ? false : showEditOptions);
          }}
        >
          <span className={styles.icon}>✏️</span>
          <span className={styles.label}>{isEditMode ? 'Done' : 'Edit'}</span>
        </button>

        {/* Refresh Button */}
        <button className={styles.refreshBtn} onClick={onRefresh}>
          <span className={styles.icon}>🔄</span>
          <span className={styles.label}>Refresh</span>
        </button>
      </div>

      {/* Edit Options Panel */}
      {isEditMode && (
        <div className={styles.editOptionsPanel}>
          <div className={styles.editOptionGroup}>
            <label>Display Mode</label>
            <div className={styles.optionButtons}>
              <button 
                className={metricDisplayMode === 'full' ? styles.active : ''}
                onClick={() => onMetricDisplayModeChange?.('full')}
              >
                Full
              </button>
              <button 
                className={metricDisplayMode === 'compact' ? styles.active : ''}
                onClick={() => onMetricDisplayModeChange?.('compact')}
              >
                Compact
              </button>
            </div>
          </div>

          <div className={styles.editOptionGroup}>
            <label>Chart Colors</label>
            <div className={styles.colorOptionsGrid}>
              <button 
                className={`${styles.colorOption} ${barChartColors === 'primary' ? styles.active : ''}`}
                onClick={() => onBarChartColorsChange?.('primary')}
                style={{ backgroundColor: '#79d5e9' }}
                title="Primary Blue"
              />
              <button 
                className={`${styles.colorOption} ${barChartColors === 'secondary' ? styles.active : ''}`}
                onClick={() => onBarChartColorsChange?.('secondary')}
                style={{ backgroundColor: '#799de9' }}
                title="Secondary Blue"
              />
              <button 
                className={`${styles.colorOption} ${barChartColors === 'tertiary' ? styles.active : ''}`}
                onClick={() => onBarChartColorsChange?.('tertiary')}
                style={{ backgroundColor: '#79e9c5' }}
                title="Teal"
              />
              <button 
                className={`${styles.colorOption} ${barChartColors === 'fourth' ? styles.active : ''}`}
                onClick={() => onBarChartColorsChange?.('fourth')}
                style={{ backgroundColor: '#FF9F00' }}
                title="Orange"
              />
              <button 
                className={`${styles.colorOption} ${barChartColors === 'fifth' ? styles.active : ''}`}
                onClick={() => onBarChartColorsChange?.('fifth')}
                style={{ backgroundColor: '#C96868' }}
                title="Coral"
              />
              <button 
                className={`${styles.colorOption} ${barChartColors === 'sixth' ? styles.active : ''}`}
                onClick={() => onBarChartColorsChange?.('sixth')}
                style={{ backgroundColor: '#4daeac' }}
                title="Turquoise"
              />
              <button 
                className={`${styles.colorOption} ${barChartColors === 'seventh' ? styles.active : ''}`}
                onClick={() => onBarChartColorsChange?.('seventh')}
                style={{ backgroundColor: '#61bc8e' }}
                title="Green"
              />
              <button 
                className={`${styles.colorOption} ${barChartColors === 'eighth' ? styles.active : ''}`}
                onClick={() => onBarChartColorsChange?.('eighth')}
                style={{ backgroundColor: '#fbbf24' }}
                title="Yellow"
              />
              <button 
                className={`${styles.colorOption} ${barChartColors === 'ninth' ? styles.active : ''}`}
                onClick={() => onBarChartColorsChange?.('ninth')}
                style={{ backgroundColor: '#dc2626' }}
                title="Red"
              />
              <button 
                className={`${styles.colorOption} ${barChartColors === 'tenth' ? styles.active : ''}`}
                onClick={() => onBarChartColorsChange?.('tenth')}
                style={{ backgroundColor: '#8b5cf6' }}
                title="Purple"
              />
              <button 
                className={`${styles.colorOption} ${barChartColors === 'eleventh' ? styles.active : ''}`}
                onClick={() => onBarChartColorsChange?.('eleventh')}
                style={{ backgroundColor: '#ec4899' }}
                title="Pink"
              />
              <button 
                className={`${styles.colorOption} ${barChartColors === 'multicolored' ? styles.active : ''}`}
                onClick={() => onBarChartColorsChange?.('multicolored')}
                style={{ background: 'linear-gradient(to right, #79d5e9, #799de9, #79e9c5, #FF9F00, #C96868)' }}
                title="Multicolored"
              />
            </div>
          </div>

          <div className={styles.editOptionGroup}>
            <label>Chart Design</label>
            <div className={styles.optionButtons}>
              <button 
                className={chartDesign === 'table' ? styles.active : ''}
                onClick={() => onChartDesignChange?.('table')}
              >
                Table
              </button>
              <button 
                className={chartDesign === 'default' ? styles.active : ''}
                onClick={() => onChartDesignChange?.('default')}
              >
                Bar
              </button>
              <button 
                className={chartDesign === 'horizontal-bars' ? styles.active : ''}
                onClick={() => onChartDesignChange?.('horizontal-bars')}
              >
                Horizontal
              </button>
              <button 
                className={chartDesign === 'pie-with-legend' ? styles.active : ''}
                onClick={() => onChartDesignChange?.('pie-with-legend')}
              >
                Pie
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHeader;