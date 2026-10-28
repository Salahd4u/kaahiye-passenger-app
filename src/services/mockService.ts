/**
 * Kaahiye Mock Service Layer
 *
 * Centralized mock data access. All persistence goes through AsyncStorage so
 * demo data survives app restarts. This layer can later be swapped for real
 * API calls without touching screens or stores.
 *
 * The active in-flight ride is owned by src/store/rideStore (the single
 * authoritative ride state). This service owns persisted profile, history,
 * saved addresses, drivers and fare calculation.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Address,
  Driver,
  Fare,
  Passenger,
  Ride,
  Rating,
  SavedAddressInput,
} from '@/types';
import { MOCK_DRIVERS } from '@/mock/drivers';
import { MOCK_SAVED_ADDRESSES, FAKE_PASSENGER } from '@/mock/destinations';
import { calculateFare } from '@/mock/fares';

const KEY_PASSENGER = 'kaahiye_passenger';
const KEY_RIDE_HISTORY = 'kaahiye_ride_history';
const KEY_SAVED_ADDRESSES = 'kaahiye_saved_addresses';
const KEY_RATINGS = 'kaahiye_ratings';

async function getItem<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function setItem<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

function nowIso(): string {
  return new Date().toISOString();
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export class MockService {
  /* ---------- Passenger ---------- */

  async getPassenger(): Promise<Passenger | null> {
    const stored = await getItem<Passenger | null>(KEY_PASSENGER, null);
    return stored ?? null;
  }

  async createPassenger(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  }): Promise<Passenger> {
    const existing = await this.getPassenger();
    if (existing) throw new Error('An account already exists. Sign in instead.');

    const passenger: Passenger = {
      ...FAKE_PASSENGER,
      id: `psg_${Date.now()}`,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone ?? undefined,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await setItem(KEY_PASSENGER, passenger);
    return clone(passenger);
  }

  async updatePassenger(updates: Partial<Passenger>): Promise<Passenger> {
    const current = await this.getPassenger();
    if (!current) throw new Error('No passenger account found.');
    const updated: Passenger = {
      ...current,
      ...updates,
      updatedAt: nowIso(),
    };
    await setItem(KEY_PASSENGER, updated);
    return clone(updated);
  }

  /* ---------- Drivers (read only) ---------- */

  async getDrivers(): Promise<Driver[]> {
    return clone(MOCK_DRIVERS);
  }

  async getDriver(id: string): Promise<Driver | undefined> {
    return MOCK_DRIVERS.find((d) => d.id === id);
  }

  /* ---------- Fare ---------- */

  async calculateFare(inputs: {
    distanceMiles: number;
    durationMinutes: number;
  }): Promise<Fare> {
    return calculateFare(inputs);
  }
  /* ---------- Rides / History ---------- */

  async getRideHistory(): Promise<Ride[]> {
    return clone(await getItem<Ride[]>(KEY_RIDE_HISTORY, []));
  }

  async addToHistory(ride: Ride): Promise<void> {
    const history = await this.getRideHistory();
    history.push(clone(ride));
    await setItem(KEY_RIDE_HISTORY, history);
  }

  async updateHistoryRide(updatedRide: Ride): Promise<void> {
    const history = await this.getRideHistory();
    const index = history.findIndex((r) => r.id === updatedRide.id);
    if (index === -1) {
      history.push(clone(updatedRide));
    } else {
      history[index] = clone(updatedRide);
    }
    await setItem(KEY_RIDE_HISTORY, history);
  }

  /* ---------- Ratings ---------- */

  async getRatings(): Promise<Rating[]> {
    return clone(await getItem<Rating[]>(KEY_RATINGS, []));
  }

  async createRating(data: {
    rideId: string;
    driverId: string;
    passengerId: string;
    score: number;
    comment?: string;
  }): Promise<Rating> {
    const rating: Rating = {
      id: `rating_${Date.now()}`,
      ...data,
      createdAt: nowIso(),
    };
    const ratings = await this.getRatings();
    ratings.push(clone(rating));
    await setItem(KEY_RATINGS, ratings);
    return clone(rating);
  }
  /* ---------- Saved Addresses CRUD ---------- */

  async getSavedAddresses(): Promise<Address[]> {
    return clone(await getItem<Address[]>(KEY_SAVED_ADDRESSES, [...MOCK_SAVED_ADDRESSES]));
  }

  async createSavedAddress(input: SavedAddressInput): Promise<Address> {
    const addresses = await this.getSavedAddresses();
    const address: Address = {
      id: `addr_${Date.now()}`,
      ...input,
      isSaved: true,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    addresses.push(clone(address));
    await setItem(KEY_SAVED_ADDRESSES, addresses);
    return clone(address);
  }

  async updateSavedAddress(id: string, input: Partial<SavedAddressInput>): Promise<Address> {
    const addresses = await this.getSavedAddresses();
    const index = addresses.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Address not found.');
    const updated: Address = {
      ...addresses[index],
      ...input,
      updatedAt: nowIso(),
    };
    addresses[index] = clone(updated);
    await setItem(KEY_SAVED_ADDRESSES, addresses);
    return clone(updated);
  }

  async deleteSavedAddress(id: string): Promise<void> {
    const addresses = await this.getSavedAddresses();
    const filtered = addresses.filter((a) => a.id !== id);
    if (filtered.length === addresses.length) throw new Error('Address not found.');
    await setItem(KEY_SAVED_ADDRESSES, filtered);
  }

  /* ---------- Demo reset ---------- */

  async resetDemoData(): Promise<void> {
    await Promise.all(
      [KEY_PASSENGER, KEY_RIDE_HISTORY, KEY_SAVED_ADDRESSES, KEY_RATINGS].map((k) =>
        AsyncStorage.removeItem(k),
      ),
    );
    await setItem(KEY_SAVED_ADDRESSES, clone(MOCK_SAVED_ADDRESSES));
  }

  async clearAll(): Promise<void> {
    await this.resetDemoData();
  }
}

export const mockService = new MockService();
export default mockService;
