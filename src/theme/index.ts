import { colors } from './colors';
import { fonts, fontSize, shadows, textStyles } from './typography';
import type { FontWeight, TextStyleKey } from './typography';

export { colors, fonts, fontSize, shadows, textStyles };
export type { FontWeight, TextStyleKey };

export { lightPalette, type ThemeColors, type ThemeMode } from './palettes';
export { darkPalette } from './dark';
export { createShadows, type ThemeShadows } from './typography';
export { ThemeProvider, useTheme, useThemeColors, useReducedMotion } from './theme';


export const radius = {
  xs: 8,
  sm: 10,
  md: 12,
  lg: 14,
  xl: 16,
  xxl: 18,
  sheet: 26,
  pill: 999,
} as const;

export const spacing = {
  xxs: 4,
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const layout = {
  /** Single horizontal gutter used by every screen, panel and CTA. */
  screenPadding: 20,
  /** Distance from the screen edge for full-width primary buttons. */
  ctaInset: 20,
  contentMaxWidth: 520,
  buttonHeight: 56,
  inputHeight: 56,
} as const;

/**
 * Bumped whenever the CTA/button layout changes. It is printed in the Dev Panel
 * so you can verify which bundle a device is actually running.
 */
export const UI_BUILD = 'cta-box-v12';

export const theme = {
  colors,
  fonts,
  fontSize,
  textStyles,
  shadows,
  radius,
  spacing,
  layout,
} as const;

export type Theme = typeof theme;
export default theme;
