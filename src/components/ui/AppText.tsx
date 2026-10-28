import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { fonts, textStyles, useTheme, type FontWeight, type TextStyleKey } from '@/theme';

type AppTextProps = TextProps & {
  /** Typography preset from the design system. */
  variant?: TextStyleKey;
  /** Optional weight override (maps to the bundled Inter family). */
  weight?: FontWeight;
  /** Text colour, defaults to the ink colour. */
  color?: string;
  align?: TextStyle['textAlign'];
  /** Convenience for single-line titles inside constrained cards. */
  numberOfLines?: number;
};

/**
 * The app's only text primitive. Using explicit Inter font families keeps
 * weights consistent on iOS and Android and avoids the system font fallback.
 */
export function AppText({
  variant = 'body',
  weight,
  color,
  align,
  style,
  children,
  maxFontSizeMultiplier = 1.2,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();

  return (
    <Text
      {...rest}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[
        textStyles[variant],
        weight ? { fontFamily: fonts[weight] } : null,
        { color: color ?? colors.textPrimary },
        align ? { textAlign: align } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export default AppText;
