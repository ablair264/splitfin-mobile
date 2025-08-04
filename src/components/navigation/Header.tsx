import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { theme } from '../../theme';
import { useResponsive } from '../../hooks/useResponsive';
import { Text } from '../ui/Typography';

interface HeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: {
    icon: React.ReactNode;
    onPress: () => void;
  };
  rightActions?: Array<{
    key: string;
    icon: React.ReactNode;
    onPress: () => void;
  }>;
  showBackButton?: boolean;
  onBackPress?: () => void;
  breadcrumbs?: Array<{
    title: string;
    onPress?: () => void;
  }>;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  leftAction,
  rightActions = [],
  showBackButton = false,
  onBackPress,
  breadcrumbs,
}) => {
  const { isTablet } = useResponsive();

  const renderBreadcrumbs = () => {
    if (!breadcrumbs || breadcrumbs.length === 0) return null;

    return (
      <View style={styles.breadcrumbContainer}>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            <TouchableOpacity
              onPress={crumb.onPress}
              disabled={!crumb.onPress}
              style={styles.breadcrumbItem}
            >
              <Text
                style={[
                  styles.breadcrumbText,
                  index === breadcrumbs.length - 1 && styles.activeBreadcrumb,
                  !crumb.onPress && styles.disabledBreadcrumb,
                ]}
              >
                {crumb.title}
              </Text>
            </TouchableOpacity>
            {index < breadcrumbs.length - 1 && (
              <Text style={styles.breadcrumbSeparator}>/</Text>
            )}
          </React.Fragment>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          {showBackButton && onBackPress && (
            <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
          )}
          
          {leftAction && (
            <TouchableOpacity style={styles.actionButton} onPress={leftAction.onPress}>
              {leftAction.icon}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.centerSection}>
          {breadcrumbs && renderBreadcrumbs()}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.rightSection}>
          {rightActions.map((action) => (
            <TouchableOpacity
              key={action.key}
              style={styles.actionButton}
              onPress={action.onPress}
            >
              {action.icon}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: theme.layout.borderWidth.thin,
    borderBottomColor: theme.colors.border.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: theme.layout.headerHeight,
    paddingHorizontal: theme.spacing[4],
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60,
    justifyContent: 'flex-end',
  },
  backButton: {
    padding: theme.spacing[2],
    marginRight: theme.spacing[2],
  },
  backIcon: {
    fontSize: 20,
    color: theme.colors.text.primary,
  },
  actionButton: {
    padding: theme.spacing[2],
    marginHorizontal: theme.spacing[1],
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[1],
  },
  breadcrumbItem: {
    paddingHorizontal: theme.spacing[1],
  },
  breadcrumbText: {
    ...theme.textStyles.caption,
    color: theme.colors.text.accent,
  },
  activeBreadcrumb: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  disabledBreadcrumb: {
    color: theme.colors.text.secondary,
  },
  breadcrumbSeparator: {
    ...theme.textStyles.caption,
    color: theme.colors.text.tertiary,
    marginHorizontal: theme.spacing[1],
  },
  title: {
    ...theme.textStyles.h4,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.textStyles.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing[1],
  },
});