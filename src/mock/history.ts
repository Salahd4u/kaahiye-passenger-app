import type { IconName } from '@/components/ui/Icon';
import type { Coordinates, VehicleCategory } from '@/types';

export type HistoryStatus = 'completed' | 'cancelled';

export interface HistoryFareBreakdown {
  base: number;
  /** Distance + time charge (subtotal − base). */
  ride: number;
  tax: number;
}

export interface HistoryEntry {
  id: string;
  destination: string;
  address: string;
  /** Pickup address line, e.g. "123 Main St, Fargo, ND". */
  pickup: string;
  /** Pickup label, e.g. "Home" / "Current Location". */
  pickupLabel: string;
  dateLabel: string;
  fare: number;
  status: HistoryStatus;
  icon: IconName;
  /** ISO-ish timestamp used for ordering (displayed via dateLabel). */
  sortDate: string;
  /** Vehicle category booked for this ride. */
  vehicleCategory: VehicleCategory;
  /** Driver assigned to this ride. */
  driverId: string;
  distanceKm: number;
  durationMinutes: number;
  pickupCoordinates: Coordinates;
  destinationCoordinates: Coordinates;
  fareBreakdown: HistoryFareBreakdown;
  paymentMethod: string;
}

const HOME_COORDS: Coordinates = { latitude: 46.8752, longitude: -96.7894 };

/**
 * Designed ride history — seeded locally so the history screen always shows a
 * complete, realistic list (even before the user completes a ride).
 */
export const MOCK_RIDE_HISTORY: HistoryEntry[] = [
  {
    id: 'hist_fargo_mall',
    destination: 'Fargo Mall',
    address: '1600 13th Ave S, Fargo, ND',
    pickup: '123 Main St, Fargo, ND',
    pickupLabel: 'Home',
    dateLabel: 'Oct 21, 2026 - 12:15 PM',
    fare: 6.4,
    status: 'completed',
    icon: 'shopping-bag',
    sortDate: '2026-10-21T12:15:00',
    vehicleCategory: 'comfort',
    driverId: 'drv_1',
    distanceKm: 4.8,
    durationMinutes: 12,
    pickupCoordinates: HOME_COORDS,
    destinationCoordinates: { latitude: 46.8518, longitude: -96.787 },
    fareBreakdown: { base: 2, ride: 4, tax: 0.4 },
    paymentMethod: 'Cash',
  },
  {
    id: 'hist_city_center',
    destination: 'City Center',
    address: 'Downtown Fargo, ND',
    pickup: '123 Main St, Fargo, ND',
    pickupLabel: 'Home',
    dateLabel: 'Oct 18, 2026 - 3:40 PM',
    fare: 5.2,
    status: 'completed',
    icon: 'building',
    sortDate: '2026-10-18T15:40:00',
    vehicleCategory: 'premium',
    driverId: 'drv_4',
    distanceKm: 3.2,
    durationMinutes: 9,
    pickupCoordinates: HOME_COORDS,
    destinationCoordinates: { latitude: 46.8812, longitude: -96.7815 },
    fareBreakdown: { base: 1.6, ride: 3.24, tax: 0.36 },
    paymentMethod: 'Cash',
  },
  {
    id: 'hist_hector',
    destination: 'Hector Airport',
    address: '2801 19th Ave N, Fargo, ND',
    pickup: '123 Main St, Fargo, ND',
    pickupLabel: 'Home',
    dateLabel: 'Oct 15, 2026 - 9:10 AM',
    fare: 12.75,
    status: 'completed',
    icon: 'plane',
    sortDate: '2026-10-15T09:10:00',
    vehicleCategory: 'xl',
    driverId: 'drv_2',
    distanceKm: 8.6,
    durationMinutes: 18,
    pickupCoordinates: HOME_COORDS,
    destinationCoordinates: { latitude: 46.9249, longitude: -96.8146 },
    fareBreakdown: { base: 3.5, ride: 8.36, tax: 0.89 },
    paymentMethod: 'Cash',
  },
  {
    id: 'hist_west_acres',
    destination: 'West Acres Mall',
    address: '3902 13th Ave S, Fargo, ND',
    pickup: '123 Main St, Fargo, ND',
    pickupLabel: 'Home',
    dateLabel: 'Oct 12, 2026 - 6:30 PM',
    fare: 8.1,
    status: 'cancelled',
    icon: 'shopping-bag',
    sortDate: '2026-10-12T18:30:00',
    vehicleCategory: 'motorbike',
    driverId: 'drv_5',
    distanceKm: 2.4,
    durationMinutes: 7,
    pickupCoordinates: HOME_COORDS,
    destinationCoordinates: { latitude: 46.859, longitude: -96.825 },
    fareBreakdown: { base: 2.4, ride: 5.13, tax: 0.57 },
    paymentMethod: 'Cash',
  },
];

export default MOCK_RIDE_HISTORY;
