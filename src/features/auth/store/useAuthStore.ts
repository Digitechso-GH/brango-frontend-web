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
      setAuth: (token, refreshToken, user) => {
        set({ token, refreshToken, user });
        if (typeof window !== "undefined") {
          document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax;`;
        }
      },
      updateToken: (token, refreshToken) => {
        set((state) => ({ token, refreshToken: refreshToken || state.refreshToken }));
        if (typeof window !== "undefined") {
          document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax;`;
        }
      },
      logout: () => {
        set({ token: null, refreshToken: null, user: null });
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth-storage");
          document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;";
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
