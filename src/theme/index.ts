import { colors, type ColorScheme } from './colors';
import { typography, textStyles, type Typography, type TextStyles } from './typography';
import { spacing, layout, type Spacing, type Layout } from './spacing';

export const theme = {
  colors,
  typography,
  textStyles,
  spacing,
  layout,
} as const;

// Theme types
export type Theme = {
  colors: ColorScheme;
  typography: Typography;
  textStyles: TextStyles;
  spacing: Spacing;
  layout: Layout;
};

// Responsive breakpoints (for tablet support)
export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
};

// Component variants
export const variants = {
  button: {
    primary: {
      backgroundColor: colors.button.primary,
      borderColor: colors.button.primary,
    },
    secondary: {
      backgroundColor: colors.button.secondary,
      borderColor: colors.button.secondary,
    },
    ghost: {
      backgroundColor: colors.button.ghost,
      borderColor: colors.border.primary,
    },
    outline: {
      backgroundColor: colors.transparent,
      borderColor: colors.border.accent,
    },
  },
  card: {
    default: {
      backgroundColor: colors.background.card,
      borderColor: colors.border.primary,
      borderRadius: layout.borderRadius.lg,
      padding: layout.cardPadding,
    },
    elevated: {
      backgroundColor: colors.background.elevated,
      borderColor: colors.border.secondary,
      borderRadius: layout.borderRadius.lg,
      padding: layout.cardPadding,
    },
  },
  input: {
    default: {
      backgroundColor: colors.input.background,
      borderColor: colors.input.border,
      borderRadius: layout.borderRadius.md,
      height: layout.inputHeight,
      paddingHorizontal: layout.inputPadding,
    },
  },
} as const;

export { colors, typography, textStyles, spacing, layout };
export type { ColorScheme, Typography, TextStyles, Spacing, Layout };