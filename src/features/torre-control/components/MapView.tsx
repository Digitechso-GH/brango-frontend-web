"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/shared/api/axios";
import { IconMapPinFilled } from "@tabler/icons-react";
import { io } from "socket.io-client";

export const MapView = () => {
  const [locations, setLocations] = useState<Record<string, any>>({});

  // 1. Cargar choferes para mapear nombres
  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const res = await api.get("/drivers");
      return res.data.data || [];
    },
  });

  // 2. Escuchar WebSockets para ubicaciones en tiempo real
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";
    const devToken = process.env.NEXT_PUBLIC_DEV_MOCK_TOKEN || "operator-mock-token";
    const socket = io(wsUrl, {
      auth: { token: devToken },
    });

    socket.on("connect", () => {
      console.log("Conectado a Torre de Control Gateway (WebSocket).");
    });

    socket.on("driver_location", (data) => {
      console.log("Ubicación recibida en tiempo real:", data);
      setLocations((prev) => ({
        ...prev,
        [data.driverId]: data,
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const getDriverLabel = (driverId: string) => {
    const driver = drivers.find((d: any) => d.id === driverId);
    if (!driver) return "Chofer";
    const nameParts = (driver.usuario?.nombre || "").split(" ");
    return nameParts[0] || "Chofer";
  };

  const getPercentCoords = (lat?: number, lng?: number) => {
    if (lat === undefined || lng === undefined) {
      return { top: "50%", left: "50%" };
    }
    // Rango de Lima Metropolitana
    const minLat = -12.15;
    const maxLat = -12.0;
    const minLng = -77.1;
    const maxLng = -77.0;

    const boundedLat = Math.max(minLat, Math.min(maxLat, lat));
    const boundedLng = Math.max(minLng, Math.min(maxLng, lng));

    // Latitud sur es minLat (abajo), norte es maxLat (arriba)
    const top = 100 - ((boundedLat - minLat) / (maxLat - minLat)) * 100;
    const left = ((boundedLng - minLng) / (maxLng - minLng)) * 100;

    // Clampear entre 10% y 90% para evitar salirse de los bordes del contenedor
    return {
      top: `${Math.max(10, Math.min(90, top))}%`,
      left: `${Math.max(10, Math.min(90, left))}%`,
    };
  };

  return (
    <div className="bg-gray-100 dark:bg-[#20202A] h-full min-h-[500px] rounded-2xl border border-gray-200 dark:border-[#2D2D3D] flex items-center justify-center relative overflow-hidden">
      <div 
        className="absolute inset-0 opacity-20 dark:opacity-10 pointer-events-none" 
        style={{ 
          backgroundImage: "radial-gradient(#4f46e5 1px, transparent 1px)", 
          backgroundSize: "20px 20px" 
        }}
      />
      
      {Object.keys(locations).length === 0 ? (
        <div className="text-center z-10 flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-white dark:bg-[#1A1A24] rounded-full flex items-center justify-center shadow-lg border border-gray-100 dark:border-[#2D2D3D] text-accent animate-pulse">
            <IconMapPinFilled size={32} />
          </div>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
            Esperando transmisión GPS de choferes activos...
          </p>
        </div>
      ) : (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="absolute bottom-4 left-4 bg-white dark:bg-[#1A1A24] px-3 py-1.5 rounded-lg shadow-md border border-gray-100 dark:border-[#2D2D3D] text-[10px] font-bold text-gray-500">
            🟢 {Object.keys(locations).length} unidad(es) transmitiendo
          </div>
        </div>
      )}

      {/* Renderizar choferes en vivo */}
      {Object.values(locations).map((loc) => {
        const coords = getPercentCoords(loc.latitud, loc.longitud);
        const label = getDriverLabel(loc.driverId);
        return (
          <div 
            key={loc.driverId}
            className="absolute w-10 h-10 -ml-5 -mt-5 flex flex-col items-center justify-center transition-all duration-1000 ease-in-out cursor-default"
            style={{ top: coords.top, left: coords.left }}
          >
            <div className="bg-accent text-white px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider mb-0.5 shadow-sm">
              {label}
            </div>
            <div className="text-accent animate-bounce">
              <IconMapPinFilled size={24} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
