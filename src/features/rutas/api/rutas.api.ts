import api from "@/shared/api/axios";
import { API_ENDPOINTS } from "@/shared/constants/api-endpoints";
import { RouteStatus } from "@/shared/constants/route-status";

export interface RouteListItem {
  id: string;
  name: string | null;
  driverId: string;
  driverName: string;
  unit: string | null;
  date: string;
  sequenceIndex: number;
  status: RouteStatus;
  startedAt: string | null;
  completedAt: string | null;
  ordersCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RouteStopDetail {
  id: string;
  orderId: string;
  sequenceIndex: number;
  status: string;
  reasonText: string | null;
  order: {
    id: string;
    code: string;
    waybill?: string | null;
    rawAddress: string;
    formattedAddress?: string | null;
    recipientName?: string | null;
    recipientPhone?: string | null;
    customer?: {
      name?: string;
      company?: {
        name?: string;
      } | null;
    } | null;
  };
}

export interface RouteDetail {
  id: string;
  name: string | null;
  driverId: string;
  driver: {
    id: string;
    unit?: string | null;
    user: {
      name: string;
      email: string;
    };
  };
  date: string;
  sequenceIndex: number;
  status: RouteStatus;
  startedAt: string | null;
  completedAt: string | null;
  assignments: RouteStopDetail[];
  createdAt: string;
  updatedAt: string;
}

export const rutasApi = {
  getRoutes: async (params?: {
    date?: string;
    driverId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const cleanParams: any = { ...params };
    if (cleanParams.status === "ALL" || !cleanParams.status) {
      delete cleanParams.status;
    }
    const res = await api.get(API_ENDPOINTS.ROUTES, { params: cleanParams });
    const payload = res.data.data ?? res.data;
    if (payload && Array.isArray(payload.data)) {
      return payload as { data: RouteListItem[]; meta: { total: number; page: number; limit: number; totalPages: number } };
    }
    const rawData = Array.isArray(payload) ? payload : [];
    return {
      data: rawData as RouteListItem[],
      meta: { total: rawData.length, page: 1, limit: rawData.length, totalPages: 1 },
    };
  },

  getRouteDetail: async (id: string): Promise<RouteDetail> => {
    const res = await api.get(`${API_ENDPOINTS.ROUTES}/${id}`);
    return res.data.data ?? res.data;
  },

  deleteRoute: async (id: string) => {
    const res = await api.delete(`${API_ENDPOINTS.ROUTES}/${id}`);
    return res.data.data ?? res.data;
  },
};
