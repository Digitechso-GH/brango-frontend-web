import { ORDER_STATUS, ORDER_STATUS_DETAILS } from "@/shared/constants/order-status";
import { BadgeVariant } from "@/shared/components/ui/Badge";

export function getOrderStatusConfig(estado?: string) {
  const statusKey = (estado || ORDER_STATUS.PENDING) as keyof typeof ORDER_STATUS_DETAILS;
  const details = ORDER_STATUS_DETAILS[statusKey] || ORDER_STATUS_DETAILS.PENDING;

  const variant: BadgeVariant =
    statusKey === ORDER_STATUS.IN_TRANSIT
      ? "warning"
      : statusKey === ORDER_STATUS.DELIVERED
      ? "success"
      : statusKey === ORDER_STATUS.OBSERVED || statusKey === ORDER_STATUS.FAILED
      ? "danger"
      : "default";

  const iconBg =
    statusKey === ORDER_STATUS.IN_TRANSIT
      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-500 fill-amber-500"
      : statusKey === ORDER_STATUS.DELIVERED
      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 fill-emerald-500"
      : statusKey === ORDER_STATUS.OBSERVED || statusKey === ORDER_STATUS.FAILED
      ? "bg-red-100 dark:bg-red-900/30 text-red-500 fill-red-500"
      : "bg-slate-100 dark:bg-slate-800 text-slate-400 fill-slate-400";

  const timelineLabel =
    statusKey === ORDER_STATUS.PENDING
      ? "Pedido registrado en el sistema"
      : statusKey === ORDER_STATUS.IN_TRANSIT
      ? "Pedido en tránsito (En camino)"
      : statusKey === ORDER_STATUS.DELIVERED
      ? "Entregado con éxito (e-POD subida)"
      : statusKey === ORDER_STATUS.OBSERVED
      ? "Pedido marcado como Observado"
      : statusKey === ORDER_STATUS.FAILED
      ? "Entrega fallida"
      : `Estado cambiado a ${statusKey}`;

  return {
    ...details,
    variant,
    iconBg,
    timelineLabel,
    statusKey,
  };
}
