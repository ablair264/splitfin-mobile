import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { theme } from '../../theme';
import { Text } from './Typography';

interface CardChartProps {
  title: string;
  value: string;
  subtitle: string;
  data: Array<{ x: number; y: number }>;
  type: 'line' | 'bar' | 'area';
  color?: string;
  style?: any;
  onPress?: () => void;
}

export const CardChart: React.FC<CardChartProps> = ({
  title,
  value,
  subtitle,
  data,
  type = 'line',
  color = '#79d5e9',
  style,
  onPress,
}) => {
  const chartWidth = 200;
  const chartHeight = 60;
  
  const renderLineChart = () => {
    const points = data.map((point, index) => ({
      x: (index / (data.length - 1)) * chartWidth,
      y: chartHeight - (point.y / 100) * chartHeight,
    }));

    return (
      <View style={styles.chartContainer}>
        {/* Chart points */}
        {points.map((point, index) => (
          <View
            key={index}
            style={[
              styles.chartPoint,
              {
                left: point.x - 2,
                top: point.y - 2,
                backgroundColor: color,
              }
            ]}
          />
        ))}
        
        {/* Connecting lines */}
        {points.slice(0, -1).map((point, index) => {
          const nextPoint = points[index + 1];
          const length = Math.sqrt(
            Math.pow(nextPoint.x - point.x, 2) + Math.pow(nextPoint.y - point.y, 2)
          );
          const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180 / Math.PI;
          
          return (
            <View
              key={`line-${index}`}
              style={[
                styles.chartLine,
                {
                  left: point.x,
                  top: point.y,
                  width: length,
                  backgroundColor: color,
                  transform: [{ rotate: `${angle}deg` }],
                }
              ]}
            />
          );
        })}
      </View>
    );
  };

  const renderBarChart = () => {
    return (
      <View style={styles.barChartContainer}>
        {data.slice(0, 8).map((bar, index) => (
          <View
            key={index}
            style={[
              styles.barItem,
              {
                height: Math.max(4, (bar.y / 100) * chartHeight),
                backgroundColor: color,
              }
            ]}
          />
        ))}
      </View>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'line':
      default:
        return renderLineChart();
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      
      <View style={styles.chartWrapper}>
        {renderChart()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e2937',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#79d5e9',
    padding: 20,
    minHeight: 180,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  content: {
    marginBottom: 16,
  },
  value: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },
  chartWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  chartContainer: {
    position: 'relative',
    height: 60,
    width: '100%',
  },
  chartPoint: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  chartLine: {
    position: 'absolute',
    height: 2,
    transformOrigin: '0 50%',
  },
  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 60,
    paddingHorizontal: 4,
  },
  barItem: {
    width: 12,
    borderRadius: 2,
    minHeight: 4,
  },
});