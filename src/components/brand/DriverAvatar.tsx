import React, { useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import { useTheme, type ThemeColors } from '@/theme';

type AvatarProps = {
  size?: number;
  /** Outer ring colour (set to transparent to remove). */
  ringColor?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Locally rendered, bundled portrait of the demo driver.
 * No network images are used anywhere in the app.
 */
export function DriverAvatar({ size = 56, ringColor, style }: AvatarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const ring = ringColor ?? colors.white;
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: ring,
          borderWidth: ring === 'transparent' ? 0 : Math.max(2, size * 0.035),
        },
        style,
      ]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="avatar-bg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#F4ECE2" />
            <Stop offset="1" stopColor="#E5D5C3" />
          </LinearGradient>
        </Defs>
        <Rect width="100" height="100" fill="url(#avatar-bg)" />

        {/* Shoulders / shirt */}
        <Path d="M6 100c2.5-21 18-32 44-32s41.5 11 44 32z" fill="#2F3B48" />
        <Path d="M39 70l11 12 11-12 7 4-18 20-18-20z" fill="#3C4A59" />
        <Path d="M44 72l6 7 6-7 4 2-10 11-10-11z" fill="#F3F4F6" />

        {/* Neck */}
        <Rect x="41.5" y="55" width="17" height="19" rx="7" fill="#805035" />
        <Ellipse cx="50" cy="64" rx="8.5" ry="5" fill="#73452D" opacity="0.35" />

        {/* Ears */}
        <Ellipse cx="28.5" cy="46" rx="4.4" ry="5.6" fill="#8F5B3C" />
        <Ellipse cx="71.5" cy="46" rx="4.4" ry="5.6" fill="#8F5B3C" />

        {/* Face */}
        <Ellipse cx="50" cy="45" rx="21.4" ry="23.6" fill="#9C6747" />
        <Ellipse cx="42" cy="52" rx="7" ry="5" fill="#A87351" opacity="0.55" />
        <Ellipse cx="58" cy="52" rx="7" ry="5" fill="#A87351" opacity="0.55" />

        {/* Hair */}
        <Path
          d="M27.8 44.5c-1.7-15.8 8.3-27.6 22.2-27.6 14 0 24 11.8 22.2 27.6-2.2-7.4-6.8-11.8-12-13.8-6.2 3.3-16.1 4-23.6 1.2-4.1 2.4-7.4 6.4-8.8 12.6z"
          fill="#241A14"
        />
        <Path
          d="M29 39c2-8 9-12 15-12 3 0 5 .5 8 .5 5 0 9 1.5 12 6.5-4-2-8-2.5-14-2.5-8 0-15 1.5-21 7.5z"
          fill="#33241B"
          opacity="0.55"
        />

        {/* Beard */}
        <Path
          d="M29.8 44.5c-.3 15.4 7.8 27.8 20.2 27.8s20.5-12.4 20.2-27.8c-1.8 12-9.3 16.4-20.2 16.4s-18.4-4.4-20.2-16.4z"
          fill="#2C1E16"
        />
        <Path
          d="M34 47c2.5 9.5 8.5 14 16 14s13.5-4.5 16-14c-2.5 5.5-8.5 8.5-16 8.5S36.5 52.5 34 47z"
          fill="#3A281D"
        />

        {/* Eyes, brows */}
        <Path d="M36.5 43.2c2-1.8 5-1.9 7.2-.3" stroke="#2A1C13" strokeWidth="1.9" fill="none" strokeLinecap="round" />
        <Path d="M56.3 42.9c2.2-1.6 5.2-1.5 7.2.3" stroke="#2A1C13" strokeWidth="1.9" fill="none" strokeLinecap="round" />
        <Ellipse cx="42" cy="47.5" rx="2.5" ry="2.2" fill="#1D1713" />
        <Ellipse cx="58" cy="47.5" rx="2.5" ry="2.2" fill="#1D1713" />
        <Circle cx="42.8" cy="46.8" r="0.75" fill="#FFFFFF" />
        <Circle cx="58.8" cy="46.8" r="0.75" fill="#FFFFFF" />

        {/* Nose */}
        <Path d="M50 47.5v6.2c0 1.3-1 2.2-2.3 2.4" stroke="#77482F" strokeWidth="1.7" fill="none" strokeLinecap="round" />

        {/* Smile */}
        <Path d="M41 59.2c2.7 4.9 5.7 7.1 9 7.1s6.3-2.2 9-7.1z" fill="#3B2418" />
        <Path d="M43.2 60.1h13.6c-1.7 2.7-4 4-6.8 4s-5.1-1.3-6.8-4z" fill="#FFFFFF" opacity="0.95" />
        <Path d="M42.5 58.4c5 1.2 10 1.2 15 0" stroke="#4A2C1D" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  });

export default DriverAvatar;
