/**
 * Archivo centralizado de rutas de la aplicación Frontend:
 * - APP / ADMIN / LOGIN: Rutas de navegación web de la UI
 * - API: Endpoints de servicios Backend
 */
export const ROUTES = {
  LOGIN: "/login",
  ADMIN: {
    TORRE_CONTROL: "/admin/torre-control",
    PEDIDOS: "/admin/pedidos",
    CARGA_PEDIDOS: "/admin/carga-pedidos",
    CHOFERES: "/admin/choferes",
    CLIENTES: "/admin/clientes",
    CONFIGURACION: "/admin/configuracion",
  },
  APP: {
    LOGIN: "/login",
    ADMIN: {
      TORRE_CONTROL: "/admin/torre-control",
      PEDIDOS: "/admin/pedidos",
      CARGA_PEDIDOS: "/admin/carga-pedidos",
      CHOFERES: "/admin/choferes",
      CLIENTES: "/admin/clientes",
      CONFIGURACION: "/admin/configuracion",
    },
  },
  API: {
    ORDERS: "/orders",
    ORDERS_IMPORT: "/orders/import",
    DRIVERS: "/drivers",
    SEDES: "/sedes",
    CLIENTS: "/clients",
    COMPANIES: "/customers/companies",
    AUTH: {
      LOGIN: "/auth/login",
      REFRESH: "/auth/refresh",
    },
  },
} as const;

export const API_ENDPOINTS = ROUTES.API;
