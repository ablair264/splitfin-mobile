import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { AppLayout } from '../layouts/AppLayout';
import { Button, MetricCard, SearchInput } from '../components/ui';
import { theme } from '../theme';

export const TestScreen: React.FC = () => {
  const [searchValue, setSearchValue] = React.useState('');

  return (
    <AppLayout title="Component Test" showHeader={true}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        {/* Test MetricCard */}
        <MetricCard
          title="TEST METRIC"
          value="1,234"
          subtitle="Test subtitle"
          trend={{ value: 12, isPositive: true }}
          style={styles.card}
        />

        {/* Test Search Input */}
        <SearchInput
          value={searchValue}
          onChangeText={setSearchValue}
          placeholder="Test search..."
          onClear={() => setSearchValue('')}
        />

        {/* Test Buttons */}
        <Button
          title="Primary Button"
          variant="primary"
          onPress={() => console.log('Primary pressed')}
          style={styles.button}
        />

        <Button
          title="Secondary Button"  
          variant="secondary"
          onPress={() => console.log('Secondary pressed')}
          style={styles.button}
        />

      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: theme.spacing[4],
  },
  card: {
    marginBottom: theme.spacing[4],
  },
  button: {
    marginBottom: theme.spacing[3],
  },
});