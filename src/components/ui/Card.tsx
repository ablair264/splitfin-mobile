import React from 'react';
import {
  View,
  ViewStyle,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { theme } from '../../theme';
import { Text } from './Typography';

export type CardVariant = 'default' | 'elevated';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: number;
  margin?: number;
  backgroundColor?: string;
  borderRadius?: number;
  elevation?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  style,
  onPress,
  padding,
  margin,
  backgroundColor,
  borderRadius,
  elevation,
}) => {
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderWidth: theme.layout.borderWidth.thin,
      borderRadius: borderRadius ?? theme.layout.borderRadius.lg,
      padding: padding ?? theme.layout.cardPadding,
      margin: margin ?? 0,
    };

    const variantStyles: Record<CardVariant, ViewStyle> = {
      default: {
        backgroundColor: backgroundColor ?? theme.colors.background.card,
        borderColor: theme.colors.border.primary,
      },
      elevated: {
        backgroundColor: backgroundColor ?? theme.colors.background.elevated,
        borderColor: theme.colors.border.secondary,
        shadowColor: theme.colors.black,
        shadowOffset: {
          width: 0,
          height: elevation ?? theme.layout.elevation.small,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: elevation ?? theme.layout.elevation.small,
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
    };
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[getCardStyle(), style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      {children}
    </CardComponent>
  );
};

// Metric Card Component (for dashboard metrics) - Matches Splitfin design
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  chart?: React.ReactNode;
  chartData?: Array<{ x: number; y: number; date?: string; value?: number }>; // Real chart data
  onPress?: () => void;
  style?: ViewStyle;
  chartType?: 'line' | 'bar' | 'none';
  variant?: 'primary' | 'secondary' | 'tertiary' | 'custom';
  accentColor?: string; // Custom accent color option
}

export const MetricCard: React.FC<MetricCardProps> = React.memo(({
  title,
  value,
  subtitle,
  trend,
  chart,
  chartData,
  onPress,
  style,
  chartType = 'line',
  variant = 'primary',
  accentColor,
}) => {
  // Render chart based on real data
  const renderChart = React.useMemo(() => {
    if (chartType === 'none' || !chartData || chartData.length === 0) return chart || null;

    if (chartType === 'line') {
      // Normalize data points to fit in chart area
      const values = chartData.map(d => d.value || d.y);
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      const valueRange = maxValue - minValue || 1;
      
      const points = chartData.map((dataPoint, index) => {
        const actualValue = dataPoint.value || dataPoint.y;
        return {
          x: (index / (chartData.length - 1)) * 100,
          y: 45 - ((actualValue - minValue) / valueRange) * 40,
        };
      });

      return (
        <View style={styles.chartContainer}>
          <View style={styles.lineChart}>
            {/* Gradient area under the line */}
            <View style={[
              styles.chartGradientArea,
              { backgroundColor: `${chartColor}20` } // 20 is hex for 0.125 opacity
            ]} />
            
            {/* Connect the dots with lines */}
            {points.slice(0, -1).map((point, index) => {
              const nextPoint = points[index + 1];
              const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180 / Math.PI;
              const length = Math.sqrt(
                Math.pow(nextPoint.x - point.x, 2) + Math.pow(nextPoint.y - point.y, 2)
              );
              
              return (
                <View
                  key={`line-${index}`}
                  style={[
                    styles.chartLine,
                    {
                      left: `${point.x}%`,
                      top: point.y,
                      width: length,
                      transform: [
                        { translateX: 0 },
                        { translateY: -1 },
                        { rotate: `${angle}deg` },
                      ],
                      backgroundColor: chartColor,
                    },
                  ]}
                />
              );
            })}
            
            {/* Plot the points */}
            {points.map((point, index) => (
              <View
                key={index}
                style={[
                  styles.linePoint,
                  { 
                    left: `${point.x}%`,
                    top: point.y - 3,
                    backgroundColor: chartColor,
                  }
                ]}
              />
            ))}
          </View>
        </View>
      );
    }

    if (chartType === 'bar') {
      // Normalize bar data
      const values = chartData.map(d => d.value || d.y);
      const maxValue = Math.max(...values) || 1;
      
      return (
        <View style={styles.chartContainer}>
          <View style={styles.barChart}>
            {chartData.slice(0, 8).map((bar, index) => {
              const barValue = bar.value || bar.y;
              const barHeight = (barValue / maxValue) * 100;
              
              return (
                <View
                  key={index}
                  style={[
                    styles.barItem,
                    { 
                      height: `${Math.max(5, barHeight)}%`,
                      backgroundColor: chartColor,
                    }
                  ]}
                />
              );
            })}
          </View>
        </View>
      );
    }

    return chart;
  }, [chartType, variant, chart, chartData]);

  // Get the color for charts based on variant or custom color
  const chartColor = accentColor || (
    variant === 'primary' ? '#79d5e9' : 
    variant === 'secondary' ? '#4daeac' : 
    variant === 'tertiary' ? '#f77d11' : '#79d5e9'
  );

  return (
    <TouchableOpacity
      style={[getMetricCardStyle(variant, accentColor), style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
      disabled={!onPress}
    >
      {/* Card Header */}
      <View style={styles.metricHeader}>
        <Text style={styles.metricTitle}>
          {title}
        </Text>
        {trend && (
          <View style={[
            styles.trendContainer,
            { backgroundColor: trend.isPositive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)' }
          ]}>
            <Text style={{
              fontSize: 11,
              fontWeight: '700',
              color: trend.isPositive ? '#10b981' : '#ef4444',
              marginRight: 2,
            }}>
              {trend.isPositive ? '↗' : '↘'}
            </Text>
            <Text style={{
              fontSize: 11,
              fontWeight: '600',
              color: trend.isPositive ? '#10b981' : '#ef4444',
            }}>
              {Math.abs(trend.value)}%
            </Text>
          </View>
        )}
      </View>
      
      {/* Main Value */}
      <Text style={styles.metricValue}>
        {value}
      </Text>
      
      {/* Subtitle */}
      {subtitle && (
        <Text style={styles.metricSubtitle}>
          {subtitle}
        </Text>
      )}
      
      {/* Chart */}
      {renderChart}
    </TouchableOpacity>
  );
});

const getMetricCardStyle = (variant: string, accentColor?: string) => {
  const baseStyle = {
    minHeight: 200,
    backgroundColor: '#1e2937', // Darker card background matching web
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  };

  const variantColors = {
    primary: '#79d5e9', // Cyan
    secondary: '#4daeac', // Teal
    tertiary: '#f77d11', // Orange
    custom: accentColor || '#79d5e9', // Use custom color or default
  };

  return {
    ...baseStyle,
    borderColor: variantColors[variant] || variantColors.primary,
  };
};

const styles = StyleSheet.create({
  metricCard: {
    // Styles moved to getMetricCardStyle function
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    lineHeight: 14,
  },
  metricValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginVertical: 8,
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  metricSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 12,
    lineHeight: 16,
  },
  trendContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartContainer: {
    height: 50,
    width: '100%',
    marginTop: 8,
  },
  lineChart: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  linePoint: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    zIndex: 3,
    shadowColor: '#79d5e9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  chartLine: {
    position: 'absolute',
    height: 2,
    transformOrigin: 'left center',
    zIndex: 2,
  },
  chartGradientArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    borderRadius: 4,
    opacity: 0.3,
  },
  baselineStroke: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(121, 213, 233, 0.2)',
  },
  trendGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 25,
    backgroundColor: 'rgba(121, 213, 233, 0.05)',
    borderRadius: 4,
  },
  barChart: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  barItem: {
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 2,
    minHeight: 4,
    maxWidth: 12,
  },
});

