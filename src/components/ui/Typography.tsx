import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle, StyleSheet } from 'react-native';
import { theme } from '../../theme';

interface TypographyProps extends RNTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'bodySmall' | 'caption' | 'overline' | 'metricLarge' | 'metricMedium' | 'metricSmall';
  color?: string;
}

export const Typography: React.FC<TypographyProps> = ({ 
  children, 
  style, 
  variant = 'body',
  color,
  ...props 
}) => {
  const getVariantStyle = (): TextStyle => {
    const variantStyle = theme.textStyles[variant];
    
    // Always ensure we have a color - this fixes the invisible text issue
    const finalColor = color || variantStyle.color || theme.colors.text.primary || '#FFFFFF';
    
    // Calculate lineHeight based on fontSize - convert ratio to pixels
    const fontSize = variantStyle.fontSize || 16;
    const lineHeightRatio = variantStyle.lineHeight || 1.5;
    const lineHeight = typeof lineHeightRatio === 'number' && lineHeightRatio < 10 
      ? fontSize * lineHeightRatio // Convert ratio to pixels
      : lineHeightRatio || (fontSize * 1.5); // Use as-is if already pixels
    const minHeight = Math.max(lineHeight, 20);
    
    return {
      ...variantStyle,
      color: finalColor,
      lineHeight, // CRITICAL: Always set lineHeight
      minHeight, // CRITICAL: Always set minHeight
    };
  };

  const combinedStyle = [
    getVariantStyle(),
    style,
  ];

  return (
    <RNText style={combinedStyle} {...props}>
      {children}
    </RNText>
  );
};

// Also export a basic Text component that always has a color
export const Text: React.FC<RNTextProps> = ({ children, style, ...props }) => {
  const defaultStyle: TextStyle = {
    color: '#FFFFFF', // Always white text to ensure visibility
    fontSize: 16,
    lineHeight: 24, // CRITICAL: Explicit line height for iOS
    minHeight: 24, // CRITICAL: Minimum height to ensure text renders
    fontFamily: 'System', // Explicitly set font family
  };

  // Flatten styles and ensure color is always set
  const flatStyle = StyleSheet.flatten([defaultStyle, style]);
  const finalStyle = {
    ...flatStyle,
    color: flatStyle.color || '#FFFFFF', // Force color even after flattening
    lineHeight: flatStyle.lineHeight || 24, // Always ensure lineHeight
    minHeight: flatStyle.minHeight || 24, // Always ensure minHeight
  };

  return (
    <RNText 
      style={finalStyle} 
      allowFontScaling={false} // Prevent font scaling issues
      {...props}
    >
      {children}
    </RNText>
  );
};