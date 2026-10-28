import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
} from 'react-native-safe-area-context';
import { AppProviders } from '@/store/providers';
import { useRideStore } from '@/store/rideStore';
import { ThemeProvider, useTheme } from '@/theme';

/**
 * When previewing in a browser, emulate an iPhone 13 safe area so screenshots
 * reflect the same composition as the native app. Native builds still use
 * live, platform-provided insets.
 */
const WEB_PREVIEW_METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, bottom: 34, left: 0, right: 0 },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular: require('@assets/fonts/Inter_400Regular.ttf'),
    Inter_500Medium: require('@assets/fonts/Inter_500Medium.ttf'),
    Inter_600SemiBold: require('@assets/fonts/Inter_600SemiBold.ttf'),
    Inter_700Bold: require('@assets/fonts/Inter_700Bold.ttf'),
    Inter_800ExtraBold: require('@assets/fonts/Inter_800ExtraBold.ttf'),
  });

  useEffect(() => {
    // The demo always starts from a clean ride state.
    useRideStore.getState().resetToIdle();
  }, []);

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />;
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider
        initialMetrics={Platform.OS === 'web' ? WEB_PREVIEW_METRICS : undefined}
      >
        <AppProviders>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemedNavigation />
          </GestureHandlerRootView>
        </AppProviders>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

/**
 * Navigation shell. Re-renders when the theme flips so the stack background,
 * status bar and every screen transition pick up the new palette instantly.
 */
function ThemedNavigation() {
  const { colors, isDark } = useTheme();

  const navigation = (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
        animationDuration: 260,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="index" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen
        name="onboarding"
        options={{ animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen name="location-permission" options={{ gestureEnabled: false }} />
      <Stack.Screen name="select-location" options={{ gestureEnabled: false }} />
      <Stack.Screen
        name="fare-estimate"
        options={{ animation: 'fade_from_bottom', animationDuration: 280 }}
      />
      <Stack.Screen name="finding-driver" options={{ gestureEnabled: false }} />
      <Stack.Screen name="driver-assigned" options={{ gestureEnabled: false }} />
      <Stack.Screen name="active-ride" options={{ gestureEnabled: false }} />
      <Stack.Screen name="driver-messaging" options={{ gestureEnabled: false }} />
      <Stack.Screen name="trip-completed" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="dev-panel" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {Platform.OS === 'web' ? (
        <SafeAreaFrameContext.Provider value={WEB_PREVIEW_METRICS.frame}>
          <SafeAreaInsetsContext.Provider value={WEB_PREVIEW_METRICS.insets}>
            {navigation}
          </SafeAreaInsetsContext.Provider>
        </SafeAreaFrameContext.Provider>
      ) : (
        navigation
      )}
    </>
  );
}

