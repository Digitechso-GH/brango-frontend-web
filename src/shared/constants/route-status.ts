import { ROUTE_STATUS_COLORS } from "./status-colors";

export const ROUTE_STATUS = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type RouteStatus = typeof ROUTE_STATUS[keyof typeof ROUTE_STATUS];

export const ROUTE_STATUS_DETAILS: Record<
  RouteStatus,
  { label: string; color: string; badgeBg: string; badgeText: string }
> = {
  PENDING: {
    label: "Pendiente",
    color: ROUTE_STATUS_COLORS.PENDING,
    badgeBg: "bg-slate-100 dark:bg-slate-800",
    badgeText: "text-slate-700 dark:text-slate-300",
  },
  IN_PROGRESS: {
    label: "En Progreso",
    color: ROUTE_STATUS_COLORS.IN_PROGRESS,
    badgeBg: "bg-amber-100 dark:bg-amber-900/30",
    badgeText: "text-amber-700 dark:text-amber-400",
  },
  COMPLETED: {
    label: "Completada",
    color: ROUTE_STATUS_COLORS.COMPLETED,
    badgeBg: "bg-emerald-100 dark:bg-emerald-900/30",
    badgeText: "text-emerald-700 dark:text-emerald-400",
  },
  CANCELLED: {
    label: "Cancelada",
    color: ROUTE_STATUS_COLORS.CANCELLED,
    badgeBg: "bg-red-100 dark:bg-red-900/30",
    badgeText: "text-red-700 dark:text-red-400",
  },
};

export const ROUTE_STATUS_FILTER_OPTIONS = [
  { label: "Estado: Todos", value: "ALL" },
  { label: "Pendientes", value: ROUTE_STATUS.PENDING },
  { label: "En Progreso", value: ROUTE_STATUS.IN_PROGRESS },
  { label: "Completadas", value: ROUTE_STATUS.COMPLETED },
  { label: "Canceladas", value: ROUTE_STATUS.CANCELLED },
];
