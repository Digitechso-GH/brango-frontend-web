import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  driverId?: string;
  unit?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hasHydrated: false,
      setHasHydrated: (state) => set({ hasHydrated: state }),
      setAuth: (token, user) => set({ token, user }),
      logout: () => {
        set({ token: null, user: null });
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth-storage");
        }
      },
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
