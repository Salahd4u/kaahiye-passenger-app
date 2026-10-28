import React, { useState, useMemo } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppText } from '@/components/ui/AppText';
import { CTAButton } from '@/components/ui/CTAButton';
import { KaahiyeScene } from '@/components/illustrations/KaahiyeScene';
import { layout, useTheme, type ThemeColors } from '@/theme';
import { CTA_BOTTOM_GAP } from '@/components/ui/ctaStyle';

const SLIDES = [
  {
    title: 'Ride Anywhere\nWith Kaahiye',
    body: 'Safe, simple, and reliable rides in your city.',
  },
  {
    title: 'Your Ride,\nOn Your Schedule',
    body: 'Book in seconds and follow your driver live on the map.',
  },
  {
    title: 'Upfront Fares,\nNo Surprises',
    body: 'See exactly what you will pay before you confirm your ride.',
  },
  {
    title: 'Safe Rides,\nEvery Time',
    body: 'Verified drivers and support whenever you need it.',
  },
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { height } = useWindowDimensions();
  const [index, setIndex] = useState(0);

  const goToAuth = () => router.push('/sign-up');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.topBar}>
        <Pressable
          onPress={goToAuth}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
        >
          <AppText variant="body" color={colors.textSecondary} weight="medium">
            Skip
          </AppText>
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={[styles.scene, { height: Math.min(300, height * 0.34) }]}>
          <KaahiyeScene variant="onboarding" />
        </View>

        <View style={styles.copy}>
          <AppText variant="h1" align="center" style={styles.title}>
            {SLIDES[index].title}
          </AppText>
          <AppText
            variant="body"
            color={colors.textSecondary}
            align="center"
            style={styles.body}
          >
            {SLIDES[index].body}
          </AppText>
        </View>

        <View style={styles.spacer} />

        <View style={styles.dots} accessibilityRole="tablist">
          {SLIDES.map((slide, dotIndex) => {
            const active = dotIndex === index;
            return (
              <Pressable
                key={slide.title}
                onPress={() => setIndex(dotIndex)}
                hitSlop={10}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Slide ${dotIndex + 1}`}
              >
                <View style={[styles.dot, active && styles.dotActive]} />
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <CTAButton title="Get Started" onPress={goToAuth} accessibilityLabel="Get Started" />
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 4,
    height: 40,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: layout.screenPadding,
    paddingTop: 2,
  },
  scene: {
    width: '100%',
    justifyContent: 'center',
    marginBottom: 2,
  },
  copy: {
    paddingHorizontal: 12,
    marginTop: 24,
  },
  title: {
    fontSize: 26,
    lineHeight: 33,
  },
  body: {
    marginTop: 66,
    maxWidth: 282,
    alignSelf: 'center',
    color: colors.textSecondary,
    lineHeight: 21,
  },
  spacer: {
    flex: 1,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  footer: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: CTA_BOTTOM_GAP,
    paddingTop: 8,
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
  },
  });
