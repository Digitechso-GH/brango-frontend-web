/**
 * Módulo Centralizado de Fechas y Horas para BranGo Frontend
 * 
 * Regla: Toda visualización y manipulación de fechas en la interfaz debe
 * utilizar estas funciones para garantizar coherencia en la zona horaria local (Perú / Navegador)
 * y evitar desfases o saltos de día provocados por UTC (toISOString).
 */

/**
 * Parsea de manera segura cualquier fecha (YYYY-MM-DD o ISO timestamp)
 * evitando el salto de día por UTC cuando el string no incluye hora.
 */
export function parseLocalDate(dateInput?: string | Date | null): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }

  const trimmed = dateInput.trim();
  if (!trimmed) return null;

  // Si viene estrictamente en formato YYYY-MM-DD, instanciamos en hora local para no restar horas por UTC
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(trimmed);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Obtiene la fecha de hoy (o de la fecha provista) en formato YYYY-MM-DD
 * respetando la zona horaria local del cliente (no UTC).
 * Ideal para inputs tipo <input type="date"> y filtros de API.
 */
export function getLocalTodayString(dateInput: Date | string = new Date()): string {
  const d = typeof dateInput === "string" ? parseLocalDate(dateInput) : dateInput;
  if (!d || isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Formatea una fecha para mostrar en la interfaz en español (es-PE).
 * Formatos disponibles:
 * - "short": 31/08/2026
 * - "medium": 31 ago. 2026 (por defecto)
 * - "long": 31 de agosto de 2026
 */
export function formatLocalDate(
  dateInput?: string | Date | null,
  options?: {
    format?: "short" | "medium" | "long";
    includeYear?: boolean;
  }
): string {
  const d = parseLocalDate(dateInput);
  if (!d) return "—";

  const { format = "medium", includeYear = true } = options || {};

  if (format === "short") {
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return includeYear ? `${day}/${month}/${d.getFullYear()}` : `${day}/${month}`;
  }

  if (format === "long") {
    return d.toLocaleDateString("es-PE", {
      day: "numeric",
      month: "long",
      year: includeYear ? "numeric" : undefined,
    });
  }

  // format === "medium"
  return d.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    year: includeYear ? "numeric" : undefined,
  });
}

/**
 * Formatea únicamente la hora en la zona horaria local.
 * Por defecto en formato 24h: "19:20". Si hour12: true -> "07:20 p. m."
 */
export function formatLocalTime(
  dateInput?: string | Date | null,
  options?: { hour12?: boolean }
): string {
  const d = parseLocalDate(dateInput);
  if (!d) return "";

  const { hour12 = false } = options || {};
  return d.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12,
  });
}

/**
 * Formatea fecha y hora combinados en español local.
 * Ejemplo: "31 ago. 2026, 19:20"
 */
export function formatLocalDateTime(
  dateInput?: string | Date | null,
  options?: { hour12?: boolean }
): string {
  const d = parseLocalDate(dateInput);
  if (!d) return "—";

  const datePart = formatLocalDate(d, { format: "medium" });
  const timePart = formatLocalTime(d, options);
  return `${datePart}, ${timePart}`;
}
