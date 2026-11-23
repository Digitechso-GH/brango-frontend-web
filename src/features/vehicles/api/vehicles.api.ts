import api from "@/shared/api/axios";
import { API_ENDPOINTS } from "@/shared/constants/api-endpoints";

export interface VehicleRecord {
  id: string;
  plate: string;
  brand?: string | null;
  model?: string | null;
  axles?: number | null;
  capacityKg?: number | null;
  capacityM3?: number | null;
  vehicleType: string;
  active: boolean;
}

export const vehiclesApi = {
  getVehicles: async (): Promise<VehicleRecord[]> => {
    const res = await api.get(API_ENDPOINTS.VEHICLES);
    return res.data.data ?? res.data ?? [];
  },

  getAvailableVehicles: async (date?: string, excludeRouteId?: string): Promise<VehicleRecord[]> => {
    const params: Record<string, string> = {};
    if (date) params.date = date;
    if (excludeRouteId) params.excludeRouteId = excludeRouteId;
    const res = await api.get(`${API_ENDPOINTS.VEHICLES}/available`, { params });
    return res.data.data ?? res.data ?? [];
  },

  createVehicle: async (payload: Partial<VehicleRecord>) => {
    const res = await api.post(API_ENDPOINTS.VEHICLES, payload);
    return res.data.data ?? res.data;
  },

  updateVehicle: async (id: string, payload: Partial<VehicleRecord>) => {
    const res = await api.put(`${API_ENDPOINTS.VEHICLES}/${id}`, payload);
    return res.data.data ?? res.data;
  },
};
