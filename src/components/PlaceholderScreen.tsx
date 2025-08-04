// src/components/PlaceholderScreen.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './ui/Typography';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface PlaceholderScreenProps {
  title: string;
}

export default function PlaceholderScreen({ title }: PlaceholderScreenProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="construct-outline" size={64} color={theme.colors.text.tertiary} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>This feature is coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', // Let the gradient background show through
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
});
