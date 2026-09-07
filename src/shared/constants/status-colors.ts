/**
 * Centralización de la paleta oficial de colores para estados del sistema BranGo.
 */

// 1. Estados de Pedidos (Order / RouteAssignment)
export const ORDER_STATUS_COLORS = {
  PENDING: "#9CA3AF",     // Gris (Sin chofer / Pendiente de despacho)
  IN_TRANSIT: "#F59E0B",  // Ámbar / Naranja (En camino)
  DELIVERED: "#22C55E",   // Verde (Entregado con éxito)
  OBSERVED: "#EF4444",    // Rojo (Intento fallido / Observado)
  FAILED: "#EF4444",      // Rojo (Cancelado o fallido)
} as const;

export type OrderStatusColor = typeof ORDER_STATUS_COLORS[keyof typeof ORDER_STATUS_COLORS];

// 2. Estados de Rutas (Route Header)
export const ROUTE_STATUS_COLORS = {
  PENDING: "#9CA3AF",     // Gris (Ruta creada, no iniciada)
  IN_PROGRESS: "#F59E0B", // Ámbar / Naranja (Ruta en curso)
  COMPLETED: "#22C55E",   // Verde (Jornada completada)
  CANCELLED: "#EF4444",   // Rojo (Ruta cancelada por operador o vaciada)
} as const;

export type RouteStatusColor = typeof ROUTE_STATUS_COLORS[keyof typeof ROUTE_STATUS_COLORS];

// Alias general para pedidos (compatibilidad con especificación)
export const STATUS_COLORS = ORDER_STATUS_COLORS;

// 3. Color corporativo oficial de BranGo para unidades / vehículos
// Confirmado en globals.css (--color-blue-600), icon.svg, logotipos y SVGs
export const VEHICLE_MARKER_COLOR = "#3D5FFF";
