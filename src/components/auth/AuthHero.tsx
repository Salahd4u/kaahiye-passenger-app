import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { AppText } from '@/components/ui/AppText';
import { KaahiyeLogo } from '@/components/brand/KaahiyeLogo';
import { SedanArtwork } from '@/components/illustrations/Sedan';
import { MotorbikeArtwork } from '@/components/illustrations/VehicleArt';
import { useTheme, type ThemeColors } from '@/theme';

/**
 * Mint hero artwork for the auth screens: soft skyline, white sedan and a
 * motorbike connected by a dotted route.
 */
export function AuthHeroArt({ height = 150 }: { height?: number }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const art = isDark
    ? {
        skyTop: '#0F231E',
        skyBottom: '#0B1018',
        buildings: ['#1A3D33', '#173A30', '#1E4638', '#14352C', '#1A3D33', '#123128', '#1E4638', '#173A30', '#1A3D33'],
        route: '#2F6E5C',
        ground: '#0E1D19',
      }
    : {
        skyTop: '#DFF5EC',
        skyBottom: '#F7FDFA',
        buildings: ['#B7E2D3', '#A6DAC8', '#C4E8DC', '#9AD4C0', '#B7E2D3', '#8FCFB9', '#C4E8DC', '#A6DAC8', '#B7E2D3'],
        route: '#7FCDB6',
        ground: '#EAF7F1',
      };
  return (
    <View style={[styles.hero, { height }]}>
      <Svg width="100%" height="100%" viewBox="0 0 390 150" preserveAspectRatio="xMidYMax slice">
        <Defs>
          <LinearGradient id="auth-hero-sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={art.skyTop} />
            <Stop offset="1" stopColor={art.skyBottom} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="390" height="150" fill="url(#auth-hero-sky)" />

        {/* Skyline */}
        <G opacity={0.85}>
          <Rect x="18" y="72" width="30" height="66" rx="3" fill={art.buildings[0]} />
          <Rect x="54" y="52" width="38" height="86" rx="3" fill={art.buildings[1]} />
          <Rect x="98" y="84" width="26" height="54" rx="3" fill={art.buildings[2]} />
          <Rect x="130" y="40" width="42" height="98" rx="3" fill={art.buildings[3]} />
          <Rect x="178" y="66" width="30" height="72" rx="3" fill={art.buildings[4]} />
          <Rect x="214" y="30" width="46" height="108" rx="3" fill={art.buildings[5]} />
          <Rect x="266" y="74" width="28" height="64" rx="3" fill={art.buildings[6]} />
          <Rect x="300" y="50" width="38" height="88" rx="3" fill={art.buildings[7]} />
          <Rect x="344" y="82" width="30" height="56" rx="3" fill={art.buildings[8]} />
        </G>

        {/* Dotted route */}
        <Path
          d="M20 132 C90 118 130 140 190 122 C250 104 300 128 372 112"
          stroke={art.route}
          strokeWidth={2}
          strokeDasharray="5 6"
          fill="none"
          strokeLinecap="round"
        />

        {/* Ground */}
        <Rect x="0" y="128" width="390" height="22" fill={art.ground} />

        {/* Vehicles */}
        <G transform="translate(38, 78) scale(0.42)">
          <SedanArtwork variant="white" />
        </G>
        <G transform="translate(268, 96) scale(0.62)">
          <MotorbikeArtwork />
        </G>
      </Svg>
    </View>
  );
}

/** Subtle mint skyline + dotted route used at the bottom of auth screens. */
export function AuthFooterArt({ height = 64 }: { height?: number }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const art = isDark
    ? {
        sky: '#0B1018',
        buildings: ['#17352C', '#15312A', '#1A3B31', '#122B25', '#17352C', '#102520', '#1A3B31', '#15312A', '#17352C', '#122B25'],
        route: '#2A6353',
      }
    : {
        sky: '#F7FDFA',
        buildings: ['#CDEADF', '#BFE4D7', '#D6EEE5', '#B4DFD0', '#CDEADF', '#A9D9C8', '#D6EEE5', '#BFE4D7', '#CDEADF', '#B4DFD0'],
        route: '#8FD3BE',
      };
  return (
    <View style={[styles.hero, { height }]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 390 64" preserveAspectRatio="xMidYMax slice">
        <Rect x="0" y="0" width="390" height="64" fill={art.sky} />
        <G opacity={0.55}>
          <Rect x="6" y="30" width="26" height="34" rx="3" fill={art.buildings[0]} />
          <Rect x="38" y="18" width="34" height="46" rx="3" fill={art.buildings[0]} />
          <Rect x="78" y="36" width="22" height="28" rx="3" fill={art.buildings[0]} />
          <Rect x="106" y="10" width="38" height="54" rx="3" fill={art.buildings[0]} />
          <Rect x="150" y="28" width="26" height="36" rx="3" fill={art.buildings[0]} />
          <Rect x="182" y="4" width="42" height="60" rx="3" fill={art.buildings[0]} />
          <Rect x="230" y="32" width="24" height="32" rx="3" fill={art.buildings[0]} />
          <Rect x="260" y="16" width="36" height="48" rx="3" fill={art.buildings[0]} />
          <Rect x="302" y="38" width="24" height="26" rx="3" fill={art.buildings[0]} />
          <Rect x="332" y="12" width="40" height="52" rx="3" fill={art.buildings[0]} />
        </G>
        <Path
          d="M0 52 C80 40 150 60 230 48 C300 38 350 54 390 46"
          stroke={art.route}
          strokeWidth={1.6}
          strokeDasharray="4 5"
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

/** Logo + wordmark + tagline block shared by Sign In / Sign Up. */
export function AuthBrandHeader() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.brand}>
      <KaahiyeLogo size={46} />
      <AppText variant="h3" align="center" style={styles.wordmark}>
        Kaahiye
      </AppText>
      <AppText variant="caption" color={colors.textSecondary} align="center">
        Rides for a Better Tomorrow
      </AppText>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  hero: {
    width: '100%',
    overflow: 'hidden',
  },
  brand: {
    alignItems: 'center',
    gap: 1,
    paddingBottom: 4,
  },
  wordmark: {
    marginTop: 4,
    letterSpacing: -0.6,
  },
  });

export default AuthHeroArt;
