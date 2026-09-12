import api from "@/shared/api/axios";
import { API_ENDPOINTS } from "@/shared/constants/api-endpoints";
import { SuggestedRoutesResponseSchema, SuggestedRoute } from "../types/suggested-routes.schemas";

export const routesApi = {
  createRoute: async (payload: { name?: string; driverId: string; date: string; assignments: { orderId: string }[] }) => {
    const res = await api.post(API_ENDPOINTS.ROUTES, payload);
    return res.data.data ?? res.data;
  },

  getSuggestedRoutes: async (date?: string): Promise<SuggestedRoute[]> => {
    const params = date ? { date } : {};
    const res = await api.get(API_ENDPOINTS.ROUTES_SUGGESTED, { params });
    const rawData = res.data?.data ?? res.data ?? [];
    return SuggestedRoutesResponseSchema.parse(rawData);
  },
};

