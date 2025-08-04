import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { theme } from '../../../theme';
import { MetricCard, Text } from '../../../components/ui';

interface OrdersViewProps {
  data: any;
  onNavigate: (route: string) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
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
        <Text style={styles.title}>Orders Analysis</Text>
        <Text style={styles.subtitle}>Order metrics and performance</Text>
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard
          title="TOTAL ORDERS"
          value="236"
          subtitle="All orders"
          trend={{ value: 9, isPositive: true }}
          style={styles.metricCard}
        />
        
        <MetricCard
          title="PENDING ORDERS"
          value="12"
          subtitle="Awaiting processing"
          trend={{ value: 3, isPositive: false }}
          style={styles.metricCard}
        />
        
        <MetricCard
          title="COMPLETED ORDERS"
          value="224"
          subtitle="Successfully fulfilled"
          trend={{ value: 11, isPositive: true }}
          style={styles.metricCard}
        />
        
        <MetricCard
          title="AVG ORDER VALUE"
          value="£284.0"
          subtitle="Per order"
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