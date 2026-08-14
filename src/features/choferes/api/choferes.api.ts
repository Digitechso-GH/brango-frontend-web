import api from "@/shared/api/axios";
import { API_ENDPOINTS } from "@/shared/constants/api-endpoints";

export const choferesApi = {
  getDrivers: async () => {
    const res = await api.get(API_ENDPOINTS.DRIVERS);
    return res.data.data ?? res.data ?? [];
  },

  createDriver: async (payload: any) => {
    const res = await api.post(API_ENDPOINTS.DRIVERS, payload);
    return res.data.data ?? res.data;
  },

  updateDriver: async (id: string, payload: any) => {
    const res = await api.put(`${API_ENDPOINTS.DRIVERS}/${id}`, payload);
    return res.data.data ?? res.data;
  },
};
