import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/**
 * Inter is bundled locally under assets/fonts and loaded once in the root
 * layout with expo-font. We always reference the explicit family name so
 * weights render correctly on both iOS and Android.
 */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

export type FontWeight = keyof typeof fonts;

export const fontSize = {
  xs: 11,
  sm: 12,
  caption: 12,
  body: 14,
  md: 15,
  title: 16,
  lg: 18,
  xl: 22,
  xxl: 26,
  display: 32,
} as const;

export const textStyles: Record<string, TextStyle> = {
  display: {
    fontFamily: fonts.extrabold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -1.1,
  },
  h1: {
    fontFamily: fonts.extrabold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.8,
  },
  h2: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  h3: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  bodySmall: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  micro: {
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 13,
  },
  button: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 19,
    letterSpacing: -0.1,
  },
  link: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
  },
};

export type ShadowKey = 'card' | 'floating' | 'sheet' | 'bottomSheet' | 'button';

export type ThemeShadows = Record<ShadowKey, ViewStyle | undefined>;

/**
 * One shadow scale per theme. Light keeps the original values; dark uses deeper,
 * cooler shadows so elevated surfaces still separate from the #0B1018 canvas.
 */
export function createShadows(mode: 'light' | 'dark'): ThemeShadows {
  if (mode === 'dark') {
    return {
      card: Platform.select<ViewStyle>({
        ios: {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.42,
          shadowRadius: 26,
        },
        android: { elevation: 6 },
        default: {},
      }),
      floating: Platform.select<ViewStyle>({
        ios: {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.5,
          shadowRadius: 20,
        },
        android: { elevation: 8 },
        default: {},
      }),
      sheet: Platform.select<ViewStyle>({
        ios: {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.45,
          shadowRadius: 30,
        },
        android: { elevation: 14 },
        default: {},
      }),
      bottomSheet: Platform.select<ViewStyle>({
        ios: {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.38,
          shadowRadius: 14,
        },
        android: { elevation: 10 },
        default: {},
      }),
      button: Platform.select<ViewStyle>({
        ios: {
          shadowColor: '#00B894',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.32,
          shadowRadius: 18,
        },
        android: { elevation: 8 },
        default: {},
      }),
    };
  }

  return {
    card: Platform.select<ViewStyle>({
      ios: {
        shadowColor: '#101828',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
      },
      android: { elevation: 4 },
      default: {},
    }),
    floating: Platform.select<ViewStyle>({
      ios: {
        shadowColor: '#101828',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.14,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
      default: {},
    }),
    sheet: Platform.select<ViewStyle>({
      ios: {
        shadowColor: '#101828',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 28,
      },
      android: { elevation: 12 },
      default: {},
    }),
    /**
     * Soft, upward-only lift used by the white bottom sheets that float over the
     * map (Home + Ride Details). Cast tiny and very light so it reads as natural
     * separation between map and sheet instead of a dark edge.
     */
    bottomSheet: Platform.select<ViewStyle>({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
      default: {},
    }),
    button: Platform.select<ViewStyle>({
      ios: {
        shadowColor: '#008F72',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.24,
        shadowRadius: 16,
      },
      android: { elevation: 5 },
      default: {},
    }),
  };
}

/** Light shadows — kept for modules that render before the theme is available. */
export const shadows = createShadows('light') as ThemeShadows;


export type TextStyleKey = keyof typeof textStyles;
