import React, { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';

type ThemeToggleProps = {
  value: boolean;
  onChange: (next: boolean) => void;
  accessibilityLabel?: string;
};

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 31;
const KNOB = 25;

/**
 * Animated ON/OFF switch used by Settings → Appearance.
 *
 * The knob slides with a gentle spring and the track cross-fades between the
 * palette surfaces. When Reduce Motion is on the state change is instant.
 */
export function ThemeToggle({
  value,
  onChange,
  accessibilityLabel = 'Dark mode',
}: ThemeToggleProps) {
  const { colors, reducedMotion, shadows } = useTheme();
  const [progress] = useState(() => new Animated.Value(value ? 1 : 0));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: reducedMotion ? 0 : 240,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  }, [progress, reducedMotion, value]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [3, TRACK_WIDTH - KNOB - 3],
  });
  const trackColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.surfaceMuted, colors.primary],
  });

  return (
    <Pressable
      onPress={() => onChange(!value)}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View
          style={[
            styles.knob,
            shadows.floating,
            { backgroundColor: colors.white, transform: [{ translateX }] },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.9,
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    justifyContent: 'center',
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
  },
});

export default ThemeToggle;
