import React, { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  elevated?: boolean;
  variant?: 'default' | 'outlined' | 'flat' | 'soft';
  radius?: number;
};

export function Card({
  children,
  style,
  padding = 18,
  elevated = true,
  variant = 'default',
  radius = 18,
}: CardProps) {
  const { colors, shadows } = useTheme();

  return (
    <View
      style={[
        styles.base,
        { padding, borderRadius: radius },
        { backgroundColor: colors.card },
        variant === 'default' && elevated && shadows.card,
        variant === 'outlined' && { ...styles.outlined, borderColor: colors.border, backgroundColor: colors.surface },
        variant === 'soft' && { backgroundColor: colors.surfaceMuted },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {},
  outlined: {
    borderWidth: 1,
  },
});

export default Card;
