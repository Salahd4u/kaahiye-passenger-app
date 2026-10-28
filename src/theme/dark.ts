/**
 * Dark palette — a premium night theme.
 *
 * Surfaces use the three-step elevation ladder (#0B1018 → #161E2B → #202B3A),
 * ink flips to a soft near-white (#F8FAFC) and the brand green brightens to
 * #00B894 so it keeps its contrast on dark surfaces.
 */
import type { ThemeColors } from './palettes';
import { lightPalette } from './palettes';

export const darkPalette: ThemeColors = {
  ...lightPalette,

  // Brand
  primary: '#00B894',
  primaryDark: '#00A281',
  primaryDeep: '#008E71',
  primaryLight: '#102A24',
  primaryMist: '#0E211D',
  primaryGradientFrom: '#00C39B',
  primaryGradientTo: '#00A07F',
  forestGradientFrom: '#0E6E59',
  forestGradientTo: '#0B5B4A',

  // Ink / text
  navy: '#F8FAFC',
  navySoft: '#D5DEEA',
  textPrimary: '#F8FAFC',
  textSecondary: '#9AA8BA',
  textMuted: '#7C8A9C',
  textFaint: '#5D6B7C',
  textOnPrimary: '#FFFFFF',

  // Surfaces
  background: '#0B1018',
  surface: '#161E2B',
  card: '#161E2B',
  inputBg: '#1A2432',
  surfaceMuted: '#202B3A',
  surfaceSoft: '#121A25',
  ink: '#202B3A',
  floating: '#202B3A',

  // Lines
  border: '#2A3646',
  borderSoft: '#212D3C',
  divider: '#1A2431',

  // States
  success: '#00B894',
  successSoft: '#102A24',
  warning: '#F5A524',
  error: '#FF6B7A',
  errorSoft: '#341A20',
  info: '#3B9BFF',
  infoSoft: '#122437',

  // Accents
  blue: '#3B9BFF',
  blueDark: '#2F86E0',
  blueSoft: '#122437',
  blueBorder: '#1E3A55',
  red: '#FF6B7A',
  redSoft: '#341A20',
  coral: '#FF7A7A',
  coralDark: '#F06363',
  coralSoft: '#341E20',
  yellow: '#FFC24B',
  green: '#2BD07F',
  greenSoft: '#12291D',

  // Overlays
  overlay: 'rgba(2, 6, 12, 0.66)',
  overlaySoft: 'rgba(2, 6, 12, 0.4)',

  // Simulated cartography — night map style
  mapBase: '#0D131B',
  mapBlock: '#131C27',
  mapBlockAlt: '#111A24',
  mapBlockEdge: '#1A2534',
  mapRoad: '#22303F',
  mapRoadEdge: '#1A2634',
  mapPark: '#143026',
  mapParkDeep: '#1A4032',
  mapTree: '#255742',
  mapWater: '#152F44',
  mapWaterDeep: '#1A3A54',
  mapLabel: '#46586C',
  mapRoute: '#3B9BFF',
  mapRouteSoft: '#17324C',
  mapMarker: '#3B9BFF',
  mapDestination: '#FF6B7A',

  white: '#FFFFFF',
  black: '#000000',
};

export default darkPalette;
