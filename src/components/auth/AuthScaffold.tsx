import React, { type ReactNode, useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppText } from '@/components/ui/AppText';
import { GradientFill } from '@/components/ui/GradientFill';
import { AuthBrandHeader, AuthFooterArt, AuthHeroArt } from './AuthHero';
import { layout, useTheme, type ThemeColors, type ThemeShadows } from '@/theme';

type AuthScaffoldProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

/**
 * Shared premium auth layout: mint gradient header, brand + city hero art,
 * centered heading, white rounded form card and a mint skyline footer.
 *
 * The hero shrinks on short screens and the footer illustration is absolutely
 * positioned so the bottom link is always reachable without hunting for it.
 */
export function AuthScaffold({ title, subtitle, children, footer }: AuthScaffoldProps) {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const { height } = useWindowDimensions();
  // Short phones (iPhone SE class) get a tighter hero so the bottom link stays reachable.
  const short = height < 720;
  const heroHeight = short ? 74 : Math.round(Math.max(84, Math.min(124, height * 0.145)));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="dark" />
      <GradientFill from={colors.primaryLight} to={colors.background} direction="vertical" style={styles.gradient} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 6 : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, short && styles.scrollContentShort]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentMax}>
            <AuthBrandHeader />
            <AuthHeroArt height={heroHeight} />

            <View style={[styles.heading, short && styles.headingShort]}>
              <AppText variant="h2" align="center">
                {title}
              </AppText>
              <AppText
                variant="body"
                color={colors.textSecondary}
                align="center"
                style={styles.subtitle}
              >
                {subtitle}
              </AppText>
            </View>

            <View style={styles.card}>
              <View style={styles.cardInner}>{children}</View>
            </View>

            <View style={styles.spacer} />
            {footer}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footerArt} pointerEvents="none">
        <AuthFooterArt height={56} />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  flex: {
    flex: 1,
  },
  gradient: {
    height: 340,
    top: 0,
    left: 0,
    right: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 68,
  },
  scrollContentShort: {
    paddingBottom: 56,
  },
  contentMax: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    flexGrow: 1,
  },
  heading: {
    marginTop: 10,
    marginBottom: 12,
    paddingHorizontal: layout.screenPadding,
  },
  headingShort: {
    marginTop: 6,
    marginBottom: 8,
  },
  subtitle: {
    marginTop: 4,
  },
  card: {
    // Full-width card. Content sits at a 20pt inset from the screen edge
    // (1pt border + 19pt padding), so the fields and the CTA buttons inside
    // are the exact same width as the CTAs on every other screen.
    marginHorizontal: 0,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: 0,
    paddingTop: 14,
    paddingBottom: 12,
    ...shadows.card,
  },
  cardInner: {
    // 19pt + the card's 1pt border = the shared 20pt gutter used app-wide.
    paddingHorizontal: layout.ctaInset - 1,
  },
  spacer: {
    flex: 1,
    minHeight: 8,
  },
  footerArt: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  });

export default AuthScaffold;
