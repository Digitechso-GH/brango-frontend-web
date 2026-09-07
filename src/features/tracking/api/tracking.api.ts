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
    return res.data.data ?? res.data;
  },
};
