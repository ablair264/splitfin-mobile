import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { theme } from '../../../theme';
import { MetricCard, Text } from '../../../components/ui';

interface BrandViewProps {
  data: any;
  onNavigate: (route: string) => void;
}

export const BrandView: React.FC<BrandViewProps> = ({
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
        <Text style={styles.title}>Brand Performance</Text>
        <Text style={styles.subtitle}>Performance metrics by brand</Text>
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard
          title="TOP BRAND REVENUE"
          value="£25,400.0"
          subtitle="Rader"
          trend={{ value: 18, isPositive: true }}
          style={styles.metricCard}
        />
        
        <MetricCard
          title="BRAND COUNT"
          value="8"
          subtitle="Active brands"
          trend={{ value: 2, isPositive: true }}
          style={styles.metricCard}
        />
        
        <MetricCard
          title="AVG BRAND REVENUE"
          value="£8,384.0"
          subtitle="Per brand"
          trend={{ value: 7, isPositive: true }}
          style={styles.metricCard}
        />
        
        <MetricCard
          title="BRAND ORDERS"
          value="184"
          subtitle="Total orders"
          trend={{ value: 11, isPositive: true }}
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