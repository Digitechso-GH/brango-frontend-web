import api from "@/shared/api/axios";
import { API_ENDPOINTS } from "@/shared/constants/api-endpoints";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    driverId?: string;
    unit?: string;
  };
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const res = await api.post(API_ENDPOINTS.AUTH.LOGIN, payload);
    const data = res.data.data ?? res.data;
    const rawUser = data.user || {};
    return {
      token: data.token,
      refreshToken: data.refreshToken,
      user: {
        id: rawUser.id,
        name: rawUser.name || "",
        email: rawUser.email,
        role: rawUser.role || rawUser.rol || "",
        driverId: rawUser.driverId,
        unit: rawUser.unit,
      }
    };
  },

  refresh: async (refreshToken: string): Promise<{ token: string; refreshToken: string }> => {
    const res = await api.post(API_ENDPOINTS.AUTH.REFRESH, { refreshToken });
    const data = res.data.data ?? res.data;
    return {
      token: data.token,
      refreshToken: data.refreshToken,
    };
  },

  logout: async (): Promise<void> => {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch {
      // Ignorar error de red si ya expiró
    }
  },
};
