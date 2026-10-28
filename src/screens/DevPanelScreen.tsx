import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppText } from '@/components/ui/AppText';
import { AppHeader } from '@/components/ui/AppHeader';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Screen } from '@/components/Screen';
import { UI_BUILD, useTheme, type ThemeColors } from '@/theme';

const PREVIEWS: { title: string; route: string; icon: IconName; hint: string }[] = [
  { title: '1 · Splash', route: '/', icon: 'navigation', hint: 'App launch' },
  { title: '2 · Onboarding', route: '/onboarding', icon: 'sparkle', hint: 'Introduction' },
  { title: '3 · Sign Up', route: '/sign-up', icon: 'user', hint: 'Create account' },
  { title: '4 · Sign In', route: '/sign-in', icon: 'lock', hint: 'Access account' },
  { title: '5 · Location Permission', route: '/location-permission', icon: 'locate', hint: 'Allow location' },
  { title: '6 · Home', route: '/select-location', icon: 'map-pin', hint: 'Choose pickup & destination' },
  { title: '7 · Search Destination', route: '/search-destination', icon: 'search', hint: 'Find a destination' },
  { title: '8 · Ride Details', route: '/fare-estimate', icon: 'route', hint: 'Fare + vehicle selection' },
  { title: '9 · Finding Driver', route: '/finding-driver', icon: 'car', hint: 'Searching for a driver' },
  { title: '10 · Driver Assigned', route: '/driver-assigned', icon: 'shield', hint: 'Driver details & ETA' },
  { title: '11 · Driver Messaging', route: '/driver-messaging', icon: 'message', hint: 'Chat with your driver' },
  { title: '12 · Active Ride', route: '/active-ride', icon: 'clock', hint: 'Live simulated trip' },
  { title: '13 · Trip Completed', route: '/trip-completed', icon: 'check', hint: 'Receipt, payment & rating' },
  { title: '14 · Ride History', route: '/ride-history', icon: 'wallet', hint: 'Past trips & receipts' },
];

export default function DevPanelScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  return (
    <Screen scroll>
      <StatusBar style="dark" />
      <AppHeader title="Screen Previews" />
      <AppText variant="bodySmall" color={colors.textSecondary} style={styles.intro}>
        Jump directly into any of the 14 locally rendered screens. All data is mock data.
      </AppText>
      <AppText variant="caption" color={colors.textMuted} style={styles.buildTag}>
        UI build: {UI_BUILD}
      </AppText>

      <View style={styles.list}>
        {PREVIEWS.map((preview) => (
          <Pressable
            key={preview.route}
            onPress={() =>
              preview.route === '/' ? router.replace('/') : router.push(preview.route as never)
            }
            accessibilityRole="button"
            accessibilityLabel={preview.title}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <View style={styles.iconCircle}>
              <Icon name={preview.icon} size={18} color={colors.primary} strokeWidth={1.8} />
            </View>
            <View style={styles.text}>
              <AppText variant="bodySmall" weight="semibold">
                {preview.title}
              </AppText>
              <AppText variant="micro" color={colors.textSecondary}>
                {preview.hint}
              </AppText>
            </View>
            <Icon name="chevron-right" size={16} color={colors.textFaint} strokeWidth={2} />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  intro: {
    marginTop: 8,
    marginBottom: 4,
    lineHeight: 20,
  },
  buildTag: {
    marginBottom: 16,
  },
  list: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
  },
  pressed: {
    opacity: 0.6,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primaryMist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 1,
  },
  });
