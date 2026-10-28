import React, { useEffect, useState, useMemo } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppText } from '@/components/ui/AppText';
import { CTAButton } from '@/components/ui/CTAButton';
import { Icon } from '@/components/ui/Icon';
import { layout, useTheme, type ThemeColors } from '@/theme';
import { CTA_BOTTOM_GAP } from '@/components/ui/ctaStyle';

export default function LocationPermissionScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 2600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const proceed = (delay = 0) => {
    if (delay > 0) setLoading(true);
    setTimeout(() => router.replace('/select-location'), delay);
  };

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.22] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        <View style={styles.visual}>
          <View style={styles.outerCircle}>
            <View style={styles.middleCircle}>
              <View style={styles.innerCircle}>
                <Icon
                  name="navigation"
                  size={46}
                  color={colors.primary}
                  style={styles.navIcon}
                />
              </View>
            </View>
          </View>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pulseRing,
              { opacity: ringOpacity, transform: [{ scale: ringScale }] },
            ]}
          />
        </View>

        <AppText variant="h2" align="center" style={styles.title}>
          Allow Location Access
        </AppText>
        <AppText
          variant="body"
          color={colors.textSecondary}
          align="center"
          style={styles.body}
        >
          We need your location to find nearby drivers and give you accurate fares.
        </AppText>
      </View>

      <View style={styles.footer}>
        <CTAButton
          title="Allow Location"
          onPress={() => proceed(550)}
          loading={loading}
          disabled={loading}
          accessibilityLabel="Allow location access"
        />
        <Pressable
          onPress={() => proceed(0)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Not now"
          style={styles.notNow}
        >
          <AppText variant="bodySmall" color={colors.textMuted} weight="medium">
            Not Now
          </AppText>
        </Pressable>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 32,
    paddingTop: 190,
    paddingBottom: 16,
  },
  visual: {
    width: 254,
    height: 254,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 42,
  },
  outerCircle: {
    width: 252,
    height: 252,
    borderRadius: 126,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middleCircle: {
    width: 198,
    height: 198,
    borderRadius: 99,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,168,132,0.08)',
  },
  innerCircle: {
    width: 122,
    height: 122,
    borderRadius: 61,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    marginLeft: 3,
    marginTop: -1,
  },
  pulseRing: {
    position: 'absolute',
    width: 252,
    height: 252,
    borderRadius: 126,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  title: {
    marginBottom: 12,
  },
  body: {
    maxWidth: 230,
    lineHeight: 21,
  },
  footer: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: CTA_BOTTOM_GAP,
    paddingTop: 10,
    gap: 8,
  },
  notNow: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  });
