/**
 * Árbol de navegación de la aplicación — solo para construir links/redirects
 * en el código (Link href, router.push, etc). NO define quién puede acceder
 * a cada ruta — eso vive en ROUTE_ACCESS / PUBLIC_ROUTES, más abajo.
 */
export const ROUTES = {
  LOGIN: "/login",
  ADMIN: {
    TORRE_CONTROL: "/admin/torre-control",
    PEDIDOS: "/admin/pedidos",
    RUTAS: "/admin/rutas",
    CARGA_PEDIDOS: "/admin/carga-pedidos",
    CHOFERES: "/admin/choferes",
    CLIENTES: "/admin/clientes",
    CONFIGURACION: "/admin/configuracion",
  },
  SEGUIMIENTO: (code: string) => `/seguimiento/${code}`,
  API: {
    ORDERS: "/orders",
    ORDERS_IMPORT: "/orders/import",
    ROUTES: "/routes",
    ROUTES_SUGGESTED: "/routes/suggested",
    DRIVERS: "/drivers",
    SEDES: "/sedes",
    CLIENTS: "/clients",
    COMPANIES: "/customers/companies",
    PUBLIC_TRACKING: "/public/tracking",
    AUTH: {
      LOGIN: "/auth/login",
      REFRESH: "/auth/refresh",
      LOGOUT: "/auth/logout",
      ME: "/auth/me",
    },
  },
} as const;

export const API_ENDPOINTS = ROUTES.API;

/**
 * Roles válidos del sistema — única fuente de verdad, evita strings
 * sueltos comparados a mano en distintos archivos.
 */
export enum UserRole {
  SYS_ADMIN = "SYS_ADMIN",
  SYS_OPERATOR = "SYS_OPERATOR",
  SYS_DRIVER = "SYS_DRIVER",
}

/**
 * Rutas de navegación que NO requieren sesión — accesibles por cualquiera.
 * Cualquier pathname que no esté aquí NI en ROUTE_ACCESS queda bloqueado
 * por defecto (deny-by-default) — ver middleware.ts.
 */
export const PUBLIC_ROUTES: readonly string[] = [
  ROUTES.LOGIN,
  "/seguimiento", // prefijo — cubre /seguimiento/[code] dinámico
];

/**
 * Mapa explícito ruta -> roles permitidos. La carpeta donde vive la página
 * (admin/, chofer-portal/, etc.) es irrelevante para la seguridad — solo
 * importa que la ruta esté declarada aquí con los roles correctos.
 */
export const ROUTE_ACCESS: Record<string, readonly UserRole[]> = {
  [ROUTES.ADMIN.TORRE_CONTROL]: [UserRole.SYS_ADMIN, UserRole.SYS_OPERATOR],
  [ROUTES.ADMIN.PEDIDOS]: [UserRole.SYS_ADMIN, UserRole.SYS_OPERATOR],
  [ROUTES.ADMIN.RUTAS]: [UserRole.SYS_ADMIN, UserRole.SYS_OPERATOR],
  [ROUTES.ADMIN.CARGA_PEDIDOS]: [UserRole.SYS_ADMIN, UserRole.SYS_OPERATOR],
  [ROUTES.ADMIN.CHOFERES]: [UserRole.SYS_ADMIN, UserRole.SYS_OPERATOR],
  [ROUTES.ADMIN.CLIENTES]: [UserRole.SYS_ADMIN, UserRole.SYS_OPERATOR],
  [ROUTES.ADMIN.CONFIGURACION]: [UserRole.SYS_ADMIN],
};
