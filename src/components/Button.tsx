import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { AppText } from './ui/AppText';
import { Icon, type IconName } from './ui/Icon';
import { GradientFill } from './ui/GradientFill';
import { CTA_HEIGHT, CTA_HORIZONTAL_PADDING, CTA_RADIUS, CTA_STYLE, CTA_TEXT_SIZE } from './ui/ctaStyle';
import { useTheme, type ThemeColors, type ThemeShadows } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

if (__DEV__ && (CTA_STYLE.marginHorizontal ?? 0) !== 0) {
  console.warn(
    '[KaahiyeCTA] CTA_STYLE.marginHorizontal must be 0 — a CTA with a horizontal margin is wider than its parent and clips.',
  );
}

export type ButtonVariant =
  | 'primary'
  | 'forest'
  | 'secondary'
  | 'outline'
  | 'danger'
  | 'ghost';

export type ButtonProps = {
  title: string;
  /** Optional second line (used by the two-line confirm button). */
  subtitle?: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
};

export function Button({
  title,
  subtitle,
  onPress,
  variant = 'primary',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
  accessibilityLabel,
  testID,
}: ButtonProps) {
  const { colors, shadows, reducedMotion } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const [pressScale] = useState(() => new Animated.Value(1));
  const [pressOpacity] = useState(() => new Animated.Value(1));

  const animatePress = (pressed: boolean) => {
    if (reducedMotion) return;
    Animated.spring(pressScale, {
      toValue: pressed ? 0.97 : 1,
      speed: 32,
      bounciness: 5,
      useNativeDriver: true,
    }).start();
    Animated.timing(pressOpacity, {
      toValue: pressed ? 0.92 : 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };
  const { width: screenWidth } = useWindowDimensions();
  const isDisabled = disabled || loading;
  const isGradient = variant === 'primary' || variant === 'forest';
  // One height and one label size for every button in the app — the CTA box can
  // never drift, because there is no second scale to drift to. The width stays
  // fluid via CTA_STYLE (`width: '100%'` of the parent).
  const buttonHeight = CTA_HEIGHT;
  const textSize = CTA_TEXT_SIZE;
  const textColor =
    variant === 'primary' || variant === 'forest' || variant === 'danger'
      ? colors.white
      : variant === 'ghost'
        ? colors.primary
        : colors.navy;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => animatePress(true)}
      onPressOut={() => animatePress(false)}
      disabled={isDisabled}
      testID={testID}
      hitSlop={4}
      android_ripple={
        variant === 'primary' || variant === 'forest' || variant === 'danger'
          ? { color: 'rgba(255,255,255,0.18)', borderless: false }
          : undefined
      }
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onLayout={(event) => {
        if (!__DEV__) return;
        // Dev-only width probe: every CTA on every screen should print the same
        // `width` for a given device width (screen − 40), proving they are
        // consistent and responsive.
        const width = Math.round(event.nativeEvent.layout.width);
        console.log(
          `[KaahiyeCTA] "${accessibilityLabel ?? title}" width=${width} screen=${screenWidth}`,
        );
      }}
      style={[
        styles.base,
        { transform: [{ scale: pressScale }], opacity: pressOpacity },
        { height: buttonHeight },
        variant === 'primary' && shadows.button,
        variant === 'forest' && shadows.button,
        variant === 'primary' && styles.transparent,
        variant === 'forest' && styles.transparent,
        variant === 'secondary' && styles.secondary,
        variant === 'outline' && styles.outline,
        variant === 'danger' && styles.danger,
        variant === 'ghost' && styles.ghost,
        isDisabled && styles.disabled,
        style,
        // Shared CTA geometry last: width (100% of the parent), horizontal
        // margins and corner radius can never be overridden per screen, so every
        // green button across the app is exactly the same size. Screens may still
        // add vertical spacing (marginTop / marginBottom).
        CTA_STYLE,
        // Defence in depth: whatever the shared style holds, a CTA never carries
        // a horizontal margin. `width: '100%'` plus a horizontal margin makes the
        // button wider than its parent, so it clips at the card/screen edge —
        // exactly the broken "full-bleed" look we must never render again.
        styles.ctaEnforce,
      ]}
    >
      {isGradient ? (
        <GradientFill
          from={
            variant === 'forest'
              ? colors.forestGradientFrom
              : colors.primaryGradientFrom
          }
          to={variant === 'forest' ? colors.forestGradientTo : colors.primaryGradientTo}
          radius={CTA_RADIUS}
        />
      ) : null}

      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' ? (
            <Icon name={icon} size={18} color={textColor} style={styles.iconLeft} />
          ) : null}
          <View style={subtitle ? styles.textColumn : undefined}>
            <AppText
              variant="button"
              color={textColor}
              style={{ fontSize: textSize }}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              maxFontSizeMultiplier={1.2}
            >
              {title}
            </AppText>
            {subtitle ? (
              <AppText
                variant="caption"
                color="rgba(255,255,255,0.88)"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.9}
                maxFontSizeMultiplier={1.1}
                style={styles.subtitle}
              >
                {subtitle}
              </AppText>
            ) : null}
          </View>
          {icon && iconPosition === 'right' ? (
            <Icon name={icon} size={18} color={textColor} style={styles.iconRight} />
          ) : null}
        </View>
      )}
    </AnimatedPressable>
  );
}

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
  base: {
    // THE BOX — width, height and corner radius only. Deliberately NO padding and
    // NO margins on the button itself: horizontal padding lives on the inner
    // content row (`styles.content`), so the painted box is always exactly the
    // full width of the parent's content area and can never be widened or
    // narrowed by padding.
    width: '100%',
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  ctaEnforce: {
    // Last style in the array: a CTA can never acquire a horizontal margin, no
    // matter what the shared style or a screen passes in.
    marginHorizontal: 0,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  secondary: {
    backgroundColor: colors.surfaceMuted,
  },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: colors.coral,
  },
  ghost: {
    backgroundColor: 'transparent',
    marginHorizontal: 10,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.992 }],
  },
  content: {
    // Label/icon row. All horizontal padding for a CTA lives here, never on the
    // button box, so the box geometry stays identical for every variant.
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: CTA_HORIZONTAL_PADDING,
  },
  textColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: 1,
    fontSize: 12,
    lineHeight: 15,
  },
  iconLeft: { marginRight: 9 },
  iconRight: { marginLeft: 9 },
  });

export default Button;
