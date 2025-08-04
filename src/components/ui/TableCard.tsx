import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { theme } from '../../theme';
import { Text } from './Typography';

interface TableCardProps {
  title: string;
  data: Array<{
    [key: string]: string | number;
  }>;
  columns: Array<{
    key: string;
    title: string;
    width?: number;
  }>;
  style?: any;
  onRowPress?: (row: any) => void;
}

export const TableCard: React.FC<TableCardProps> = ({
  title,
  data,
  columns,
  style,
  onRowPress,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>
      
      <ScrollView style={styles.tableContainer} showsVerticalScrollIndicator={false}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          {columns.map((column) => (
            <View
              key={column.key}
              style={[
                styles.headerCell,
                { flex: column.width || 1 }
              ]}
            >
              <Text style={styles.headerCellText}>{column.title}</Text>
            </View>
          ))}
        </View>
        
        {/* Data Rows */}
        {data.map((row, index) => (
          <TouchableOpacity
            key={index}
            style={styles.dataRow}
            onPress={() => onRowPress?.(row)}
            disabled={!onRowPress}
          >
            {columns.map((column) => (
              <View
                key={column.key}
                style={[
                  styles.dataCell,
                  { flex: column.width || 1 }
                ]}
              >
                <Text style={styles.dataCellText}>
                  {row[column.key]?.toString() || '—'}
                </Text>
              </View>
            ))}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e2937',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#79d5e9',
    overflow: 'hidden',
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
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableContainer: {
    maxHeight: 300,
  },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(121, 213, 233, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(121, 213, 233, 0.2)',
  },
  headerCell: {
    paddingRight: 12,
  },
  headerCellText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#79d5e9',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dataRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dataCell: {
    paddingRight: 12,
  },
  dataCellText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    lineHeight: 20,
  },
});