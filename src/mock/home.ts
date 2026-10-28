import type { IconName } from '@/components/ui/Icon';

/**
 * Home screen content — display-only mock data.
 *
 * Nothing here talks to a backend: shortcuts reuse the saved addresses in
 * `src/mock/destinations.ts` so tapping one continues into the existing
 * booking flow (Ride Details), and recent rides are seeded locally.
 */

export type HomeShortcutId = 'home' | 'work' | 'favorites' | 'recent';

export interface HomeShortcut {
  id: HomeShortcutId;
  label: string;
  subtitle: string;
  icon: IconName;
  /** Icon glyph colour. */
  tint: string;
  /** Soft pastel card background. */
  background: string;
  /** Night-theme card background. */
  backgroundDark: string;
  /** Optional filled badge behind the glyph (used by the Recent card). */
  badgeColor?: string;
  /** Saved address used when the shortcut starts a booking. */
  destinationId?: string;
  /** Existing route opened by shortcuts that are not tied to one address. */
  route?: string;
}

export const HOME_SHORTCUTS: HomeShortcut[] = [
  {
    id: 'home',
    label: 'Home',
    subtitle: '123 Main St, Fargo, ND',
    icon: 'home-filled',
    tint: '#12B76A',
    background: '#EAF8F1',
    backgroundDark: '#12291F',
    destinationId: 'addr_1',
  },
  {
    id: 'work',
    label: 'Work',
    subtitle: '456 Broadway, Fargo, ND',
    icon: 'briefcase-filled',
    tint: '#2F80ED',
    background: '#EAF2FE',
    backgroundDark: '#132238',
    destinationId: 'addr_2',
  },
  {
    id: 'favorites',
    label: 'Favorites',
    subtitle: 'Saved places',
    icon: 'star',
    tint: '#F5A524',
    background: '#FFF6E7',
    backgroundDark: '#2A2214',
    route: '/search-destination',
  },
  {
    id: 'recent',
    label: 'Recent',
    subtitle: 'Your trips',
    icon: 'clock',
    tint: '#FFFFFF',
    background: '#F4F1FE',
    backgroundDark: '#1E1A33',
    badgeColor: '#7A5AF8',
    route: '/ride-history',
  },
];

export interface RecentRidePreview {
  id: string;
  destination: string;
  address: string;
  dateLabel: string;
  fare: number;
  /** Saved address used when the card starts a booking. */
  destinationId: string;
}

export const HOME_RECENT_RIDES: RecentRidePreview[] = [
  {
    id: 'home_trip_oct26',
    destination: 'Home',
    address: '123 Main St, Fargo, ND',
    dateLabel: 'Oct 26, 2026 • 10:24 AM',
    fare: 10.8,
    destinationId: 'addr_1',
  },
  {
    id: 'work_trip_oct24',
    destination: 'Work',
    address: '456 Broadway, Fargo, ND',
    dateLabel: 'Oct 24, 2026 • 5:16 PM',
    fare: 8.4,
    destinationId: 'addr_2',
  },
];

/** Nearby cars drawn on the home map (normalised 0..1 map coordinates). */
export const HOME_MAP_CARS = [
  { x: 0.22, y: 0.256, angle: -38 },
  { x: 0.706, y: 0.163, angle: 22 },
  { x: 0.849, y: 0.284, angle: -34 },
];

export default HOME_SHORTCUTS;
