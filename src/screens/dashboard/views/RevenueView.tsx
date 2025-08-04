import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { theme } from '../../../theme';
import { MetricCard, Text } from '../../../components/ui';

interface RevenueViewProps {
  data: any;
  onNavigate: (route: string) => void;
}

export const RevenueView: React.FC<RevenueViewProps> = ({
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
        <Text style={styles.title}>Revenue Analysis</Text>
        <Text style={styles.subtitle}>Detailed revenue breakdown and trends</Text>
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard
          title="TOTAL REVENUE"
          value="£67,068.0"
          subtitle="All channels combined"
          trend={{ value: 14, isPositive: true }}
          style={styles.metricCard}
        />
        
        <MetricCard
          title="MONTHLY REVENUE"
          value="£22,356.0"
          subtitle="This month"
          trend={{ value: 8, isPositive: true }}
          style={styles.metricCard}
        />
        
        <MetricCard
          title="WEEKLY REVENUE"
          value="£5,589.0"
          subtitle="This week"
          trend={{ value: 12, isPositive: true }}
          style={styles.metricCard}
        />
        
        <MetricCard
          title="REVENUE PER CUSTOMER"
          value="£46.0"
          subtitle="Average per customer"
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