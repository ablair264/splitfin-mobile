import React, { useState } from 'react';
import {
  View,
  TextInput,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Text } from './Typography';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  disabled?: boolean;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  onSubmitEditing?: () => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  disabled = false,
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  style,
  inputStyle,
  leftIcon,
  rightIcon,
  onRightIconPress,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  returnKeyType = 'done',
  onSubmitEditing,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const getContainerStyle = (): ViewStyle => ({
    marginBottom: theme.spacing[4],
  });

  const getInputContainerStyle = (): ViewStyle => ({
    flexDirection: 'row',
    alignItems: multiline ? 'flex-start' : 'center',
    backgroundColor: theme.colors.input.background,
    borderWidth: theme.layout.borderWidth.thin,
    borderColor: error
      ? theme.colors.status.error
      : isFocused
      ? theme.colors.input.focus
      : theme.colors.input.border,
    borderRadius: theme.layout.borderRadius.md,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: multiline ? theme.spacing[3] : 0,
    minHeight: multiline ? undefined : theme.layout.inputHeight,
    opacity: disabled ? 0.6 : 1,
  });

  const getInputStyle = (): TextStyle => ({
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    paddingVertical: multiline ? 0 : theme.spacing[3],
    textAlignVertical: multiline ? 'top' : 'center',
  });

  const getLabelStyle = (): TextStyle => ({
    ...theme.textStyles.bodySmall,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
    fontWeight: theme.typography.fontWeight.medium,
  });

  const getErrorStyle = (): TextStyle => ({
    ...theme.textStyles.caption,
    color: theme.colors.status.error,
    marginTop: theme.spacing[1],
  });

  const iconSize = 20;

  return (
    <View style={[getContainerStyle(), style]}>
      {label && <Text style={getLabelStyle()}>{label}</Text>}
      
      <View style={getInputContainerStyle()}>
        {leftIcon && (
          <View style={styles.leftIcon}>
            {React.cloneElement(leftIcon as React.ReactElement, {
              size: iconSize,
              color: theme.colors.text.tertiary,
            })}
          </View>
        )}
        
        <TextInput
          style={[getInputStyle(), inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.input.placeholder}
          editable={!disabled}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        
        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {React.cloneElement(rightIcon as React.ReactElement, {
              size: iconSize,
              color: theme.colors.text.tertiary,
            })}
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={getErrorStyle()}>{error}</Text>}
    </View>
  );
};

// Search Input Component (commonly used in Splitfin)
interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  style?: ViewStyle;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
  style,
}) => {
  return (
    <View style={[styles.searchContainer, style]}>
      <View style={styles.searchInputContainer}>
        <View style={styles.searchIcon}>
          {/* Search icon would go here */}
          <Feather name="search" size={18} color={theme.colors.text.tertiary} />
        </View>
        
        <TextInput
          style={styles.searchInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.input.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        
        {value.length > 0 && onClear && (
          <TouchableOpacity style={styles.clearButton} onPress={onClear}>
            <Feather name="x" size={16} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  leftIcon: {
    marginRight: theme.spacing[2],
  },
  rightIcon: {
    marginLeft: theme.spacing[2],
    padding: theme.spacing[1],
  },
  searchContainer: {
    marginBottom: theme.spacing[4],
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.input.background,
    borderWidth: theme.layout.borderWidth.thin,
    borderColor: theme.colors.input.border,
    borderRadius: theme.layout.borderRadius.md,
    paddingHorizontal: theme.spacing[3],
    height: theme.layout.inputHeight,
  },
  searchIcon: {
    marginRight: theme.spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  clearButton: {
    marginLeft: theme.spacing[2],
    padding: theme.spacing[1],
  },
});