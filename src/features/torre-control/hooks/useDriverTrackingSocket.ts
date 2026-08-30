import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { DriverLocationSchema } from "@/features/pedidos/types/pedidos.schemas";
import { authApi } from "@/features/auth/api/auth.api";
import { ROUTES } from "@/shared/constants/routes";

export interface DriverLocation {
  driverId: string;
  latitude: number;
  longitude: number;
  event: string;
  routeAssignmentId?: string;
  updatedAt: Date;
}

export const useDriverTrackingSocket = () => {
  const [locations, setLocations] = useState<Record<string, DriverLocation>>({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!backendUrl) {
      throw new Error("Missing required environment variable: NEXT_PUBLIC_API_URL");
    }

    let token = "";
    if (typeof window !== "undefined") {
      const authStorage = localStorage.getItem("auth-storage");
      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage);
          token = parsed?.state?.token || parsed?.token || "";
        } catch {
          // Token parse error
        }
      }
    }

    // Fallback para desarrollo si no hay token en localStorage
    if (!token && process.env.NEXT_PUBLIC_DEV_MOCK_TOKEN) {
      token = process.env.NEXT_PUBLIC_DEV_MOCK_TOKEN;
    }

    // Si aún no hay token, no intentar conectar para evitar bucles de reconexión fallidos
    if (!token) {
      console.warn("WebSocket Tracking: No token available, skipping connection.");
      return;
    }

    const socket: Socket = io(backendUrl, {
      transports: ["websocket"],
      auth: { token },
    });

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("WebSocket conectado al Gateway de Tracking (unido a operator:live).");
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
      console.log("WebSocket desconectado del Gateway:", reason);
    });

    socket.on("connect_error", async (err) => {
      console.error("Error de conexión WebSocket:", err.message);
      if (err.message?.toLowerCase().includes("jwt") || err.message?.toLowerCase().includes("unauthorized")) {
        try {
          const authStorage = localStorage.getItem("auth-storage");
          if (authStorage) {
            const parsed = JSON.parse(authStorage);
            const refreshToken = parsed?.state?.refreshToken;
            if (refreshToken) {
              const res = await authApi.refresh(refreshToken);
              parsed.state.token = res.token;
              if (res.refreshToken) parsed.state.refreshToken = res.refreshToken;
              localStorage.setItem("auth-storage", JSON.stringify(parsed));
              socket.auth = { token: res.token };
              socket.connect();
            }
          }
        } catch (refreshErr) {
          console.error("Error renovando token para WebSocket (sesión caducada):", refreshErr);
          socket.disconnect();
          if (typeof window !== "undefined") {
            localStorage.removeItem("auth-storage");
            if (!window.location.pathname.includes(ROUTES.LOGIN)) {
              window.location.href = ROUTES.LOGIN;
            }
          }
        }
      }
    });

    socket.on("reconnect", (attempt) => {
      console.log(`WebSocket reconectado con éxito en el intento ${attempt}. Reuniéndose a operator:live.`);
      setIsConnected(true);
    });

    const handleLocationData = (data: any) => {
      if (data) {
        try {
          // Validar de forma estricta el payload del WebSocket
          DriverLocationSchema.parse(data);

          const normalized: DriverLocation = {
            driverId: data.driverId,
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
            event: data.event,
            routeAssignmentId: data.routeAssignmentId,
            updatedAt: new Date(data.updatedAt),
          };

          setLocations((prev) => ({
            ...prev,
            [data.driverId]: normalized,
          }));
        } catch (err) {
          console.error("Error de validación en datos del socket (ZodError):", err);
          // Permitir fallo ruidoso en consola en desarrollo
          if (process.env.NODE_ENV === "development") {
            throw err;
          }
        }
      }
    };

    socket.on("driver:location", handleLocationData);

    return () => {
      socket.disconnect();
    };
  }, []);

  return { locations, isConnected };
};
