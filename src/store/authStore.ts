import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Passenger } from '@/types';
import { FAKE_PASSENGER } from '@/mock/destinations';

interface AuthStore {
  isAuthenticated: boolean;
  passenger: Passenger | null;
  loading: boolean;
  error: string | null;
  signUp: (data: { firstName: string; lastName: string; email: string; password: string }) => Promise<void>;
  signIn: (data: { email: string; password: string }) => Promise<void>;
  signOut: () => void;
  updateProfile: (updates: Partial<Passenger>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      passenger: null,
      loading: false,
      error: null,

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      signUp: async (data) => {
        set({ loading: true, error: null });
        // Simulate network delay
        await new Promise((r) => setTimeout(r, 800));
        const passenger: Passenger = {
          ...FAKE_PASSENGER,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          id: `psg_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set({ isAuthenticated: true, passenger, loading: false, error: null });
      },

      signIn: async (data) => {
        set({ loading: true, error: null });
        await new Promise((r) => setTimeout(r, 600));
        if (!data.email || !data.password) {
          set({
            loading: false,
            error: 'Email and password are required.',
          });
          return;
        }
        const passenger: Passenger = {
          ...FAKE_PASSENGER,
          email: data.email,
          id: `psg_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set({ isAuthenticated: true, passenger, loading: false, error: null });
      },

      signOut: () => {
        set({ isAuthenticated: false, passenger: null, loading: false, error: null });
      },

      updateProfile: (updates) => {
        set((state) => ({
          passenger: state.passenger ? { ...state.passenger, ...updates, updatedAt: new Date().toISOString() } : null,
        }));
      },
    }),
    {
      name: 'kaahiye-auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated, passenger: state.passenger }),
    },
  ),
);