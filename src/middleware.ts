import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PUBLIC_ROUTES, ROUTE_ACCESS, ROUTES, UserRole } from "@/shared/constants/routes";
import { jwtVerify } from "jose";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;

  const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || "super_secret_key_change_me_in_production"
  );

  // 1. Manejo de la raíz /
  if (pathname === "/") {
    if (token) {
      try {
        await jwtVerify(token, secret);
        return NextResponse.redirect(new URL(ROUTES.ADMIN.TORRE_CONTROL, request.url));
      } catch {
        return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
      }
    }
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
  }

  // 2. Rutas Públicas (ej: /login, /seguimiento/[code])
  const isPublic = PUBLIC_ROUTES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (isPublic) {
    return NextResponse.next();
  }

  // 3. Deny-by-default: Comprobar acceso por mapa de roles declarativo
  const allowedRoles = ROUTE_ACCESS[pathname];
  if (!allowedRoles) {
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
  }

  // 4. Validar presencia de token y verificar firma criptográfica
  if (!token) {
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const userRole = payload.role as UserRole | undefined;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
    }

    return NextResponse.next();
  } catch {
    // Si la firma es inválida, forjada o expirada, expulsar inmediatamente a login
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
  }
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
