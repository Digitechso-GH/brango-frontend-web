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
    color: "#64748B",
    badgeBg: "bg-gray-100 dark:bg-gray-800",
    badgeText: "text-gray-700 dark:text-gray-300",
  },
  IN_TRANSIT: {
    label: "En camino",
    color: "#F59E0B",
    badgeBg: "bg-amber-100 dark:bg-amber-900/30",
    badgeText: "text-amber-700 dark:text-amber-400",
  },
  DELIVERED: {
    label: "Entregado",
    color: "#10B981",
    badgeBg: "bg-emerald-100 dark:bg-emerald-900/30",
    badgeText: "text-emerald-700 dark:text-emerald-400",
  },
  FAILED: {
    label: "Fallido",
    color: "#EF4444",
    badgeBg: "bg-red-100 dark:bg-red-900/30",
    badgeText: "text-red-700 dark:text-red-400",
  },
  OBSERVED: {
    label: "Observado",
    color: "#EF4444",
    badgeBg: "bg-red-100 dark:bg-red-900/30",
    badgeText: "text-red-700 dark:text-red-400",
  },
};

export const ORDER_STATUS_FILTER_OPTIONS = [
  { label: "Estado: Todos", value: "all" },
  { label: "Pendientes", value: "pendiente" },
  { label: "En Camino", value: "en_camino" },
  { label: "Entregados", value: "entregado" },
  { label: "Fallidos", value: "fallido" },
];

export const FRONTEND_TO_BACKEND_STATUS_MAP: Record<string, string> = {
  pendiente: ORDER_STATUS.PENDING,
  en_camino: ORDER_STATUS.IN_TRANSIT,
  entregado: ORDER_STATUS.DELIVERED,
  fallido: ORDER_STATUS.FAILED,
};
