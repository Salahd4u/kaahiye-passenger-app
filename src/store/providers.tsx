'use client';

import { useAuthStore } from './authStore';
import { useRideStore } from './rideStore';

export function AppProviders({ children }: { children: React.ReactNode }) {
  // Hooks are invoked so Zustand stores are initialized within the provider tree.
  useAuthStore();
  useRideStore();
  return <>{children}</>;
}