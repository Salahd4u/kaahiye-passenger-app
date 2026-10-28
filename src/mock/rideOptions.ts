import type { Fare, VehicleCategory } from '@/types';

export type RideOptionId = VehicleCategory;

export type VehicleArtKind = 'motorbike' | 'suv' | 'suvLarge' | 'sedanBlack';

export interface RideOption {
  id: RideOptionId;
  name: string;
  description: string;
  passengers: number;
  bags: number;
  fare: number;
  etaMinutes: number;
  art: VehicleArtKind;
}

/** Trip metrics shown on the Choose a Ride map card (City Center). */
export const CHOOSE_RIDE_TRIP = {
  destinationLabel: 'City Center',
  distanceKm: 5.2,
  durationMinutes: 12,
  driverEtaMinutes: 3,
} as const;

export const RIDE_OPTIONS: RideOption[] = [
  {
    id: 'motorbike',
    name: 'Kaahiye Motorbike',
    description: 'Fast and affordable rides.',
    passengers: 1,
    bags: 0,
    fare: 2.8,
    etaMinutes: 6,
    art: 'motorbike',
  },
  {
    id: 'comfort',
    name: 'Kaahiye Comfort',
    description: 'More space and comfort.',
    passengers: 4,
    bags: 3,
    fare: 8.2,
    etaMinutes: 14,
    art: 'suv',
  },
  {
    id: 'xl',
    name: 'Kaahiye XL',
    description: 'For groups and extra luggage.',
    passengers: 6,
    bags: 4,
    fare: 10.8,
    etaMinutes: 15,
    art: 'suvLarge',
  },
  {
    id: 'premium',
    name: 'Kaahiye Premium',
    description: 'Premium vehicles and top-rated drivers.',
    passengers: 4,
    bags: 2,
    fare: 12.5,
    etaMinutes: 10,
    art: 'sedanBlack',
  },
];

export const DEFAULT_RIDE_OPTION = RIDE_OPTIONS[0];

export function rideOptionById(id: RideOptionId): RideOption {
  return RIDE_OPTIONS.find((option) => option.id === id) ?? DEFAULT_RIDE_OPTION;
}

/** Builds the local Fare record for a selected vehicle option. */
export function fareForRideOption(option: RideOption): Fare {
  return {
    id: `fare_${option.id}_${Date.now()}`,
    base: Math.max(1.2, Math.round(option.fare * 0.3 * 100) / 100),
    distance: CHOOSE_RIDE_TRIP.distanceKm,
    duration: CHOOSE_RIDE_TRIP.durationMinutes,
    subtotal: Math.round(option.fare * 0.93 * 100) / 100,
    tax: Math.round(option.fare * 0.07 * 100) / 100,
    total: option.fare,
    currency: 'USD',
    breakdownLabel: `${CHOOSE_RIDE_TRIP.distanceKm} km • ${CHOOSE_RIDE_TRIP.durationMinutes} min`,
  };
}

export default RIDE_OPTIONS;
