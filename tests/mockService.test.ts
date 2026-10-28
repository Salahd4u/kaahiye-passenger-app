import { mockService } from '@/services/mockService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_DRIVERS } from '@/mock/drivers';
import { calculateFare } from '@/mock/fares';
import type { Address } from '@/types';

const mkAddress = (overrides: Partial<Address> = {}): Address => ({
  id: 'addr_' + Date.now(),
  label: 'Test',
  title: '1 Test St, Fargo, ND',
  coordinates: { latitude: 46.8772, longitude: -96.7898 },
  isSaved: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('mockService — passenger CRUD', () => {
  it('creates a passenger account', async () => {
    const p = await mockService.createPassenger({ firstName: 'Alex', lastName: 'Rider', email: 'alex@demo.com', phone: '555-0100' });
    expect(p.id).toBeDefined();
    expect(p.email).toBe('alex@demo.com');
    const got = await mockService.getPassenger();
    expect(got?.id).toBe(p.id);
    expect(got?.firstName).toBe('Alex');
  });

  it('rejects duplicate account creation', async () => {
    await mockService.createPassenger({ firstName: 'A', lastName: 'B', email: 'dup@demo.com' });
    await expect(mockService.createPassenger({ firstName: 'C', lastName: 'D', email: 'dup@demo.com' })).rejects.toThrow();
  });

  it('updates passenger profile', async () => {
    await mockService.createPassenger({ firstName: 'A', lastName: 'B', email: 'up@demo.com' });
    const updated = await mockService.updatePassenger({ firstName: 'Alexa' });
    expect(updated.firstName).toBe('Alexa');
    const got = await mockService.getPassenger();
    expect(got?.firstName).toBe('Alexa');
  });

  it('throws when updating with no account', async () => {
    await expect(mockService.updatePassenger({ firstName: 'X' })).rejects.toThrow();
  });
});

describe('mockService — fare & drivers', () => {
  it('calculates a deterministic fare', async () => {
    const fare = await mockService.calculateFare({ distanceMiles: 4.8, durationMinutes: 12 });
    expect(fare.total).toBe(15.41);
    expect(fare.currency).toBe('USD');
    const fare2 = await mockService.calculateFare({ distanceMiles: 4.8, durationMinutes: 12 });
    expect(fare2.total).toBe(fare.total);
  });

  it('calculateFare pure function matches', () => {
    const f = calculateFare({ distanceMiles: 4.8, durationMinutes: 12 });
    expect(f.total).toBe(15.41);
  });

  it('exposes at least five drivers', async () => {
    const drivers = await mockService.getDrivers();
    expect(drivers.length).toBeGreaterThanOrEqual(5);
    expect(MOCK_DRIVERS.length).toBeGreaterThanOrEqual(5);
  });
describe('mockService — ride history & ratings', () => {
  it('persists ride history across calls', async () => {
    const ride = {
      id: 'ride_test_1',
      passengerId: 'psg_1',
      status: 'COMPLETED',
      pickup: mkAddress(),
      destination: mkAddress({ id: 'd2' }),
      fare: { id: 'f1', base: 3, distance: 4.8, duration: 12, subtotal: 14.4, tax: 1.01, total: 15.41, currency: 'USD', breakdownLabel: '4.8 mi • 12 min' },
      paymentMethod: 'cash',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    } as any;
    await mockService.addToHistory(ride);
    const history = await mockService.getRideHistory();
    expect(history.find((r) => r.id === 'ride_test_1')).toBeDefined();
  });

  it('creates and persists a driver rating', async () => {
    const rating = await mockService.createRating({ rideId: 'r1', driverId: 'drv_1', passengerId: 'psg_1', score: 5, comment: 'Great!' });
    expect(rating.score).toBe(5);
    expect(rating.comment).toBe('Great!');
    const ratings = await mockService.getRatings();
    expect(ratings.find((r) => r.id === rating.id)).toBeDefined();
  });

  it('updateHistoryRide upserts a ride', async () => {
    const ride = {
      id: 'ride_upsert',
      passengerId: 'psg_1',
      status: 'SEARCHING',
      pickup: mkAddress(),
      destination: mkAddress(),
      fare: { id: 'f2', base: 3, distance: 1, duration: 5, subtotal: 3, tax: 0.21, total: 3.21, currency: 'USD', breakdownLabel: '1 mi • 5 min' },
      paymentMethod: 'cash',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any;
    await mockService.addToHistory(ride);
    await mockService.updateHistoryRide({ ...ride, status: 'COMPLETED' as any });
    const history = await mockService.getRideHistory();
    const found = history.find((r) => r.id === 'ride_upsert');
    expect(found?.status).toBe('COMPLETED');
    expect(history.filter((r) => r.id === 'ride_upsert').length).toBe(1);
  });
});

describe('mockService — saved addresses CRUD', () => {
  it('creates, reads, updates and deletes saved addresses', async () => {
    const created = await mockService.createSavedAddress({ label: 'Home', title: '1 Home St, Fargo, ND', coordinates: { latitude: 1, longitude: 2 } });
    expect(created.id).toBeDefined();
    const list = await mockService.getSavedAddresses();
    expect(list.find((a) => a.id === created.id)).toBeDefined();
    const updated = await mockService.updateSavedAddress(created.id, { label: 'New Home' });
    expect(updated.label).toBe('New Home');
    await mockService.deleteSavedAddress(created.id);
    const after = await mockService.getSavedAddresses();
    expect(after.find((a) => a.id === created.id)).toBeUndefined();
    await expect(mockService.deleteSavedAddress(created.id)).rejects.toThrow();
  });

  it('defaults to seeded saved addresses', async () => {
    const list = await mockService.getSavedAddresses();
    expect(list.length).toBeGreaterThanOrEqual(5);
  });
});

describe('mockService — demo reset', () => {
  it('resets demo data', async () => {
    await mockService.createPassenger({ firstName: 'A', lastName: 'B', email: 'reset@demo.com' });
    await mockService.resetDemoData();
    const p = await mockService.getPassenger();
    expect(p).toBeNull();
    const list = await mockService.getSavedAddresses();
    expect(list.length).toBeGreaterThanOrEqual(5);
  });
});
});