import React from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  ResponsiveContainer, XAxis, YAxis, Tooltip
} from 'recharts';
import CountUp from 'react-countup';
import { useColors } from './ColorProvider';
import styles from './MetricCard.module.css';

export interface MetricCardProps {
  id: string;
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  chartData?: Array<{ name: string; value: number }>;
  format?: 'currency' | 'number' | 'percentage';
  displayMode?: 'full' | 'compact';
  design?: 'variant1' | 'variant2' | 'variant3';
  icon?: React.ReactNode;
  color?: string;
  onClick?: () => void;
  onOptionsClick?: () => void;
  onVariantChange?: (variant: 'variant1' | 'variant2' | 'variant3') => void;
  cardIndex?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({
  id,
  title,
  value,
  subtitle,
  trend,
  chartData = [],
  format = 'number',
  displayMode = 'full',
  design = 'variant1',
  icon,
  color: propColor,
  onClick,
  onOptionsClick,
  onVariantChange,
  cardIndex = 0
}) => {
  const { getMetricCardColor } = useColors();
  
  // Use context color if no specific color is provided
  const color = propColor || getMetricCardColor(cardIndex);

  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-GB', {
          style: 'currency',
          currency: 'GBP',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      default:
        return new Intl.NumberFormat('en-GB').format(val);
    }
  };

  const chartConfig = {
    margin: { top: 5, right: 10, bottom: 5, left: 10 },
    strokeWidth: 2,
  };

  const renderVariantSelector = () => {
    if (!onVariantChange) return null;
    
    return (
      <div className={styles.variantSelector}>
        <button
          className={`${styles.variantButton} ${design === 'variant1' ? styles.active : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onVariantChange('variant1');
          }}
          title="Area Chart"
        >
          1
        </button>
        <button
          className={`${styles.variantButton} ${design === 'variant2' ? styles.active : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onVariantChange('variant2');
          }}
          title="Line Chart"
        >
          2
        </button>
        <button
          className={`${styles.variantButton} ${design === 'variant3' ? styles.active : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onVariantChange('variant3');
          }}
          title="Bar Chart"
        >
          3
        </button>
      </div>
    );
  };

  const renderChart = () => {
    if (!chartData || chartData.length === 0) return null;

    const ChartComponent = design === 'variant3' ? BarChart : design === 'variant2' ? LineChart : AreaChart;
    const DataComponent = design === 'variant3' ? Bar : design === 'variant2' ? Line : Area;

    return (
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent data={chartData} {...chartConfig}>
          <defs>
            <linearGradient id={`gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="name" hide />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: '#1a1f2a',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              fontSize: '12px',
              padding: '8px'
            }}
            labelStyle={{ color: '#a0a0a0' }}
            formatter={(value: number) => [
              format === 'currency' ? `£${Math.round(value).toLocaleString()}` :
              format === 'percentage' ? `${Math.round(value)}%` :
              Math.round(value).toLocaleString(),
              ''
            ]}
          />
          {design === 'variant3' ? (
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
          ) : design === 'variant2' ? (
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
            />
          ) : (
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              fill={`url(#gradient-${id})`}
              strokeWidth={2}
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  if (displayMode === 'compact') {
    return (
      <div 
        className={styles.metricCardCompact} 
        onClick={onClick} 
        style={{ 
          borderLeftColor: color,
          borderLeftWidth: '3px'
        }}
      >
        {icon && (
          <div className={styles.compactIcon} style={{ backgroundColor: `${color}15` }}>
            {icon}
          </div>
        )}
        <div className={styles.compactContent}>
          <div className={styles.compactValue} style={{ color }}>
            {typeof value === 'number' ? (
              <CountUp
                end={value}
                duration={1.5}
                separator=","
                prefix={format === 'currency' ? '£' : ''}
                suffix={format === 'percentage' ? '%' : ''}
                decimals={format === 'percentage' ? 1 : 0}
              />
            ) : (
              value
            )}
          </div>
          <div className={styles.compactTitle}>{title}</div>
        </div>
        {trend && (
          <div className={`${styles.compactTrend} ${trend.isPositive ? styles.positive : styles.negative}`}>
            <span className={styles.trendIcon}>{trend.isPositive ? '↑' : '↓'}</span>
            <span className={styles.trendValue}>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`${styles.metricCardFull} ${styles[`metricCard${design.charAt(0).toUpperCase() + design.slice(1)}`]}`} 
      onClick={onClick} 
      style={{ 
        borderTopColor: design === 'variant3' ? color : undefined,
        borderLeftColor: design === 'variant2' ? color : undefined,
        borderColor: design === 'variant1' ? color : undefined,
        background: design === 'variant1' ? `linear-gradient(135deg, var(--background-white) 0%, ${color}15 100%)` : undefined
      }}
    >
      <div className={styles.cardHeader}>
        <div className={styles.headerLeft}>
          <h3 className={styles.cardTitle}>{title}</h3>
        </div>
        <div className={styles.headerRight}>
          {trend && (
            <div className={`${styles.trendIndicator} ${trend.isPositive ? styles.positive : styles.negative}`}>
              <span className={styles.trendIcon}>{trend.isPositive ? '↑' : '↓'}</span>
              <span className={styles.trendValue}>{Math.abs(trend.value)}%</span>
            </div>
          )}
          {renderVariantSelector()}
          {onOptionsClick && (
            <button className={styles.optionsButton} onClick={(e) => {
              e.stopPropagation();
              onOptionsClick();
            }}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <circle cx="10" cy="4" r="1.5" />
                <circle cx="10" cy="10" r="1.5" />
                <circle cx="10" cy="16" r="1.5" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className={styles.cardValue}>
        {typeof value === 'number' ? (
          <CountUp
            end={value}
            duration={1.5}
            separator=","
            prefix={format === 'currency' ? '£' : ''}
            suffix={format === 'percentage' ? '%' : ''}
            decimals={format === 'percentage' ? 1 : 0}
          />
        ) : (
          value
        )}
      </div>
      
      {subtitle && <div className={styles.cardSubtitle}>{subtitle}</div>}
      
      {chartData && chartData.length > 0 && (
        <div className={styles.cardChart}>
          {renderChart()}
        </div>
      )}
      
      {chartData && chartData.length > 0 && (
        <div className={styles.cardDateRange}>
          <span>{chartData[0]?.name}</span>
          <span>{chartData[chartData.length - 1]?.name}</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;