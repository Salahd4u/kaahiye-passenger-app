import type { ImageSourcePropType } from 'react-native';
import type { VehicleCategory } from '@/types';

/**
 * One source of truth for the Kaahiye-branded vehicle artwork.
 *
 * The category selected on Ride Details is stored in the ride state (and on the
 * ride itself) and resolved through these assets on every trip screen, so the
 * same car/bike can never turn into a different one mid-trip.
 */
export const VEHICLE_IMAGES: Record<VehicleCategory, ImageSourcePropType> = {
  motorbike: require('@assets/vehicles/motorbike.png'),
  comfort: require('@assets/vehicles/comfort.png'),
  xl: require('@assets/vehicles/xl.png'),
  premium: require('@assets/vehicles/premium.png'),
};

/** Artwork for a booked category (falls back only when no category is known). */
export function vehicleImageFor(
  category: VehicleCategory | null | undefined,
): ImageSourcePropType {
  return category ? VEHICLE_IMAGES[category] : VEHICLE_IMAGES.comfort;
}

export default VEHICLE_IMAGES;
