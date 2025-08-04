import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  StyleSheet,
} from 'react-native';
import { theme } from '../../theme';
import { Card } from './Card';
import { Text } from './Typography';

export interface TableColumn {
  key: string;
  title: string;
  width?: number;
  flex?: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface TableAction {
  key: string;
  title: string;
  onPress: (row: any) => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: React.ReactNode;
}

interface DataTableProps {
  columns: TableColumn[];
  data: any[];
  actions?: TableAction[];
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  loading?: boolean;
  emptyMessage?: string;
  style?: ViewStyle;
  rowStyle?: ViewStyle;
  headerStyle?: ViewStyle;
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  actions,
  onSort,
  sortColumn,
  sortDirection,
  loading = false,
  emptyMessage = 'No data available',
  style,
  rowStyle,
  headerStyle,
}) => {
  const handleSort = (columnKey: string) => {
    if (!onSort) return;
    
    const newDirection = 
      sortColumn === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(columnKey, newDirection);
  };

  const renderHeader = () => (
    <View style={[styles.headerRow, headerStyle]}>
      {columns.map((column) => (
        <TouchableOpacity
          key={column.key}
          style={[
            styles.headerCell,
            {
              width: column.width,
              flex: column.flex || (column.width ? 0 : 1),
              alignItems: column.align === 'right' ? 'flex-end' : 
                         column.align === 'center' ? 'center' : 'flex-start',
            },
          ]}
          onPress={() => column.sortable && handleSort(column.key)}
          disabled={!column.sortable}
        >
          <Text style={styles.headerText}>
            {column.title}
          </Text>
          {column.sortable && sortColumn === column.key && (
            <Text style={styles.sortIndicator}>
              {sortDirection === 'asc' ? ' ↑' : ' ↓'}
            </Text>
          )}
        </TouchableOpacity>
      ))}
      {actions && actions.length > 0 && (
        <View style={[styles.headerCell, styles.actionsCell]}>
          <Text style={styles.headerText}>Actions</Text>
        </View>
      )}
    </View>
  );

  const renderRow = (row: any, index: number) => (
    <View key={index} style={[styles.dataRow, rowStyle]}>
      {columns.map((column) => (
        <View
          key={column.key}
          style={[
            styles.dataCell,
            {
              width: column.width,
              flex: column.flex || (column.width ? 0 : 1),
              alignItems: column.align === 'right' ? 'flex-end' : 
                         column.align === 'center' ? 'center' : 'flex-start',
            },
          ]}
        >
          {column.render ? (
            column.render(row[column.key], row)
          ) : (
            <Text style={styles.cellText} numberOfLines={2}>
              {row[column.key]?.toString() || '-'}
            </Text>
          )}
        </View>
      ))}
      {actions && actions.length > 0 && (
        <View style={[styles.dataCell, styles.actionsCell]}>
          <View style={styles.actionsContainer}>
            {actions.map((action) => (
              <TouchableOpacity
                key={action.key}
                style={[styles.actionButton, getActionButtonStyle(action.variant)]}
                onPress={() => action.onPress(row)}
              >
                {action.icon && (
                  <View style={styles.actionIcon}>
                    {action.icon}
                  </View>
                )}
                <Text style={[styles.actionText, getActionTextStyle(action.variant)]}>
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const getActionButtonStyle = (variant: string = 'ghost'): ViewStyle => {
    const variants = {
      primary: {
        backgroundColor: theme.colors.button.primary,
        borderColor: theme.colors.button.primary,
      },
      secondary: {
        backgroundColor: theme.colors.button.secondary,
        borderColor: theme.colors.button.secondary,
      },
      ghost: {
        backgroundColor: theme.colors.transparent,
        borderColor: theme.colors.border.primary,
      },
    };
    return variants[variant as keyof typeof variants] || variants.ghost;
  };

  const getActionTextStyle = (variant: string = 'ghost'): TextStyle => {
    const variants = {
      primary: { color: theme.colors.white },
      secondary: { color: theme.colors.white },
      ghost: { color: theme.colors.text.accent },
    };
    return variants[variant as keyof typeof variants] || variants.ghost;
  };

  if (loading) {
    return (
      <Card style={style}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card style={style}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      </Card>
    );
  }

  return (
    <Card style={[styles.tableContainer, style]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          {renderHeader()}
          <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={false}>
            {data.map((row, index) => renderRow(row, index))}
          </ScrollView>
        </View>
      </ScrollView>
    </Card>
  );
};

const styles = StyleSheet.create({
  tableContainer: {
    padding: 0,
  },
  table: {
    minWidth: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.tertiary,
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    borderBottomWidth: theme.layout.borderWidth.thin,
    borderBottomColor: theme.colors.border.primary,
  },
  headerCell: {
    paddingHorizontal: theme.spacing[2],
  },
  headerText: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.semiBold,
    textTransform: 'uppercase',
  },
  sortIndicator: {
    color: theme.colors.text.accent,
    fontSize: 12,
  },
  tableBody: {
    maxHeight: 400,
  },
  dataRow: {
    flexDirection: 'row',
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    borderBottomWidth: theme.layout.borderWidth.thin,
    borderBottomColor: theme.colors.border.secondary,
  },
  dataCell: {
    paddingHorizontal: theme.spacing[2],
    justifyContent: 'center',
  },
  cellText: {
    ...theme.textStyles.body,
    color: theme.colors.text.primary,
  },
  actionsCell: {
    minWidth: 120,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  actionButton: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.layout.borderRadius.sm,
    borderWidth: theme.layout.borderWidth.thin,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    marginRight: theme.spacing[1],
  },
  actionText: {
    ...theme.textStyles.caption,
    fontWeight: theme.typography.fontWeight.medium,
  },
  loadingContainer: {
    padding: theme.spacing[8],
    alignItems: 'center',
  },
  loadingText: {
    ...theme.textStyles.body,
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    padding: theme.spacing[8],
    alignItems: 'center',
  },
  emptyText: {
    ...theme.textStyles.body,
    color: theme.colors.text.secondary,
  },
});