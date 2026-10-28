import type { ImageSourcePropType } from 'react-native';
import type { Driver } from '@/types';
import type { IconName } from '@/components/ui/Icon';
import type { RideOption, RideOptionId, VehicleArtKind } from './rideOptions';
import { VEHICLE_IMAGES } from './vehicleImages';

/**
 * The vehicle the passenger actually booked.
 *
 * Everything the waiting screen renders (map marker, ETA icon, illustration,
 * model + plate) is derived from here, so a motorbike booking can never show a
 * car and vice-versa.
 */
export type AssignedVehicleKind = 'motorbike' | 'car';

export interface AssignedVehicle {
  kind: AssignedVehicleKind;
  /** Top-down marker drawn on the tracking map. */
  markerKind: AssignedVehicleKind;
  /** Small glyph used inside the ETA pills. */
  icon: IconName;
  /** e.g. "Honda CB 150R · Black". */
  label: string;
  plate: string;
  /** Side-profile artwork kind for the sheet. */
  art: VehicleArtKind;
  /** Category chosen at booking ("Kaahiye XL"), null only when nothing was booked. */
  category: string | null;
  /** Compact category for pills ("XL", "Comfort", "Premium", "Motorbike"). */
  categoryShort: string | null;
  categoryId: RideOptionId | null;
  /** Kaahiye-branded photo for the selected category. */
  image: ImageSourcePropType;
}

const MOCK_ASSIGNED_MOTORBIKE: Omit<
  AssignedVehicle,
  'category' | 'categoryShort' | 'categoryId' | 'image'
> = {
  kind: 'motorbike',
  markerKind: 'motorbike',
  icon: 'motorbike',
  label: 'Honda CB 150R · Black',
  plate: 'ABC 1234',
  art: 'motorbike',
};

export function assignedVehicleFor(
  option: RideOption | null | undefined,
  driver: Driver,
): AssignedVehicle {
  const categoryId = option?.id ?? null;
  const category = option?.name ?? null;
  const categoryShort = category ? category.replace(/^Kaahiye\s+/, '') : null;
  const isMotorbike = option?.id === 'motorbike' || option?.art === 'motorbike';

  if (isMotorbike) {
    return {
      ...MOCK_ASSIGNED_MOTORBIKE,
      categoryId: 'motorbike',
      category: category ?? 'Kaahiye Motorbike',
      categoryShort: categoryShort ?? 'Motorbike',
      image: VEHICLE_IMAGES.motorbike,
    };
  }

  return {
    kind: 'car',
    markerKind: 'car',
    icon: 'car',
    label: `${driver.vehicle.make} ${driver.vehicle.model} · ${driver.vehicle.color}`,
    plate: driver.vehicle.licensePlate,
    art: driver.vehicle.type === 'suv' ? 'suv' : 'sedanBlack',
    categoryId,
    category,
    categoryShort,
    image: categoryId ? VEHICLE_IMAGES[categoryId] : VEHICLE_IMAGES.comfort,
  };
}

export default assignedVehicleFor;
