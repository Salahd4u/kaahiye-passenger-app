/**
 * Kaahiye Passenger App — TypeScript interfaces.
 *
 * All domain types for passengers, drivers, vehicles, rides, fares, ratings
 * and saved addresses. These are used across the store, services and screens.
 */

export type City = 'Fargo, ND';

export type RideStatus =
  | 'IDLE'
  | 'SEARCHING'
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_ARRIVING'
  | 'DRIVER_ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED_MATCH';

export type PaymentMethod = 'cash';

/** The vehicle category chosen on Ride Details (Choose a Ride). */
export type VehicleCategory = 'motorbike' | 'comfort' | 'xl' | 'premium';

export type RideRequestSource = 'saved_address' | 'map_selection' | 'search';

export interface Coordinates {
  latitude: number;
  longitude: number;
  label?: string;
}

export interface Address {
  id: string;
  label: string; // e.g. "Home", "Work"
  title: string; // e.g. "123 Main St, Fargo, ND"
  subtitle?: string;
  coordinates: Coordinates;
  isSaved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  type: 'sedan' | 'suv' | 'hatchback';
  imageUrl?: string;
}

export interface Driver {
  id: string;
  name: string;
  photoUrl?: string;
  rating: number; // 0-5
  ridesCount: number;
  vehicle: Vehicle;
  coordinates: Coordinates;
  isAvailable: boolean;
  // Simulated movement target (used by the mock map)
  heading?: number; // degrees
}

export interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Fare {
  id: string;
  base: number;
  distance: number; // miles
  duration: number; // minutes
  subtotal: number;
  tax: number;
  total: number;
  currency: 'USD';
  breakdownLabel: string;
}

export interface Rating {
  id: string;
  rideId: string;
  driverId: string;
  passengerId: string;
  score: number; // 1-5
  comment?: string;
  createdAt: string;
}

export interface Ride {
  id: string;
  passengerId: string;
  driverId?: string;
  status: RideStatus;
  pickup: Address;
  destination: Address;
  fare: Fare;
  paymentMethod: PaymentMethod;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  driver?: Driver;
  /** Vehicle category chosen at booking — keeps the trip vehicle consistent. */
  vehicleCategory?: VehicleCategory;
  // Simulated progress (0-100) for the active trip
  progress?: number;
  // Simulated ETA
  etaMinutes?: number;
  distanceMiles?: number;
}

export interface RideRequest {
  pickup: Address;
  destination: Address;
  paymentMethod?: PaymentMethod;
}

export interface CreateRideResult {
  ride: Ride;
  fare: Fare;
}

export interface DriverAssignment {
  driver: Driver;
  etaMinutes: number;
  distanceMiles: number;
}

export interface SavedAddressInput {
  label: string;
  title: string;
  subtitle?: string;
  coordinates: Coordinates;
}

export interface AuthState {
  isAuthenticated: boolean;
  passenger: Passenger | null;
  loading: boolean;
}

export interface DemoState {
  enabled: boolean;
}

/**
 * Deterministic mock fare calculation inputs.
 */
export interface FareInputs {
  distanceMiles: number;
  durationMinutes: number;
  baseFare?: number;
  perMile?: number;
  perMinute?: number;
  taxRate?: number;
}