import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Text } from './Typography';

interface BreadcrumbItem {
  label: string;
  route?: string;
  onPress?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate?: (route: string) => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, onNavigate }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => onNavigate?.('Dashboard')}
      >
        <Ionicons name="home" size={16} color="rgba(255, 255, 255, 0.6)" />
      </TouchableOpacity>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <Text style={styles.separator}>›</Text>
          {item.route && index < items.length - 1 ? (
            <TouchableOpacity
              style={styles.item}
              onPress={() => item.onPress?.() || onNavigate?.(item.route!)}
            >
              <Text style={styles.itemText}>{item.label}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.itemText, styles.activeItemText]}>
              {item.label}
            </Text>
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 44,
  },
  homeButton: {
    padding: 8,
    marginRight: 4,
    borderRadius: 6,
  },
  item: {
    padding: 6,
    borderRadius: 6,
  },
  itemText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  activeItemText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  separator: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 8,
  },
});
