import api from "@/shared/api/axios";
import { API_ENDPOINTS } from "@/shared/constants/api-endpoints";

export const clientesApi = {
  getCompanies: async () => {
    const res = await api.get(API_ENDPOINTS.COMPANIES);
    return res.data.data ?? res.data ?? [];
  },

  createCompany: async (payload: any) => {
    const res = await api.post(API_ENDPOINTS.COMPANIES, payload);
    return res.data.data ?? res.data;
  },

  updateCompany: async (id: string, payload: any) => {
    const res = await api.put(`${API_ENDPOINTS.COMPANIES}/${id}`, payload);
    return res.data.data ?? res.data;
  },

  getClients: async () => {
    const res = await api.get(API_ENDPOINTS.CLIENTS);
    return res.data.data ?? res.data ?? [];
  },
};
