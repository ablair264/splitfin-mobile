import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { theme } from '../../theme';
import { Text } from './Typography';

interface FullGraphProps {
  title: string;
  data: Array<{ 
    label: string; 
    value: number; 
    color?: string;
  }>;
  type: 'pie' | 'donut' | 'bar' | 'line';
  style?: any;
  onPress?: () => void;
  legendPosition?: 'bottom' | 'right' | 'none';
}

export const FullGraph: React.FC<FullGraphProps> = ({
  title,
  data,
  type = 'bar',
  style,
  onPress,
  legendPosition = 'bottom',
}) => {
  const colors = [
    '#79d5e9', '#4daeac', '#f77d11', '#ef4444', '#10b981', '#8b5cf6', '#f59e0b'
  ];

  const dataWithColors = data.map((item, index) => ({
    ...item,
    color: item.color || colors[index % colors.length],
  }));

  const maxValue = Math.max(...data.map(item => item.value));

  const renderBarChart = () => (
    <View style={styles.barChart}>
      <View style={styles.yAxis}>
        {[4, 3, 2, 1, 0].map((tick) => (
          <Text key={tick} style={styles.yAxisLabel}>
            {Math.round((maxValue * tick) / 4)}
          </Text>
        ))}
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.barsContainer}>
          {dataWithColors.map((item, index) => (
            <View key={index} style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(4, (item.value / maxValue) * 120),
                    backgroundColor: item.color,
                  }
                ]}
              />
              <Text style={styles.barLabel} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderDonutChart = () => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <View style={styles.donutContainer}>
        <View style={styles.donutChart}>
          {/* Simplified donut representation */}
          <View style={styles.donutInner}>
            <Text style={styles.donutTotal}>{total}</Text>
            <Text style={styles.donutLabel}>Total</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderLegend = () => {
    if (legendPosition === 'none') return null;
    
    return (
      <View style={[
        styles.legend,
        legendPosition === 'right' && styles.legendRight
      ]}>
        {dataWithColors.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: item.color }]}
            />
            <Text style={styles.legendText}>
              {item.label}: {item.value}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'donut':
      case 'pie':
        return renderDonutChart();
      case 'bar':
      default:
        return renderBarChart();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>
      
      <View style={styles.content}>
        {renderChart()}
      </View>
      
      {renderLegend()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e2937',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#79d5e9',
    padding: 20,
    minHeight: 250,
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
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    minHeight: 140,
  },
  
  // Bar Chart Styles
  barChart: {
    flexDirection: 'row',
    flex: 1,
  },
  yAxis: {
    justifyContent: 'space-between',
    paddingRight: 12,
    height: 120,
  },
  yAxisLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'right',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    paddingBottom: 20,
  },
  barWrapper: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 40,
  },
  bar: {
    width: 20,
    borderRadius: 4,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    maxWidth: 50,
  },
  
  // Donut Chart Styles
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  donutChart: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 20,
    borderColor: '#79d5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutInner: {
    alignItems: 'center',
  },
  donutTotal: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  donutLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  
  // Legend Styles
  legend: {
    marginTop: 16,
  },
  legendRight: {
    position: 'absolute',
    right: 20,
    top: 60,
    marginTop: 0,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});