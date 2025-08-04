import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, ComposedChart,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Brush
} from 'recharts';
import styles from './FullGraph.module.css';

interface FullGraphProps {
  id: string;
  title: string;
  subtitle?: string;
  data: Array<any>;
  type?: 'area' | 'line' | 'bar' | 'composed';
  lines?: Array<{
    dataKey: string;
    color: string;
    name: string;
    type?: 'line' | 'area' | 'bar';
    yAxisId?: 'left' | 'right';
    format?: 'currency' | 'number' | 'percentage';
  }>;
  showBrush?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  height?: number;
  dateRange?: { start: Date; end: Date };
  onDateRangeChange?: (range: { start: Date; end: Date }) => void;
  onExport?: () => void;
  onFullscreen?: () => void;
  customColors?: Record<string, string>;
}

const FullGraph: React.FC<FullGraphProps> = ({
  id,
  title,
  subtitle,
  data,
  type = 'area',
  lines = [{ dataKey: 'value', color: '#79d5e9', name: 'Value' }],
  showBrush = true,
  showGrid = true,
  showLegend = true,
  height = 400,
  dateRange,
  onDateRangeChange,
  onExport,
  onFullscreen,
  customColors
}) => {
  // Use the data passed from parent component - no internal filtering
  const filteredData = data || [];

  const formatAxisDate = (tickItem: string) => {
    try {
      const date = new Date(tickItem);
      if (isNaN(date.getTime())) return tickItem; // Return original if invalid date
      return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
    } catch {
      return tickItem;
    }
  };

  const formatTooltipDate = (value: string) => {
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return value; // Return original if invalid date
      return date.toLocaleDateString('en-GB', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return value;
    }
  };

  const formatValue = (value: number, format: string = 'currency') => {
    if (typeof value !== 'number') return value;
    if (format === 'number') {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return value.toFixed(0);
    } else if (format === 'percentage') {
      return `${value.toFixed(1)}%`;
    } else { // currency
      if (value >= 1000000) {
        return `£${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `£${(value / 1000).toFixed(1)}K`;
      }
      return `£${value.toFixed(0)}`;
    }
  };

  const renderChart = () => {
    const commonProps = {
      data: filteredData || [],
      margin: { top: 10, right: 30, left: 10, bottom: 10 }
    };

    const renderLines = () => {
      return lines.map((line, index) => {
        const color = customColors?.[line.dataKey] || line.color;
        switch (line.type || type) {
          case 'bar':
            return (
              <Bar
                key={line.dataKey}
                dataKey={line.dataKey}
                fill={color}
                name={line.name}
                radius={[4, 4, 0, 0]}
                yAxisId={line.yAxisId || 'left'}
              />
            );
          case 'line':
            return (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                stroke={color}
                strokeWidth={2}
                name={line.name}
                dot={false}
                activeDot={{ r: 4 }}
                yAxisId={line.yAxisId || 'left'}
              />
            );
          case 'area':
          default:
            return (
              <React.Fragment key={line.dataKey}>
                <defs>
                  <linearGradient id={`gradient-${id}-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey={line.dataKey}
                  stroke={color}
                  fill={`url(#gradient-${id}-${index})`}
                  strokeWidth={2}
                  name={line.name}
                  yAxisId={line.yAxisId || 'left'}
                />
              </React.Fragment>
            );
        }
      });
    };

    const ChartComponent = type === 'composed' ? ComposedChart : 
                          type === 'bar' ? BarChart : 
                          type === 'line' ? LineChart : AreaChart;

    // Determine xAxis dataKey - try common date field names
    const xAxisDataKey = filteredData?.[0]?.date ? 'date' : 
                        filteredData?.[0]?.day ? 'day' : 
                        filteredData?.[0]?.timestamp ? 'timestamp' : 
                        filteredData?.[0]?.name ? 'name' : 'date';

    return (
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent {...commonProps}>
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(255, 255, 255, 0.05)"
              vertical={false}
            />
          )}
          <XAxis
            dataKey={xAxisDataKey}
            stroke="#666"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={xAxisDataKey === 'name' ? undefined : formatAxisDate}
          />
          <YAxis
            yAxisId="left"
            stroke="#666"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              const leftLine = lines.find(l => (l.yAxisId || 'left') === 'left');
              return formatValue(value, leftLine?.format || 'currency');
            }}
          />
          {lines.some(line => line.yAxisId === 'right') && (
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#666"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                const rightLine = lines.find(l => l.yAxisId === 'right');
                return formatValue(value, rightLine?.format || 'number');
              }}
            />
          )}
          <Tooltip
            contentStyle={{
              background: '#1a1f2a',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}
            labelStyle={{ color: '#a0a0a0', marginBottom: '8px' }}
            itemStyle={{ color: '#fff' }}
            labelFormatter={xAxisDataKey === 'name' ? undefined : formatTooltipDate}
            formatter={(value: number, name: string) => {
              const line = lines.find(l => l.name === name);
              return typeof value === 'number' ? formatValue(value, line?.format || 'currency') : value;
            }}
          />
          {showLegend && (
            <Legend 
              verticalAlign="top" 
              height={36}
              iconType="line"
              wrapperStyle={{
                paddingTop: '10px',
                fontSize: '13px',
                color: '#a0a0a0'
              }}
            />
          )}
          {renderLines()}
          {showBrush && (
            <Brush
              dataKey={xAxisDataKey}
              height={30}
              stroke="#79d5e9"
              fill="#1a1f2a"
              tickFormatter={xAxisDataKey === 'name' ? undefined : formatAxisDate}
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  return (
    <div className={styles.fullGraphContainer}>
      <div className={styles.fullGraphHeader}>
        <div className={styles.graphHeaderLeft}>
          <h2 className={styles.graphTitle}>{title}</h2>
          {subtitle && <p className={styles.graphSubtitle}>{subtitle}</p>}
        </div>
        <div className={styles.graphHeaderRight}>
          <div className={styles.graphActions}>
            {onExport && (
              <button 
                className={styles.graphActionButton} 
                onClick={onExport} 
                title="Export"
                aria-label="Export graph data"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                  <path d="M10 3v10m0 0l-3-3m3 3l3-3M5 17h10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
            {onFullscreen && (
              <button 
                className={styles.graphActionButton} 
                onClick={onFullscreen} 
                title="Fullscreen"
                aria-label="Toggle fullscreen view"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                  <path d="M4 7V4h3m9 0h-3v3m0 9v-3h3m-9 3H4v-3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
      <div className={styles.fullGraphContent}>
        {filteredData && filteredData.length > 0 ? (
          renderChart()
        ) : (
          <div style={{
            height: height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            fontSize: '14px'
          }}>
            No data available for the selected period
          </div>
        )}
      </div>
    </div>
  );
};

export default FullGraph;