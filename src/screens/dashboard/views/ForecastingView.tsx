import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { theme } from '../../../theme';
import { MetricCard, Text } from '../../../components/ui';

interface ForecastingViewProps {
  data: any;
  onNavigate: (route: string) => void;
}

export const ForecastingView: React.FC<ForecastingViewProps> = ({
  data,
  onNavigate,
}) => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Sales Forecasting</Text>
        <Text style={styles.subtitle}>Predictive analytics and trends</Text>
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard
          title="NEXT MONTH FORECAST"
          value="£75,000.0"
          subtitle="Projected revenue"
          trend={{ value: 12, isPositive: true }}
          style={styles.metricCard}
        />
        
        <MetricCard
          title="QUARTERLY FORECAST"
          value="£225,000.0"
          subtitle="Q4 projection"
          trend={{ value: 8, isPositive: true }}
          style={styles.metricCard}
        />
        
        <MetricCard
          title="GROWTH RATE"
          value="14.2%"
          subtitle="Month over month"
          trend={{ value: 2, isPositive: true }}
          style={styles.metricCard}
        />
        
        <MetricCard
          title="CONFIDENCE SCORE"
          value="85%"
          subtitle="Forecast accuracy"
          trend={{ value: 5, isPositive: true }}
          style={styles.metricCard}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing[4],
  },
  header: {
    marginBottom: theme.spacing[6],
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  metricsGrid: {
    gap: theme.spacing[4],
  },
  metricCard: {
    marginBottom: theme.spacing[4],
  },
});