import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PUBLIC_ROUTES, ROUTE_ACCESS, ROUTES, UserRole } from "@/shared/constants/routes";
import { decodeJwt } from "jose";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;

  // Decodificar y validar estructura y vigencia del token
  const getValidPayload = (jwtToken: string) => {
    try {
      const payload = decodeJwt(jwtToken);
      if (!payload || !payload.exp) return null;
      if (Date.now() >= payload.exp * 1000) return null;
      return payload;
    } catch {
      return null;
    }
  };

  const payload = token ? getValidPayload(token) : null;

  // 1. Manejo de la raíz /
  if (pathname === "/") {
    if (payload) {
      return NextResponse.redirect(new URL(ROUTES.ADMIN.TORRE_CONTROL, request.url));
    }
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
  }

  // 2. Rutas Públicas (ej: /login, /seguimiento/[code])
  const isPublic = PUBLIC_ROUTES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (isPublic) {
    if (pathname === ROUTES.LOGIN && payload) {
      return NextResponse.redirect(new URL(ROUTES.ADMIN.TORRE_CONTROL, request.url));
    }
    return NextResponse.next();
  }

  // 3. Deny-by-default: Comprobar acceso por mapa de roles declarativo
  const allowedRoles = ROUTE_ACCESS[pathname];
  if (!allowedRoles) {
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
  }

  // 4. Validar presencia de token y vigencia
  if (!payload) {
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
  }

  // 5. Validar autorización por rol
  const userRole = payload.role as UserRole | undefined;
  if (!userRole || !allowedRoles.includes(userRole)) {
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.svg y archivos estáticos de medios
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
