import { ORDER_VALIDITY_COLORS, OrderValidityColor } from "../constants/status-colors";
import { parseLocalDate, getLocalEndOfDay } from "./date";

export type OrderValidityStatus = "FRESH" | "WARNING" | "CRITICAL";

export interface OrderValidityInfo {
  status: OrderValidityStatus;
  color: OrderValidityColor;
  label: string;
  percentElapsed: number;
  isOverdue: boolean;
  effectiveDueDate: Date;
}

/**
 * Calcula el estado de vigencia del pedido en base a su fecha de creación y vencimiento.
 * Si dueDate es null/indefinido, asigna como fecha efectiva el fin del día de creación (23:59:59.999)
 * en hora local del cliente para reflejar el ciclo operativo de entrega diario.
 * 
 * Regla de tercios (33.3%):
 * - FRESH (Verde #22C55E): 0% - 33.3% del tiempo transcurrido (Vigente / En plazo).
 * - WARNING (Amarillo #F59E0B): 33.3% - 66.6% del tiempo transcurrido (Por vencer).
 * - CRITICAL (Rojo #EF4444): >66.6% del tiempo transcurrido (Crítico) o fecha ya vencida (Vencido).
 */
export function getOrderValidity(
  createdAt: string | Date | null | undefined,
  dueDate?: string | Date | null | undefined
): OrderValidityInfo {
  const nowMs = Date.now();

  const parsedStart = parseLocalDate(createdAt);
  const startDate = parsedStart || new Date();
  const startMs = startDate.getTime();

  // Fecha límite efectiva: se ancla a las 23:59:59.999 del día de entrega en hora local
  const endDate = getLocalEndOfDay(dueDate || startDate);

  const endMs = endDate.getTime();
  const totalMs = endMs - startMs;

  if (totalMs <= 0 || nowMs >= endMs) {
    return {
      status: "CRITICAL",
      color: ORDER_VALIDITY_COLORS.CRITICAL,
      label: nowMs >= endMs ? "Vencido" : "Crítico",
      percentElapsed: 100,
      isOverdue: nowMs >= endMs,
      effectiveDueDate: endDate,
    };
  }

  const elapsedMs = Math.max(0, nowMs - startMs);
  const ratio = Math.min(1, elapsedMs / totalMs);
  const percentElapsed = Math.round(ratio * 100);

  if (ratio < 0.3333) {
    return {
      status: "FRESH",
      color: ORDER_VALIDITY_COLORS.FRESH,
      label: "Vigente",
      percentElapsed,
      isOverdue: false,
      effectiveDueDate: endDate,
    };
  }

  if (ratio < 0.6666) {
    return {
      status: "WARNING",
      color: ORDER_VALIDITY_COLORS.WARNING,
      label: "Por vencer",
      percentElapsed,
      isOverdue: false,
      effectiveDueDate: endDate,
    };
  }

  return {
    status: "CRITICAL",
    color: ORDER_VALIDITY_COLORS.CRITICAL,
    label: "Crítico",
    percentElapsed,
    isOverdue: false,
    effectiveDueDate: endDate,
  };
}

