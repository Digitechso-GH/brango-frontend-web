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
  refreshToken: string | null;
  user: User | null;
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setAuth: (token: string, refreshToken: string, user: User) => void;
  updateToken: (token: string, refreshToken?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      hasHydrated: false,
      setHasHydrated: (state) => set({ hasHydrated: state }),
      setAuth: (token, refreshToken, user) => set({ token, refreshToken, user }),
      updateToken: (token, refreshToken) => set((state) => ({ token, refreshToken: refreshToken || state.refreshToken })),
      logout: () => {
        set({ token: null, refreshToken: null, user: null });
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
