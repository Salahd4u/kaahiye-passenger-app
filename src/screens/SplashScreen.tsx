import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppText } from '@/components/ui/AppText';
import { GradientFill } from '@/components/ui/GradientFill';
import { KaahiyeLogo } from '@/components/brand/KaahiyeLogo';
import { KaahiyeScene } from '@/components/illustrations/KaahiyeScene';
import { layout, useTheme, type ThemeColors } from '@/theme';

export default function SplashScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { height } = useWindowDimensions();

  useEffect(() => {
    const timer = setTimeout(() => router.replace('/onboarding'), 2100);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="dark" />
      <GradientFill from="#EDF6FD" to="#FFFFFF" direction="vertical" />
      <View style={styles.brandBlock}>
        <Pressable
          onPress={() => router.replace('/onboarding')}
          onLongPress={() => router.push('/dev-panel')}
          accessibilityRole="button"
          accessibilityLabel="Kaahiye. Continue to onboarding"
          style={styles.logoPress}
        >
          <KaahiyeLogo size={96} />
        </Pressable>
        <AppText variant="display" align="center" style={styles.wordmark}>
          Kaahiye
        </AppText>
        <AppText
          variant="bodySmall"
          color={colors.textSecondary}
          align="center"
          style={styles.tagline}
        >
          Your Ride, Anywhere
        </AppText>
      </View>

      <View style={[styles.scene, { height: Math.min(400, height * 0.5) }]}>
        <KaahiyeScene variant="splash" />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  brandBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 16,
  },
  logoPress: {
    marginBottom: 14,
  },
  wordmark: {
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -1.8,
  },
  tagline: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textSecondary,
    letterSpacing: 0.1,
  },
  scene: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  });
