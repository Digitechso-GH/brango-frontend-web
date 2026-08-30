import api from "@/shared/api/axios";
import { API_ENDPOINTS } from "@/shared/constants/api-endpoints";

export const routesApi = {
  createRoute: async (payload: { name?: string; driverId: string; date: string; assignments: { orderId: string }[] }) => {
    const res = await api.post(API_ENDPOINTS.ROUTES, payload);
    return res.data.data ?? res.data;
  },
};
