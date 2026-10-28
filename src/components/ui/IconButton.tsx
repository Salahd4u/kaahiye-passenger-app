import React, { useMemo, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Icon, type IconName } from './Icon';
import { useTheme, type ThemeColors, type ThemeShadows } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type IconButtonVariant = 'white' | 'muted' | 'primary' | 'ghost';

type IconButtonProps = {
  icon: IconName;
  onPress?: () => void;
  accessibilityLabel: string;
  variant?: IconButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  iconColor?: string;
  iconSize?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const BASE_SIZES = { sm: 36, md: 44, lg: 48 } as const;

/**
 * Shared circular icon button. Keeps every floating/round control the same
 * size and touch feedback across the app, and scales down on short screens.
 */
export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  variant = 'white',
  size = 'md',
  iconColor,
  iconSize,
  disabled = false,
  style,
}: IconButtonProps) {
  const { colors, shadows, reducedMotion } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const [pressScale] = useState(() => new Animated.Value(1));
  const [pressOpacity] = useState(() => new Animated.Value(1));

  const animatePress = (pressed: boolean) => {
    if (reducedMotion) return;
    Animated.spring(pressScale, {
      toValue: pressed ? 0.94 : 1,
      speed: 34,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
    Animated.timing(pressOpacity, {
      toValue: pressed ? 0.9 : 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };
  const { height: screenHeight } = useWindowDimensions();
  const diameter = Math.round(
    Math.min(BASE_SIZES[size], Math.max(size === 'sm' ? 34 : 40, screenHeight * 0.055)),
  );
  const resolvedIconColor =
    iconColor ??
    (variant === 'primary'
      ? colors.white
      : variant === 'ghost'
        ? colors.navy
        : colors.navy);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => animatePress(true)}
      onPressOut={() => animatePress(false)}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={[
        styles.base,
        { transform: [{ scale: pressScale }], opacity: pressOpacity },
        {
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
        },
        variant === 'white' && styles.white,
        variant === 'muted' && styles.muted,
        variant === 'primary' && styles.primary,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Icon
        name={icon}
        size={iconSize ?? Math.round(diameter * 0.45)}
        color={resolvedIconColor}
        strokeWidth={1.8}
      />
    </AnimatedPressable>
  );
}

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  white: {
    backgroundColor: colors.floating,
    ...shadows.floating,
  },
  muted: {
    backgroundColor: colors.surfaceMuted,
  },
  primary: {
    backgroundColor: colors.primary,
    ...shadows.button,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  });

export default IconButton;
