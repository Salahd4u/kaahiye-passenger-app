import type { Driver } from '@/types';
import { MOCK_VEHICLES } from './vehicles';

// Fargo, ND approximate center: 46.8772, -96.7898
export const MOCK_DRIVERS: Driver[] = [
  {
    id: 'drv_1',
    name: 'Ahmed Ali',
    photoUrl: undefined,
    rating: 4.9,
    ridesCount: 320,
    vehicle: MOCK_VEHICLES.veh_1,
    coordinates: { latitude: 46.8642, longitude: -96.7901, label: 'Near 13th Ave S' },
    isAvailable: true,
    heading: 45,
  },
  {
    id: 'drv_2',
    name: 'Sarah Johnson',
    photoUrl: undefined,
    rating: 4.8,
    ridesCount: 210,
    vehicle: MOCK_VEHICLES.veh_2,
    coordinates: { latitude: 46.8821, longitude: -96.784, label: 'Near Downtown' },
    isAvailable: true,
    heading: 120,
  },
  {
    id: 'drv_3',
    name: 'Michael Chen',
    photoUrl: undefined,
    rating: 4.7,
    ridesCount: 185,
    vehicle: MOCK_VEHICLES.veh_3,
    coordinates: { latitude: 46.871, longitude: -96.797, label: 'Near West Acres' },
    isAvailable: true,
    heading: 200,
  },
  {
    id: 'drv_4',
    name: 'Emma Wilson',
    photoUrl: undefined,
    rating: 4.9,
    ridesCount: 410,
    vehicle: MOCK_VEHICLES.veh_4,
    coordinates: { latitude: 46.859, longitude: -96.781, label: 'Near South Fargo' },
    isAvailable: true,
    heading: 330,
  },
  {
    id: 'drv_5',
    name: 'David Okafor',
    photoUrl: undefined,
    rating: 4.6,
    ridesCount: 150,
    vehicle: MOCK_VEHICLES.veh_5,
    coordinates: { latitude: 46.892, longitude: -96.79, label: 'Near NDSU' },
    isAvailable: true,
    heading: 90,
  },
  {
    id: 'drv_6',
    name: 'Olivia Bennett',
    photoUrl: undefined,
    rating: 4.8,
    ridesCount: 275,
    vehicle: MOCK_VEHICLES.veh_6,
    coordinates: { latitude: 46.869, longitude: -96.775, label: 'Near East Side' },
    isAvailable: true,
    heading: 180,
  },
];

export const MOCK_DRIVER_BY_ID: Record<string, Driver> = Object.fromEntries(
  MOCK_DRIVERS.map((driver) => [driver.id, driver]),
);
