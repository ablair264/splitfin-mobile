import React from 'react';
import {
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { theme } from '../../theme';
import { Text } from './Typography';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
  leftIcon,
  rightIcon,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.layout.borderRadius.md,
      borderWidth: theme.layout.borderWidth.thin,
      opacity: disabled ? 0.6 : 1,
    };

    // Size styles
    const sizeStyles: Record<ButtonSize, ViewStyle> = {
      small: {
        height: theme.layout.buttonHeight.small,
        paddingHorizontal: theme.spacing[3],
      },
      medium: {
        height: theme.layout.buttonHeight.medium,
        paddingHorizontal: theme.spacing[4],
      },
      large: {
        height: theme.layout.buttonHeight.large,
        paddingHorizontal: theme.spacing[6],
      },
    };

    // Variant styles
    const variantStyles: Record<ButtonVariant, ViewStyle> = {
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
        borderColor: theme.colors.transparent,
      },
      outline: {
        backgroundColor: theme.colors.transparent,
        borderColor: theme.colors.border.accent,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(fullWidth && { width: '100%' }),
    };
  };

  const getTextStyle = (): TextStyle => {
    const sizeTextStyles: Record<ButtonSize, TextStyle> = {
      small: { 
        fontSize: 12, 
        fontWeight: '500',
      },
      medium: { 
        fontSize: 14, 
        fontWeight: '600',
      },
      large: { 
        fontSize: 16, 
        fontWeight: '600',
      },
    };

    const variantTextStyles: Record<ButtonVariant, TextStyle> = {
      primary: { color: theme.colors.white },
      secondary: { color: theme.colors.white },
      ghost: { color: theme.colors.text.primary },
      outline: { color: theme.colors.text.accent },
    };

    return {
      ...sizeTextStyles[size],
      ...variantTextStyles[variant],
    };
  };

  const iconSize = size === 'small' ? 16 : size === 'medium' ? 18 : 20;
  const iconSpacing = theme.spacing[2];

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'secondary' ? theme.colors.white : theme.colors.text.accent}
        />
      ) : (
        <>
          {leftIcon && (
            <View style={{ marginRight: iconSpacing }}>
              {leftIcon}
            </View>
          )}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          {rightIcon && (
            <View style={{ marginLeft: iconSpacing }}>
              {rightIcon}
            </View>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Additional styles if needed
});