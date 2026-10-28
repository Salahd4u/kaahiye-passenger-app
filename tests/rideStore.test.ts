import { useRideStore } from '@/store/rideStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_DRIVERS } from '@/mock/drivers';
import { RIDE_OPTIONS } from '@/mock/rideOptions';
import type { Address } from '@/types';

const store = useRideStore;

beforeEach(async () => {
  try {
    await AsyncStorage.clear();
  } catch {
    // ignore
  }
  store.getState().resetToIdle();
});

const get = () => store.getState();

const mkAddress = (id: string, title: string): Address => ({
  id,
  label: title,
  title,
  coordinates: { latitude: 0, longitude: 0 },
  isSaved: true,
  createdAt: 't',
  updatedAt: 't',
});

describe('ride store — state machine', () => {
  it('starts in IDLE', () => {
    expect(get().phase).toBe('IDLE');
    expect(get().ride).toBeNull();
  });

  it('createRide transitions IDLE -> SEARCHING', () => {
    const ride = get().createRide({ pickup: mkAddress('a', 'Home'), destination: mkAddress('b', 'Work') }, 'psg_1');
    expect(get().phase).toBe('SEARCHING');
    expect(get().ride?.id).toBe(ride.id);
    expect(ride.status).toBe('SEARCHING');
    expect(ride.paymentMethod).toBe('cash');
  });

  it('stores the selected vehicle category on the ride', () => {
    get().setRideOption(RIDE_OPTIONS[2]);
    const ride = get().createRide(
      { pickup: mkAddress('a', 'Home'), destination: mkAddress('b', 'Work') },
      'psg_1',
    );
    expect(ride.vehicleCategory).toBe(RIDE_OPTIONS[2].id);
    get().setRideOption(null);
  });

  it('prevents creating a ride while one is active', () => {
    get().createRide({ pickup: mkAddress('a', 'Home'), destination: mkAddress('b', 'Work') }, 'psg_1');
    expect(() => get().createRide({ pickup: mkAddress('a', 'Home'), destination: mkAddress('b', 'Work') }, 'psg_1')).toThrow();
  });

  it('assigns a driver and prevents duplicate assignment', () => {
    get().createRide({ pickup: mkAddress('a', 'Home'), destination: mkAddress('b', 'Work') }, 'psg_1');
    const a1 = get().assignDriver(MOCK_DRIVERS[0].id);
    expect(get().phase).toBe('DRIVER_ASSIGNED');
    expect(get().ride?.driverId).toBe(MOCK_DRIVERS[0].id);
    expect(a1.driver.id).toBe(MOCK_DRIVERS[0].id);
    expect(() => get().assignDriver(MOCK_DRIVERS[1].id)).toThrow('already been assigned');
  });
  it('driver arrival sequence is valid', () => {
    get().createRide({ pickup: mkAddress('a', 'Home'), destination: mkAddress('b', 'Work') }, 'psg_1');
    get().assignDriver();
    expect(get().phase).toBe('DRIVER_ASSIGNED');
    expect(() => get().startRide()).toThrow();
    get().simulateDriverArriving();
    expect(get().phase).toBe('DRIVER_ARRIVING');
    get().simulateDriverArrived();
    expect(get().phase).toBe('DRIVER_ARRIVED');
    get().startRide();
    expect(get().phase).toBe('IN_PROGRESS');
  });

  it('cannot complete a ride that has not started', () => {
    get().createRide({ pickup: mkAddress('a', 'Home'), destination: mkAddress('b', 'Work') }, 'psg_1');
    expect(() => get().completeRide()).toThrow();
  });

  it('allows cancellation in appropriate states', () => {
    get().createRide({ pickup: mkAddress('a', 'Home'), destination: mkAddress('b', 'Work') }, 'psg_1');
    get().cancelRide('changed mind');
    expect(get().phase).toBe('CANCELLED');
    expect(get().ride?.status).toBe('CANCELLED');
    expect(get().ride?.cancellationReason).toBe('changed mind');
  });

  it('prevents cancellation in IDLE and after completion', () => {
    expect(() => get().cancelRide()).toThrow();
    get().createRide({ pickup: mkAddress('a', 'Home'), destination: mkAddress('b', 'Work') }, 'psg_1');
    get().assignDriver();
    get().simulateDriverArriving();
    get().simulateDriverArrived();
    get().startRide();
    get().completeRide();
    expect(() => get().cancelRide()).toThrow();
  });

  it('cancellation race condition: only one cancel succeeds', () => {
    get().createRide({ pickup: mkAddress('a', 'Home'), destination: mkAddress('b', 'Work') }, 'psg_1');
    get().cancelRide('first');
    expect(() => get().cancelRide('second')).toThrow();
    expect(get().ride?.cancellationReason).toBe('first');
  });
  it('updateProgress only works while IN_PROGRESS', () => {
    get().createRide({ pickup: mkAddress('a', 'Home'), destination: mkAddress('b', 'Work') }, 'psg_1');
    get().assignDriver();
    get().simulateDriverArriving();
    get().simulateDriverArrived();
    get().startRide();
    get().updateProgress(50);
    expect(get().ride?.progress).toBe(50);
    get().updateProgress(150);
    expect(get().ride?.progress).toBe(100);
    get().updateProgress(-10);
    expect(get().ride?.progress).toBe(0);
  });

  it('failed match transitions SEARCHING -> FAILED_MATCH', () => {
    get().createRide({ pickup: mkAddress('a', 'Home'), destination: mkAddress('b', 'Work') }, 'psg_1');
    get().simulateFailedMatch();
    expect(get().phase).toBe('FAILED_MATCH');
    expect(get().error).toContain('drivers');
  });

  it('canTransition reports valid/invalid transitions', () => {
    expect(get().canTransition('SEARCHING')).toBe(true);
    expect(get().canTransition('COMPLETED')).toBe(false);
    get().createRide({ pickup: mkAddress('a', 'x'), destination: mkAddress('b', 'y') }, 'psg_1');
    expect(get().canTransition('DRIVER_ASSIGNED')).toBe(true);
    expect(get().canTransition('IN_PROGRESS')).toBe(false);
  });
});

describe('ride store — driver helpers', () => {
  it('exposes at least five drivers', () => {
    expect(MOCK_DRIVERS.length).toBeGreaterThanOrEqual(5);
  });

  it('currentDriver returns assigned driver', () => {
    get().createRide({ pickup: mkAddress('a', 'Home'), destination: mkAddress('b', 'Work') }, 'psg_1');
    expect(get().currentDriver()).toBeUndefined();
    get().assignDriver();
    expect(get().currentDriver()?.id).toBe(get().ride?.driverId);
  });
});
