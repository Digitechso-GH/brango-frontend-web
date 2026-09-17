import axios from "axios";
import { API_ENDPOINTS } from "@/shared/constants/api-endpoints";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export interface PublicTrackingData {
  orderId: string;
  code: string;
  publicTrackingToken?: string | null;
  waybill?: string | null;
  status: "PENDING" | "IN_TRANSIT" | "DELIVERED" | "FAILED" | "OBSERVED";
  recipientName?: string | null;
  address: string;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
  originAddress?: string | null;
  originLatitude?: number | null;
  originLongitude?: number | null;
  driver?: {
    name: string;
    unit?: string | null;
  } | null;
  driverLocation?: {
    latitude: number;
    longitude: number;
    updatedAt: string;
  } | null;
  events?: Array<{
    id: string;
    type: string;
    actor: string;
    timestamp: string;
  }>;
  groupedOrders?: Array<{
    code: string;
    waybill: string | null;
  }>;
  createdAt: string;
  updatedAt: string;
}

export const trackingApi = {
  getPublicTracking: async (code: string): Promise<PublicTrackingData> => {
    const res = await axios.get(`${apiUrl}${API_ENDPOINTS.PUBLIC_TRACKING}/${encodeURIComponent(code)}`);
    const payload = res.data.data ?? res.data;

    // El backend SIEMPRE devuelve la estructura anidada { order: {...}, driver: {...} }
    // Mapeamos estrictamente a la interfaz plana PublicTrackingData del frontend
    return {
      orderId: payload.order.id,
      code: payload.order.code,
      publicTrackingToken: payload.order.publicTrackingToken,
      waybill: payload.order.waybill,
      status: payload.order.status,
      recipientName: payload.order.recipientName,
      address: payload.order.formattedAddress || payload.order.rawAddress,
      destinationLatitude: payload.order.latitude,
      destinationLongitude: payload.order.longitude,
      originAddress: payload.originBranch?.address,
      originLatitude: payload.originBranch?.latitude,
      originLongitude: payload.originBranch?.longitude,
      driver: payload.driver,
      driverLocation: payload.driverLocation,
      events: payload.events,
      groupedOrders: [],
      createdAt: payload.order.createdAt,
      updatedAt: payload.order.updatedAt || payload.order.createdAt,
    };
  },
};
