import { colors } from './colors';

/**
 * Light palette — the exact colours the app already shipped with. Every value
 * here matches `colors.ts` so Light Mode is pixel-identical to before.
 */
export const lightPalette = {
  ...colors,
  /**
   * Solid ink used as a *background* (avatar chips, marker rings). In dark mode
   * this becomes an elevated surface instead of near-white.
   */
  ink: '#101828',
  /** Floating circular controls that sit on top of the map. */
  floating: '#FFFFFF',
};

export type ThemeMode = 'light' | 'dark';

/** Every colour token is a plain string in both palettes. */
export type ThemeColors = { [K in keyof typeof lightPalette]: string };

export default lightPalette;
