import api from "@/shared/api/axios";
import { API_ENDPOINTS } from "@/shared/constants/api-endpoints";
import { OrderSchema, RouteAssignmentSchema } from "../types/pedidos.schemas";
import { z } from "zod";

const normalizeDriver = (raw: any) => {
  if (!raw) return null;
  const canonicalId = raw.id || raw.driverId;
  return {
    id: canonicalId,
    userId: raw.userId || raw.user?.id || canonicalId,
    name: raw.user?.name || raw.name || "Chofer",
    unit: raw.unit || null,
    latitude: raw.latitude !== null && raw.latitude !== undefined ? Number(raw.latitude) : null,
    longitude: raw.longitude !== null && raw.longitude !== undefined ? Number(raw.longitude) : null,
  };
};

const normalizeOrder = (raw: any) => {
  if (!raw) return null;

  // 1. Validar estrictamente los contratos recibidos desde el Backend
  OrderSchema.parse(raw);
  if (raw.assignments) {
    z.array(RouteAssignmentSchema).parse(raw.assignments);
  }

  // Asignación activa: siempre ordenar explícitamente por createdAt desc para asegurar robustez
  let activeAssignment = undefined;
  if (raw.assignments && raw.assignments.length > 0) {
    const sortedAssignments = [...raw.assignments].sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    activeAssignment = sortedAssignments[0];
  }
  const driverObj = activeAssignment?.driver ? normalizeDriver(activeAssignment.driver) : null;
  const canonicalDriverId = activeAssignment?.driverId || null;
  const status = activeAssignment?.status || "PENDING";
  const sequenceIndex = activeAssignment?.sequenceIndex ?? 0;
  
  // Regla estricta: reasonText solo si la asignación activa está OBSERVED
  const reasonText = activeAssignment?.status === "OBSERVED" ? (activeAssignment.reasonText || null) : null;

  return {
    ...raw,
    routeAssignmentId: activeAssignment?.id || null,
    driverId: canonicalDriverId,
    driver: driverObj,
    status: status,
    sequenceIndex: sequenceIndex,
    reasonText: reasonText,
    latitude: raw.latitude !== null && raw.latitude !== undefined ? Number(raw.latitude) : null,
    longitude: raw.longitude !== null && raw.longitude !== undefined ? Number(raw.longitude) : null,
    originLatitude: activeAssignment?.originLatitude !== null && activeAssignment?.originLatitude !== undefined ? Number(activeAssignment.originLatitude) : null,
    originLongitude: activeAssignment?.originLongitude !== null && activeAssignment?.originLongitude !== undefined ? Number(activeAssignment.originLongitude) : null,
  };
};

export const pedidosApi = {
  getOrders: async (params?: { search?: string; page?: number; limit?: number; driverId?: string }) => {
    const res = await api.get(API_ENDPOINTS.ORDERS, { params });
    const payload = res.data.data ?? res.data;
    
    // Si viene del backend como { data, meta }
    if (payload && Array.isArray(payload.data)) {
      return {
        data: payload.data.map(normalizeOrder),
        meta: payload.meta,
      };
    }
    
    // Fallback de seguridad
    const rawData = Array.isArray(payload) ? payload : [];
    return {
      data: rawData.map(normalizeOrder),
      meta: { total: rawData.length, page: 1, limit: rawData.length, totalPages: 1 }
    };
  },

  getOrdersToday: async (driverId?: string) => {
    const params = driverId ? { driverId } : {};
    const res = await api.get(`${API_ENDPOINTS.ORDERS}/today`, { params });
    const payload = res.data.data ?? res.data;
    if (payload && Array.isArray(payload.data)) {
      return {
        data: payload.data.map(normalizeOrder),
        meta: payload.meta,
      };
    }
    const rawData = Array.isArray(payload) ? payload : [];
    return {
      data: rawData.map(normalizeOrder),
      meta: { total: rawData.length, page: 1, limit: rawData.length, totalPages: 1 }
    };
  },

  getOrderDetail: async (id: string) => {
    const res = await api.get(`${API_ENDPOINTS.ORDERS}/${id}`);
    const raw = res.data.data ?? res.data;
    return normalizeOrder(raw);
  },

  getDrivers: async () => {
    const res = await api.get(API_ENDPOINTS.DRIVERS);
    const rawData = res.data.data ?? res.data ?? [];
    return Array.isArray(rawData) ? rawData.map(normalizeDriver) : [];
  },

  getSedes: async () => {
    const res = await api.get(API_ENDPOINTS.SEDES);
    return res.data.data ?? res.data ?? [];
  },

  createOrder: async (payload: any) => {
    const res = await api.post(API_ENDPOINTS.ORDERS, payload);
    return normalizeOrder(res.data.data ?? res.data);
  },

  updateOrder: async (id: string, payload: any) => {
    const res = await api.put(`${API_ENDPOINTS.ORDERS}/${id}`, payload);
    return normalizeOrder(res.data.data ?? res.data);
  },

  updateOrderStatus: async (id: string, status: string) => {
    const res = await api.put(`${API_ENDPOINTS.ORDERS}/${id}/status`, { status });
    return normalizeOrder(res.data.data ?? res.data);
  },

  assignDriver: async (orderId: string, driverId: string) => {
    const res = await api.put(`${API_ENDPOINTS.ORDERS}/${orderId}`, { driverId });
    return normalizeOrder(res.data.data ?? res.data);
  },

  assignDriverToMultiple: async (orderIds: string[], driverId: string) => {
    return Promise.all(
      orderIds.map((id) => pedidosApi.assignDriver(id, driverId))
    );
  },

  importOrdersExcel: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post(API_ENDPOINTS.ORDERS_IMPORT, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data.data ?? res.data;
  },

  reassignOrder: async (
    routeAssignmentId: string,
    payload: { driverId: string; vehicleId?: string; date: string }
  ) => {
    const res = await api.post(`${API_ENDPOINTS.ORDERS}/${routeAssignmentId}/reassign`, payload);
    return res.data.data ?? res.data;
  },
};
