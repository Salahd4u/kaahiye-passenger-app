import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { useTheme, type ThemeColors, type ThemeShadows } from '@/theme';

const HANDLE = 54;
const THRESHOLD = 0.9;

type SlideToConfirmProps = {
  label: string;
  onComplete: () => void;
  /** Shorter track/handle for compact screens. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Premium drag-to-confirm control (Android unlock style).
 *
 * The handle is moved with Gesture Handler and animated with Reanimated on the
 * UI thread. Releasing below 90% springs back; at/above 90% the callback fires
 * (the caller adds haptics and opens its confirmation sheet).
 */
/* Reanimated shared values are mutated by design (UI-thread writes). */
/* eslint-disable react-hooks/immutability */
export function SlideToConfirm({ label, onComplete, compact = false, style }: SlideToConfirmProps) {
  const { colors, shadows, reducedMotion } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const [trackWidth, setTrackWidth] = useState(0);
  const translateX = useSharedValue(0);
  const handleSize = compact ? 44 : HANDLE;
  const maxX = Math.max(0, trackWidth - handleSize - 8);

  const complete = useCallback(() => {
    translateX.value = withTiming(0, { duration: reducedMotion ? 0 : 220 });
    onComplete();
  }, [onComplete, reducedMotion, translateX]);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-6, 6])
        .onUpdate((event) => {
          translateX.value = Math.min(Math.max(0, event.translationX), maxX);
        })
        .onEnd(() => {
          const passed = maxX > 0 && translateX.value >= maxX * THRESHOLD;
          const spring = { damping: 20, stiffness: 220, mass: 0.6 };
          if (passed) {
            translateX.value = withSpring(maxX, spring, (finished) => {
              if (finished) runOnJS(complete)();
            });
          } else {
            translateX.value = reducedMotion ? 0 : withSpring(0, spring);
          }
        }),
    [complete, maxX, reducedMotion, translateX],
  );

  const handleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: translateX.value + (compact ? 44 : HANDLE) + 8,
  }));
  /* eslint-enable react-hooks/immutability */

  return (
    <View
      style={[styles.track, compact && styles.trackCompact, style]}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
    >
      <Reanimated.View style={[styles.fill, fillStyle]} pointerEvents="none" />

      <AppText
        variant="button"
        weight="semibold"
        color={colors.red}
        style={[styles.label, compact && styles.labelCompact]}
      >
        {label}
      </AppText>

      <GestureDetector gesture={gesture}>
        <Reanimated.View
          style={[
            styles.handle,
            compact && { width: handleSize, height: handleSize, borderRadius: handleSize / 2 },
            handleStyle,
          ]}
          accessibilityRole="adjustable"
          accessibilityLabel={`${label}. Drag to the right to confirm`}
        >
          <Icon name="chevrons-right" size={compact ? 17 : 20} color={colors.white} strokeWidth={2.6} />
        </Reanimated.View>
      </GestureDetector>
    </View>
  );
}

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    track: {
      height: 62,
      borderRadius: 31,
      backgroundColor: colors.redSoft,
      justifyContent: 'center',
      padding: 4,
      ...shadows.card,
    },
    fill: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      backgroundColor: colors.red,
      opacity: 0.14,
      borderRadius: 31,
    },
    trackCompact: {
      height: 52,
    },
    label: {
      alignSelf: 'center',
      fontSize: 16.5,
    },
    labelCompact: {
      fontSize: 14.5,
    },
    handle: {
      position: 'absolute',
      left: 4,
      top: 4,
      width: HANDLE,
      height: HANDLE,
      borderRadius: HANDLE / 2,
      backgroundColor: colors.red,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.floating,
    },
  });

export default SlideToConfirm;
