export const ROUTE_STATUS = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const;

export type RouteStatus = typeof ROUTE_STATUS[keyof typeof ROUTE_STATUS];

export const ROUTE_STATUS_DETAILS: Record<
  RouteStatus,
  { label: string; color: string; badgeBg: string; badgeText: string }
> = {
  PENDING: {
    label: "Pendiente",
    color: "#64748B",
    badgeBg: "bg-slate-100 dark:bg-slate-800",
    badgeText: "text-slate-700 dark:text-slate-300",
  },
  IN_PROGRESS: {
    label: "En Progreso",
    color: "#F59E0B",
    badgeBg: "bg-amber-100 dark:bg-amber-900/30",
    badgeText: "text-amber-700 dark:text-amber-400",
  },
  COMPLETED: {
    label: "Completada",
    color: "#10B981",
    badgeBg: "bg-emerald-100 dark:bg-emerald-900/30",
    badgeText: "text-emerald-700 dark:text-emerald-400",
  },
};

export const ROUTE_STATUS_FILTER_OPTIONS = [
  { label: "Estado: Todos", value: "ALL" },
  { label: "Pendientes", value: ROUTE_STATUS.PENDING },
  { label: "En Progreso", value: ROUTE_STATUS.IN_PROGRESS },
  { label: "Completadas", value: ROUTE_STATUS.COMPLETED },
];
