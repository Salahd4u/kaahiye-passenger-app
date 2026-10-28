import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkPalette } from './dark';
import { lightPalette, type ThemeColors, type ThemeMode } from './palettes';
import { createShadows, type ThemeShadows } from './typography';

const STORAGE_KEY = 'kaahiye.theme.mode';

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  shadows: ThemeShadows;
  /** True when the OS "Reduce Motion" accessibility setting is on. */
  reducedMotion: boolean;
  /** False until the saved preference has been read from AsyncStorage. */
  hydrated: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const fallbackValue: ThemeContextValue = {
  mode: 'light',
  isDark: false,
  colors: lightPalette,
  shadows: createShadows('light'),
  reducedMotion: false,
  hydrated: true,
  setMode: () => undefined,
  toggleMode: () => undefined,
};

const ThemeContext = createContext<ThemeContextValue>(fallbackValue);

/**
 * App-wide appearance provider.
 *
 * The preference is stored in AsyncStorage and applied instantly on toggle; the
 * children are only mounted once the stored mode is known, so a dark-mode user
 * never sees a flash of the light theme at launch.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [hydrated, setHydrated] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!active) return;
        if (stored === 'dark' || stored === 'light') setModeState(stored);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setHydrated(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active) setReducedMotion(enabled);
      })
      .catch(() => undefined);

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      setReducedMotion(enabled);
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((current) => {
      const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
      return next;
    });
  }, []);

  const isDark = mode === 'dark';
  const colors = isDark ? darkPalette : lightPalette;
  const shadows = useMemo(() => createShadows(mode), [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      isDark,
      colors,
      shadows,
      reducedMotion,
      hydrated,
      setMode,
      toggleMode,
    }),
    [mode, isDark, colors, shadows, reducedMotion, hydrated, setMode, toggleMode],
  );

  if (!hydrated) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

/** Convenience hook for components that only need the palette. */
export function useThemeColors() {
  return useContext(ThemeContext).colors;
}

/** Respects the OS reduce-motion setting for all decorative animations. */
export function useReducedMotion() {
  return useContext(ThemeContext).reducedMotion;
}

export default ThemeProvider;
