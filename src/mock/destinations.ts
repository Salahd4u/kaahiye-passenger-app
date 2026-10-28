import type { Address, Passenger } from '@/types';

// Approximate Fargo, ND coordinates — used for display only (no GPS access).
export const MOCK_CURRENT_LOCATION: Address = {
  id: 'addr_current',
  label: 'Current Location',
  title: 'Current Location',
  subtitle: '123 Main St, Fargo, ND',
  coordinates: { latitude: 46.8752, longitude: -96.7894 },
  isSaved: true,
  createdAt: '2026-01-01T08:00:00Z',
  updatedAt: '2026-01-01T08:00:00Z',
};

export const MOCK_SAVED_ADDRESSES: Address[] = [
  {
    id: 'addr_1',
    label: 'Home',
    title: '123 Main St, Fargo, ND',
    subtitle: 'Fargo, ND',
    coordinates: { latitude: 46.8752, longitude: -96.7894 },
    isSaved: true,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'addr_2',
    label: 'Work',
    title: '456 Office Ave, Fargo, ND',
    subtitle: 'Fargo, ND',
    coordinates: { latitude: 46.8565, longitude: -96.7937 },
    isSaved: true,
    createdAt: '2026-01-12T09:15:00Z',
    updatedAt: '2026-01-12T09:15:00Z',
  },
  {
    id: 'addr_3',
    label: 'Fargo Mall',
    title: '1600 13th Ave S, Fargo, ND',
    subtitle: 'Fargo, ND',
    coordinates: { latitude: 46.8518, longitude: -96.787 },
    isSaved: true,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'addr_4',
    label: 'Hector International Airport',
    title: '2801 19th Ave N, Fargo, ND',
    subtitle: 'Fargo, ND',
    coordinates: { latitude: 46.9249, longitude: -96.8146 },
    isSaved: true,
    createdAt: '2026-02-15T07:30:00Z',
    updatedAt: '2026-02-15T07:30:00Z',
  },
  {
    id: 'addr_5',
    label: 'City Center',
    title: 'Downtown Fargo, ND',
    subtitle: 'Fargo, ND',
    coordinates: { latitude: 46.8772, longitude: -96.7898 },
    isSaved: true,
    createdAt: '2026-03-01T11:00:00Z',
    updatedAt: '2026-03-01T11:00:00Z',
  },
];

export const MOCK_DESTINATIONS: Address[] = MOCK_SAVED_ADDRESSES;

/** Normalized positions on the simulated map (0..1 on both axes). */
export const MAP_POSITIONS: Record<string, { x: number; y: number }> = {
  addr_current: { x: 0.34, y: 0.68 },
  addr_1: { x: 0.3, y: 0.7 },
  addr_2: { x: 0.19, y: 0.82 },
  addr_3: { x: 0.76, y: 0.3 },
  addr_4: { x: 0.21, y: 0.15 },
  addr_5: { x: 0.5, y: 0.44 },
};

export function getMapPosition(id?: string) {
  return MAP_POSITIONS[id ?? ''] ?? { x: 0.5, y: 0.5 };
}

export const FAKE_PASSENGER: Passenger = {
  id: 'psg_001',
  firstName: 'kaahiye',
  lastName: 'Passenger',
  email: 'jamal@kaahiye.demo',
  phone: '+1 (701) 373-3427',
  photoUrl: undefined,
  rating: 5.0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

export default MOCK_SAVED_ADDRESSES;
