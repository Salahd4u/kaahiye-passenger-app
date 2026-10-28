import { create } from 'zustand';
import type { Ride, RideRequest, DriverAssignment, Address, Fare } from '@/types';
import { MOCK_DRIVERS, MOCK_DRIVER_BY_ID } from '@/mock/drivers';
import { MOCK_RIDE_FARE } from '@/mock/fares';
import type { RideOption } from '@/mock/rideOptions';

export type RideStatePhase =
  | 'IDLE'
  | 'SEARCHING'
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_ARRIVING'
  | 'DRIVER_ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED_MATCH';

const VALID_TRANSITIONS: Record<RideStatePhase, RideStatePhase[]> = {
  IDLE: ['SEARCHING'],
  SEARCHING: ['DRIVER_ASSIGNED', 'FAILED_MATCH', 'IDLE'],
  DRIVER_ASSIGNED: ['DRIVER_ARRIVING', 'CANCELLED', 'FAILED_MATCH'],
  DRIVER_ARRIVING: ['DRIVER_ARRIVED', 'CANCELLED'],
  DRIVER_ARRIVED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: ['IDLE'],
  FAILED_MATCH: ['IDLE', 'SEARCHING'],
};

const CANCELLABLE_PHASES: RideStatePhase[] = [
  'SEARCHING',
  'DRIVER_ASSIGNED',
  'DRIVER_ARRIVING',
  'DRIVER_ARRIVED',
  'IN_PROGRESS',
];

interface RideStore {
  ride: Ride | null;
  phase: RideStatePhase;
  isLoading: boolean;
  error: string | null;
  setRide: (ride: Ride | null) => void;
  setPhase: (phase: RideStatePhase) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  createRide: (request: RideRequest, passengerId: string, fareOverride?: Fare) => Ride;
  cancelRide: (reason?: string) => void;
  assignDriver: (driverId?: string) => DriverAssignment;
  simulateDriverArriving: () => void;
  simulateDriverArrived: () => void;
  startRide: () => void;
  completeRide: () => void;
  simulateFailedMatch: () => void;
  updateProgress: (progress: number) => void;
  resetToIdle: () => void;
  canTransition: (to: RideStatePhase) => boolean;
  currentDriver: () => DriverAssignment['driver'] | undefined;
  selectedPickup: Address | null;
  selectedDestination: Address | null;
  setPickup: (address: Address | null) => void;
  setDestination: (address: Address | null) => void;
  clearSelection: () => void;
  /** Vehicle chosen on Ride Details / Choose a Ride (persists through the trip). */
  selectedRideOption: RideOption | null;
  setRideOption: (option: RideOption | null) => void;
}

export const useRideStore = create<RideStore>()((set, get) => ({
      ride: null,
      phase: 'IDLE',
      isLoading: false,
      error: null,
      setRide: (ride) => set({ ride }),
      setPhase: (phase) => set({ phase }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      canTransition: (to) => {
        const { phase } = get();
        return VALID_TRANSITIONS[phase].includes(to);
      },

      createRide: (request, passengerId, fareOverride) => {
        const { phase, selectedRideOption } = get();
        if (phase !== 'IDLE' && phase !== 'COMPLETED' && phase !== 'CANCELLED') {
          throw new Error('Cannot create a ride while a ride is already active.');
        }

        const distanceMiles = 4.8;
        const durationMinutes = 12;

        // Design-time fare; Choose a Ride can pass the selected vehicle fare.
        const fare = fareOverride ?? { ...MOCK_RIDE_FARE, id: `fare_${Date.now()}` };

        const ride: Ride = {
          id: `ride_${Date.now()}`,
          passengerId,
          status: 'SEARCHING',
          pickup: request.pickup,
          destination: request.destination,
          fare,
          paymentMethod: request.paymentMethod ?? 'cash',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          etaMinutes: durationMinutes,
          distanceMiles,
          progress: 0,
          // Snapshot the booked category so every screen in this trip resolves
          // the same vehicle even if the selection changes later.
          vehicleCategory: selectedRideOption?.id,
        };

        set({ ride, phase: 'SEARCHING', error: null });
        return ride;
      },
      cancelRide: (reason) => {
        const { phase, ride } = get();
        if (!ride) throw new Error('No ride to cancel.');
        if (!CANCELLABLE_PHASES.includes(phase)) {
          throw new Error(`Cannot cancel a ride in phase "${phase}".`);
        }
        set({
          phase: 'CANCELLED',
          error: null,
          ride: {
            ...ride,
            status: 'CANCELLED',
            cancelledAt: new Date().toISOString(),
            cancellationReason: reason,
            updatedAt: new Date().toISOString(),
          },
        });
      },

      assignDriver: (driverId) => {
        const { phase, ride } = get();
        if (ride?.driverId) {
          throw new Error('A driver has already been assigned to this ride.');
        }
        if (phase !== 'SEARCHING') {
          throw new Error('Driver can only be assigned while SEARCHING.');
        }
        if (!ride) throw new Error('No active ride.');

        const driver =
          driverId && MOCK_DRIVER_BY_ID[driverId]
            ? MOCK_DRIVER_BY_ID[driverId]
            : MOCK_DRIVERS[0];

        set({
          phase: 'DRIVER_ASSIGNED',
          ride: {
            ...ride,
            driverId: driver.id,
            status: 'DRIVER_ASSIGNED',
            driver,
            updatedAt: new Date().toISOString(),
          },
        });
        return { driver, etaMinutes: 3, distanceMiles: 0.8 };
      },

      simulateDriverArriving: () => {
        const { phase, ride } = get();
        if (phase !== 'DRIVER_ASSIGNED') {
          throw new Error('Driver arrival simulation only valid when DRIVER_ASSIGNED.');
        }
        if (!ride) throw new Error('No active ride.');
        set({
          phase: 'DRIVER_ARRIVING',
          ride: {
            ...ride,
            status: 'DRIVER_ARRIVING',
            updatedAt: new Date().toISOString(),
          },
        });
      },

      simulateDriverArrived: () => {
        const { phase, ride } = get();
        if (phase !== 'DRIVER_ARRIVING') {
          throw new Error('Driver arrival only valid when DRIVER_ARRIVING.');
        }
        if (!ride) throw new Error('No active ride.');
        set({
          phase: 'DRIVER_ARRIVED',
          ride: {
            ...ride,
            status: 'DRIVER_ARRIVED',
            updatedAt: new Date().toISOString(),
          },
        });
      },

      startRide: () => {
        const { phase, ride } = get();
        if (phase !== 'DRIVER_ARRIVED') {
          throw new Error('Ride can only start when DRIVER_ARRIVED.');
        }
        if (!ride) throw new Error('No active ride.');
        set({
          phase: 'IN_PROGRESS',
          ride: {
            ...ride,
            status: 'IN_PROGRESS',
            startedAt: new Date().toISOString(),
            progress: 0,
            updatedAt: new Date().toISOString(),
          },
        });
      },

      completeRide: () => {
        const { phase, ride } = get();
        if (phase !== 'IN_PROGRESS') {
          throw new Error('Only an IN_PROGRESS ride can be completed.');
        }
        if (!ride) throw new Error('No active ride.');
        set({
          phase: 'COMPLETED',
          ride: {
            ...ride,
            status: 'COMPLETED',
            completedAt: new Date().toISOString(),
            progress: 100,
            updatedAt: new Date().toISOString(),
          },
        });
      },

      simulateFailedMatch: () => {
        const { phase } = get();
        if (phase !== 'SEARCHING') {
          throw new Error('Failed match only valid while SEARCHING.');
        }
        set({
          phase: 'FAILED_MATCH',
          error: 'No drivers available nearby. Please try again.',
        });
      },

      updateProgress: (progress) => {
        const { ride, phase } = get();
        if (phase !== 'IN_PROGRESS' || !ride) return;
        set({
          ride: {
            ...ride,
            progress: Math.min(100, Math.max(0, progress)),
            updatedAt: new Date().toISOString(),
          },
        });
      },

      resetToIdle: () => {
        set({ ride: null, phase: 'IDLE', error: null });
      },

      selectedPickup: null,
      selectedDestination: null,
      setPickup: (address) => set({ selectedPickup: address }),
      setDestination: (address) => set({ selectedDestination: address }),
      clearSelection: () => set({ selectedPickup: null, selectedDestination: null }),
      selectedRideOption: null,
      setRideOption: (option) => set({ selectedRideOption: option }),
      currentDriver: () => {
        const { ride } = get();
        return ride?.driver ?? undefined;
      },
    }));
