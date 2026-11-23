import { ORDER_STATUS_COLORS } from "./status-colors";
import { getLocalTodayString } from "../utils/date";

export const ORDER_STATUS = {
  PENDING: "PENDING",
  IN_TRANSIT: "IN_TRANSIT",
  DELIVERED: "DELIVERED",
  FAILED: "FAILED",
  OBSERVED: "OBSERVED",
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_DETAILS: Record<
  string,
  { label: string; color: string; badgeBg: string; badgeText: string }
> = {
  PENDING: {
    label: "Pendiente",
    color: ORDER_STATUS_COLORS.PENDING,
    badgeBg: "bg-gray-100 dark:bg-gray-800",
    badgeText: "text-gray-700 dark:text-gray-300",
  },
  IN_TRANSIT: {
    label: "En camino",
    color: ORDER_STATUS_COLORS.IN_TRANSIT,
    badgeBg: "bg-amber-100 dark:bg-amber-900/30",
    badgeText: "text-amber-700 dark:text-amber-400",
  },
  DELIVERED: {
    label: "Entregado",
    color: ORDER_STATUS_COLORS.DELIVERED,
    badgeBg: "bg-emerald-100 dark:bg-emerald-900/30",
    badgeText: "text-emerald-700 dark:text-emerald-400",
  },
  FAILED: {
    label: "Fallido",
    color: ORDER_STATUS_COLORS.FAILED,
    badgeBg: "bg-red-100 dark:bg-red-900/30",
    badgeText: "text-red-700 dark:text-red-400",
  },
  OBSERVED: {
    label: "Observado",
    color: ORDER_STATUS_COLORS.OBSERVED,
    badgeBg: "bg-red-100 dark:bg-red-900/30",
    badgeText: "text-red-700 dark:text-red-400",
  },
};

export const ORDER_STATUS_FILTER_OPTIONS = [
  { label: "Estado: Todos", value: "all" },
  { label: "Pendientes", value: "pendiente" },
  { label: "En Camino", value: "en_camino" },
  { label: "Entregados", value: "entregado" },
  { label: "Observados", value: "observado" },
];

export const FRONTEND_TO_BACKEND_STATUS_MAP: Record<string, string> = {
  pendiente: ORDER_STATUS.PENDING,
  en_camino: ORDER_STATUS.IN_TRANSIT,
  entregado: ORDER_STATUS.DELIVERED,
  observado: ORDER_STATUS.OBSERVED,
};

/**
 * Determina si un pedido está pendiente de asignación a ruta para hoy.
 * - PENDING sin ruta, chofer ni asignación activa -> true
 * - OBSERVED de un día anterior (reintento por reasignar) -> true
 * - DELIVERED, IN_TRANSIT, FAILED o ya asignados hoy -> false
 */
export const isOrderUnassignedForToday = (
  order: any,
  todayStr: string = getLocalTodayString(),
): boolean => {
  if (!order) return false;

  if (order.status === ORDER_STATUS.OBSERVED) {
    const latestAssignment = order.assignments?.[0];
    if (latestAssignment?.date) {
      const assignmentDateStr = getLocalTodayString(latestAssignment.date);
      if (assignmentDateStr === todayStr) {
        return false;
      }
    }
    return true;
  }

  if (order.status === ORDER_STATUS.PENDING) {
    return !order.routeId && !order.driverId && !order.routeAssignmentId;
  }

  return false;
};
