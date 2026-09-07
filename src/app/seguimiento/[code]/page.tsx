"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { trackingApi, PublicTrackingData } from "@/features/tracking/api/tracking.api";
import { ORDER_STATUS_DETAILS } from "@/shared/constants/order-status";
import { ORDER_STATUS_COLORS, VEHICLE_MARKER_COLOR } from "@/shared/constants/status-colors";
import { loadGoogleMapsLibrary } from "@/shared/integrations/google/google-maps.loader";
import { io, Socket } from "socket.io-client";
import { 
  IconMapPin, 
  IconTruck, 
  IconCheck, 
  IconClock, 
  IconAlertCircle, 
  IconPackage, 
  IconUser, 
  IconSteeringWheel,
  IconMapPinFilled,
  IconRefresh,
  IconCalendar,
  IconChevronRight
} from "@tabler/icons-react";

export default function PublicTrackingPage() {
  const params = useParams();
  const code = (params?.code as string) || "";

  const [order, setOrder] = useState<PublicTrackingData | null>(null);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const googleMapInstance = useRef<google.maps.Map | null>(null);
  const driverMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  // 1. Cargar datos del pedido público
  const fetchTracking = async () => {
    if (!code) return;
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await trackingApi.getPublicTracking(code);
      setOrder(data);

      if (data.driverLocation?.latitude && data.driverLocation?.longitude) {
        setDriverPos({
          lat: data.driverLocation.latitude,
          lng: data.driverLocation.longitude,
        });
      }
    } catch (err: any) {
      console.error("Error al obtener seguimiento:", err);
      setErrorMessage(
        err.response?.data?.message ||
        "No pudimos encontrar un pedido con este código. Verifica el número e intenta nuevamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
  }, [code]);

  // 2. Conectar a Socket.io para tracking en tiempo real
  useEffect(() => {
    if (!order?.orderId) return;

    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!backendUrl) return;

    const socket: Socket = io(backendUrl, {
      transports: ["websocket", "polling"],
      auth: { trackingToken: order.publicTrackingToken || code },
      query: { trackingToken: order.publicTrackingToken || code },
    });

    socket.on("connect", () => {
      setIsSocketConnected(true);
    });

    socket.on("disconnect", () => {
      setIsSocketConnected(false);
    });

    socket.on("driver:location", (data: any) => {
      if (data.latitude && data.longitude) {
        setDriverPos({
          lat: Number(data.latitude),
          lng: Number(data.longitude),
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [order?.orderId]);

  // 3. Inicializar Google Maps
  useEffect(() => {
    if (!mapRef.current || !order) return;

    let isCancelled = false;

    const initMap = async () => {
      try {
        const { Map } = await loadGoogleMapsLibrary<typeof google.maps>("maps");
        const { AdvancedMarkerElement } = await loadGoogleMapsLibrary<any>("marker");
        const { DirectionsService, DirectionsRenderer } = await loadGoogleMapsLibrary<any>("routes");

        if (isCancelled || !mapRef.current) return;

        const defaultCenter = {
          lat: order.destinationLatitude || -12.046374,
          lng: order.destinationLongitude || -77.042793,
        };

        const map = new Map(mapRef.current, {
          center: defaultCenter,
          zoom: 14,
          mapId: "PUBLIC_TRACKING_MAP",
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        });

        googleMapInstance.current = map;

        // Marcador de Destino
        if (order.destinationLatitude && order.destinationLongitude) {
          const pinColor = ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS] || ORDER_STATUS_COLORS.PENDING;
          const destPin = document.createElement("div");
          destPin.innerHTML = `
            <div style="background: ${pinColor}; color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); border: 2px solid white;">
              📍
            </div>
          `;
          const destMarker = new AdvancedMarkerElement({
            position: { lat: order.destinationLatitude, lng: order.destinationLongitude },
            map,
            title: order.address,
            content: destPin,
          });
          destMarkerRef.current = destMarker;
        }

        // Si está en tránsito y hay chofer, renderizar marcador de chofer y polilínea
        if (order.status === "IN_TRANSIT" && driverPos) {
          const driverPin = document.createElement("div");
          driverPin.innerHTML = `
            <div style="background: ${VEHICLE_MARKER_COLOR}; color: white; border-radius: 50%; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 16px rgba(61, 95, 255, 0.5); border: 2px solid white; animation: pulse 2s infinite;">
              🚚
            </div>
          `;
          const driverMarker = new AdvancedMarkerElement({
            position: driverPos,
            map,
            title: order.driver?.name || "Chofer en camino",
            content: driverPin,
          });
          driverMarkerRef.current = driverMarker;

          // Dibujar ruta entre chofer y destino
          if (order.destinationLatitude && order.destinationLongitude) {
            const directionsService = new DirectionsService();
            const directionsRenderer = new DirectionsRenderer({
              map,
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: VEHICLE_MARKER_COLOR,
                strokeWeight: 5,
                strokeOpacity: 0.8,
              },
            });
            directionsRendererRef.current = directionsRenderer;

            directionsService.route(
              {
                origin: driverPos,
                destination: { lat: order.destinationLatitude, lng: order.destinationLongitude },
                travelMode: google.maps.TravelMode.DRIVING,
              },
              (result: any, status: any) => {
                if (status === google.maps.DirectionsStatus.OK && result) {
                  directionsRenderer.setDirections(result);
                }
              }
            );
          }
        }
      } catch (err) {
        console.error("Error al inicializar mapa:", err);
      }
    };

    initMap();

    return () => {
      isCancelled = true;
    };
  }, [order?.orderId]);

  // 4. Actualizar posición del chofer en el mapa cuando cambie por socket
  useEffect(() => {
    if (driverMarkerRef.current && driverPos) {
      driverMarkerRef.current.position = driverPos;
    }
  }, [driverPos]);

  const statusConfig = order ? ORDER_STATUS_DETAILS[order.status] || ORDER_STATUS_DETAILS.PENDING : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F0F17] text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white dark:bg-[#1A1A24] border-b border-slate-200 dark:border-slate-800 px-6 py-4 shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <IconMapPinFilled size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight flex items-center gap-1">
                Bran<span className="text-blue-600 dark:text-blue-400">Go</span>
                <span className="text-xs font-semibold px-2 py-0.5 ml-2 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800">
                  Seguimiento
                </span>
              </h1>
            </div>
          </div>

          {order && (
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isSocketConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
                {isSocketConnected ? "En vivo" : "Conectando..."}
              </span>
              <button 
                onClick={fetchTracking}
                className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors ml-2"
                title="Actualizar estado"
              >
                <IconRefresh size={18} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-500">Cargando información del pedido...</p>
          </div>
        ) : errorMessage ? (
          <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <div className="bg-white dark:bg-[#1A1A24] border border-red-200 dark:border-red-900/40 rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <IconAlertCircle size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Pedido No Encontrado</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                {errorMessage}
              </p>
              <a
                href="/login"
                className="inline-flex items-center justify-center w-full px-4 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-md shadow-blue-600/20"
              >
                Ir al Inicio
              </a>
            </div>
          </div>
        ) : order ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Status & Details */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Order Status Card */}
              <div className="bg-white dark:bg-[#1A1A24] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nº de Pedido</span>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      #{order.code}
                    </h2>
                    {order.waybill && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        Guía: {order.waybill}
                      </p>
                    )}
                  </div>
                  {statusConfig && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig.badgeBg} ${statusConfig.badgeText}`}>
                      {statusConfig.label}
                    </span>
                  )}
                </div>

                {/* Pedidos consolidados en esta entrega (del mismo cliente) */}
                {order.groupedOrders && order.groupedOrders.length > 0 && (
                  <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-3.5 flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                      Entrega consolidada multi-pedido
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Esta misma visita incluye tus pedidos:{" "}
                      <span className="font-bold text-slate-900 dark:text-white">
                        #{order.code}, {order.groupedOrders.map((g) => `#${g.code}${g.waybill ? ` (${g.waybill})` : ""}`).join(", ")}
                      </span>
                    </p>
                  </div>
                )}

                {/* Progress Stepper */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-5">
                  <div className="flex items-center justify-between relative">
                    <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-slate-100 dark:bg-slate-800 -z-0" />
                    
                    {/* Step 1: Registrado */}
                    <div className="flex flex-col items-center gap-2 z-10">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-blue-600/30">
                        <IconCheck size={16} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Registrado</span>
                    </div>

                    {/* Step 2: En Camino */}
                    <div className="flex flex-col items-center gap-2 z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        order.status === "IN_TRANSIT"
                          ? "bg-amber-500 text-white ring-4 ring-amber-100 dark:ring-amber-900/40 animate-pulse"
                          : order.status === "DELIVERED"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                      }`}>
                        <IconTruck size={16} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">En Camino</span>
                    </div>

                    {/* Step 3: Entregado */}
                    <div className="flex flex-col items-center gap-2 z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        order.status === "DELIVERED"
                          ? "bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-900/40"
                          : order.status === "FAILED" || order.status === "OBSERVED"
                          ? "bg-red-500 text-white"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                      }`}>
                        <IconCheck size={16} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {order.status === "OBSERVED" ? "Observado" : order.status === "FAILED" ? "Fallido" : "Entregado"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Info Card */}
              <div className="bg-white dark:bg-[#1A1A24] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Detalles de la Entrega
                </h3>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <IconMapPin size={20} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-medium">Destino</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {order.address}
                    </p>
                    {order.recipientName && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Destinatario: {order.recipientName}
                      </p>
                    )}
                  </div>
                </div>

                {order.driver && (
                  <div className="flex items-start gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <IconSteeringWheel size={20} />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-medium">Conductor Asignado</span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {order.driver.name}
                      </p>
                      {order.driver.unit && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Unidad: {order.driver.unit}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Live Map */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="bg-white dark:bg-[#1A1A24] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col h-[520px]">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconMapPin size={18} className="text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Ubicación del Envío
                    </h3>
                  </div>
                  {order.status === "IN_TRANSIT" && (
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                      Chofer en ruta
                    </span>
                  )}
                </div>

                <div ref={mapRef} className="flex-1 w-full bg-slate-100 dark:bg-slate-900" />
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
