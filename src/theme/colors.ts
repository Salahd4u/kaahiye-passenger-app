/**
 * Kaahiye brand palette.
 *
 * Premium, minimalist ride-hailing interface:
 * emerald primary, dark navy ink, soft gray surfaces, blue route accents
 * and coral-red destinations.
 */
export const colors = {
  // Brand
  primary: '#00A884',
  primaryDark: '#008F72',
  primaryDeep: '#0B6B57',
  primaryLight: '#E7F7F2',
  primaryMist: '#F1FAF7',
  primaryGradientFrom: '#00B58D',
  primaryGradientTo: '#009C7C',
  forestGradientFrom: '#0E6E59',
  forestGradientTo: '#095746',

  // Ink / text
  navy: '#101828',
  navySoft: '#344054',
  textPrimary: '#101828',
  textSecondary: '#667085',
  textMuted: '#98A2B3',
  textFaint: '#B4BDC9',
  textOnPrimary: '#FFFFFF',

  // Surfaces
  background: '#FFFFFF',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  inputBg: '#F5F7FA',
  surfaceMuted: '#F2F4F7',
  surfaceSoft: '#F8FAFC',

  // Lines
  border: '#E4E7EC',
  borderSoft: '#EEF0F3',
  divider: '#F2F4F7',

  // States
  success: '#00A884',
  successSoft: '#E7F7F2',
  warning: '#F59E0B',
  error: '#FF5364',
  errorSoft: '#FFECEE',
  info: '#1689F9',
  infoSoft: '#EAF3FF',

  // Accents
  blue: '#1689F9',
  blueDark: '#0B6FD1',
  blueSoft: '#EAF3FF',
  blueBorder: '#D3E6FF',
  red: '#FF5364',
  redSoft: '#FFECEE',
  coral: '#FF6363',
  coralDark: '#F44F4F',
  coralSoft: '#FFECEC',
  yellow: '#FFB800',
  green: '#12B76A',
  greenSoft: '#E9F9F1',

  // Overlays
  overlay: 'rgba(16, 24, 40, 0.45)',
  overlaySoft: 'rgba(16, 24, 40, 0.12)',

  // Simulated cartography
  mapBase: '#ECF1F5',
  mapBlock: '#F8FAFC',
  mapBlockAlt: '#F2F6F9',
  mapBlockEdge: '#E9EEF3',
  mapRoad: '#FFFFFF',
  mapRoadEdge: '#E1E8EF',
  mapPark: '#DCEFE2',
  mapParkDeep: '#C7E6D1',
  mapTree: '#B4DCBF',
  mapWater: '#DCEBF7',
  mapWaterDeep: '#CFE4F5',
  mapLabel: '#AEBBC8',
  mapRoute: '#1689F9',
  mapRouteSoft: '#CBE3FF',
  mapMarker: '#1689F9',
  mapDestination: '#FF5364',

  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ThemeColor = (typeof colors)[keyof typeof colors];

export default colors;
