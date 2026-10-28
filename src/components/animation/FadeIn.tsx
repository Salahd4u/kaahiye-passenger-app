import React, { useEffect, useState } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

type FadeInProps = {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  /** Vertical travel in points (0 for a pure fade). */
  offset?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Gentle mount animation used by screens, sheets and cards.
 * Fully skipped when the OS requests reduced motion.
 */
export function FadeIn({
  children,
  delay = 0,
  duration = 260,
  offset = 10,
  style,
}: FadeInProps) {
  const { reducedMotion } = useTheme();
  const [progress] = useState(() => new Animated.Value(reducedMotion ? 1 : 0));

  useEffect(() => {
    if (reducedMotion) {
      progress.setValue(1);
      return undefined;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [delay, duration, progress, reducedMotion]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] });

  return (
    <Animated.View style={[style, { opacity: progress, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

export default FadeIn;
