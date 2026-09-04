import { formatLocalDateTime, getLocalTodayString, formatLocalDate, formatLocalTime, parseLocalDate } from "./date";

/**
 * @deprecated Usa formatLocalDateTime o formatLocalDate de "@/shared/utils/date"
 */
export function formatOrderDate(dateInput?: string | Date | null): string | null {
  if (!dateInput) return null;
  const result = formatLocalDateTime(dateInput, { hour12: true });
  return result === "—" ? null : result;
}

export { getLocalTodayString, formatLocalDate, formatLocalTime, formatLocalDateTime, parseLocalDate };
