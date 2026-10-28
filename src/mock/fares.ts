import type { Fare, FareInputs } from '@/types';

/**
 * Deterministic mock fare calculation.
 * No real pricing API. Formula:
 *   subtotal = base + (distanceMiles * perMile) + (durationMinutes * perMinute)
 *   tax = subtotal * taxRate
 *   total = subtotal + tax
 */
const DEFAULTS: Required<FareInputs> = {
  distanceMiles: 0,
  durationMinutes: 0,
  baseFare: 3.0,
  perMile: 1.75,
  perMinute: 0.25,
  taxRate: 0.07,
};

export function calculateFare(inputs: FareInputs): Fare {
  const {
    distanceMiles,
    durationMinutes,
    baseFare,
    perMile,
    perMinute,
    taxRate,
  } = { ...DEFAULTS, ...inputs };

  const distanceCost = Math.max(0, distanceMiles) * perMile;
  const timeCost = Math.max(0, durationMinutes) * perMinute;
  const subtotal = baseFare + distanceCost + timeCost;
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  return {
    id: `fare_${Date.now()}`,
    base: baseFare,
    distance: Math.round(distanceMiles * 10) / 10,
    duration: Math.round(durationMinutes),
    subtotal: Math.round(subtotal * 100) / 100,
    tax,
    total,
    currency: 'USD',
    breakdownLabel: `${Math.round(distanceMiles * 10) / 10} mi • ${Math.round(
      durationMinutes,
    )} min`,
  };
}

/**
 * The fare shown throughout the designed flow (Ride Details / Trip Completed).
 * Kept separate from the pricing helper above so the demo always displays the
 * exact $6.40 fare from the product design.
 */
export const MOCK_RIDE_FARE: Fare = {
  id: 'fare_demo_640',
  base: 2.0,
  distance: 4.8,
  duration: 12,
  subtotal: 6.0,
  tax: 0.4,
  total: 6.4,
  currency: 'USD',
  breakdownLabel: '4.8 km • 12 min',
};

export const EXAMPLE_FARE: Fare = MOCK_RIDE_FARE;
