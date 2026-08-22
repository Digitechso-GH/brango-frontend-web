"use client";

import React, { useState, useEffect, useRef } from "react";
import { GoogleMapView } from "@/shared/integrations/google/components/GoogleMapView";
import { useDriverTrackingSocket } from "../hooks/useDriverTrackingSocket";
import { useMapRoute } from "../hooks/useMapRoute";
import { useDriversQuery, usePedidosTodayQuery, useSedesQuery } from "@/features/pedidos/hooks/usePedidosQueries";
import { ORDER_STATUS_DETAILS } from "@/shared/constants/order-status";

interface MapViewProps {
  focusedOrder?: any | null;
}

const TRUCK_MARKER_HTML = (color: string) => `
  <div style="background: ${color}; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 14px rgba(0,0,0,0.35); cursor: pointer;">
    <span style="font-size: 22px; line-height: 1;">🚚</span>
  </div>
`;

const DESTINATION_MARKER_HTML = (color: string) => `
  <div style="background: ${color}; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); cursor: pointer;">
    <span style="font-size: 18px; line-height: 1;">📍</span>
  </div>
`;

function createAdvancedMarker(options: {
  position: { lat: number; lng: number };
  map: google.maps.Map;
  title: string;
  htmlContent: string;
}): google.maps.marker.AdvancedMarkerElement {
  const container = document.createElement("div");
  container.innerHTML = options.htmlContent.trim();

  return new google.maps.marker.AdvancedMarkerElement({
    position: options.position,
    map: options.map,
    title: options.title,
    content: container,
  });
}

export const MapView: React.FC<MapViewProps> = ({ focusedOrder }) => {
  const [googleMap, setGoogleMap] = useState<google.maps.Map | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [timeTick, setTimeTick] = useState(0); // Reloj para actualizar visualmente la última vez visto en tiempo real

  const { locations } = useDriverTrackingSocket();
  const { data: drivers = [] } = useDriversQuery();
  const { data: ordersResponse } = usePedidosTodayQuery();
  const { data: sedesResponse } = useSedesQuery();
  const allTodayOrders = ordersResponse?.data || [];
  const sedes = sedesResponse?.data || [];
  const { drawMultiStopRoute, clearRoute } = useMapRoute(googleMap);

  const markersRef = useRef<any[]>([]);

  // Temporizador para recalcular y re-renderizar el tiempo relativo transcurrido en el UI cada 60s
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeTick((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);



  // Sincronizar pedido enfocado desde la lista lateral
  useEffect(() => {
    if (focusedOrder) {
      setSelectedOrder(focusedOrder);
    }
  }, [focusedOrder, googleMap]);

  // Renderizar marcadores de choferes (🚚) y pedidos activos en el mapa
  useEffect(() => {
    if (!googleMap) return;

    clearRoute();

    // Limpiar marcadores anteriores
    markersRef.current.forEach((m) => {
      if (m.setMap) m.setMap(null);
      else if ("map" in m) m.map = null;
    });
    markersRef.current = [];

    const infoWindow = new google.maps.InfoWindow();
    googleMap.addListener("click", () => infoWindow.close());

    // 1. Mapear choferes activos y sus posiciones GPS con "última vez visto"
    const activeDriverPositions: Record<
      string,
      {
        lat: number;
        lng: number;
        name: string;
        statusColor: string;
        lastSeenText: string;
        updatedAt?: Date;
      }
    > = {};

    drivers.forEach((driver: any) => {
      const livePos = locations[driver.id];
      const driverName = driver.name || "Sin nombre";
      const lat = livePos?.latitude ?? driver.latitude;
      const lng = livePos?.longitude ?? driver.longitude;

      if (lat !== null && lat !== undefined && lng !== null && lng !== undefined) {
        let statusColor = "#EF4444";
        let lastSeenText = "Sin señal reciente";

        if (livePos?.updatedAt) {
          const diffMs = Date.now() - new Date(livePos.updatedAt).getTime();
          const minutes = Math.floor(diffMs / 60000);

          if (minutes < 5) {
            statusColor = "#3D5FFF";
            lastSeenText = minutes === 0 ? "hace instantes" : `hace ${minutes} min`;
          } else if (minutes <= 15) {
            statusColor = "#F59E0B";
            lastSeenText = `hace ${minutes} min`;
          } else {
            statusColor = "#EF4444";
            lastSeenText = minutes >= 60 ? `hace ${Math.floor(minutes / 60)}h` : `hace ${minutes} min`;
          }
        }

        activeDriverPositions[driver.id] = {
          lat: Number(lat),
          lng: Number(lng),
          name: driverName,
          statusColor,
          lastSeenText,
          updatedAt: livePos?.updatedAt,
        };
      }
    });

    // Dibujar cada Chofer en el mapa con su respectivo color según inactividad
    Object.entries(activeDriverPositions).forEach(([id, posInfo]) => {
      const truckMarker = createAdvancedMarker({
        position: { lat: posInfo.lat, lng: posInfo.lng },
        map: googleMap,
        title: `🚚 ${posInfo.name}`,
        htmlContent: TRUCK_MARKER_HTML(posInfo.statusColor),
      });

      truckMarker.addListener("gmp-click", () => {
        infoWindow.setContent(`
          <div style="color: #111; padding: 6px 8px; font-family: sans-serif; font-size: 13px;">
            <p style="margin: 0 0 3px 0; color: #333;">Chofer: <b>${posInfo.name}</b></p>
            <p style="margin: 0; color: #333;">Última posición: <b style="color: ${posInfo.statusColor};">${posInfo.lastSeenText}</b></p>
          </div>
        `);
        infoWindow.open(googleMap, truckMarker);
      });

      markersRef.current.push(truckMarker);
    });

    // 2. Si hay un Pedido Seleccionado / Enfocado
    const orderLat = selectedOrder?.latitude !== null && selectedOrder?.latitude !== undefined ? Number(selectedOrder.latitude) : null;
    const orderLng = selectedOrder?.longitude !== null && selectedOrder?.longitude !== undefined ? Number(selectedOrder.longitude) : null;

    if (selectedOrder && orderLat !== null && orderLng !== null) {
      const order = selectedOrder;
      const destPos = { lat: orderLat, lng: orderLng };

      const cleanMatrizText = (text?: string | null) => {
        if (!text) return "";
        return text.replace(/\s*-\s*Matriz/gi, "").replace(/\s*Matriz/gi, "").trim();
      };

      const getClientName = (ord: any): string => {
        if (!ord) return "";
        const rawName = ord.recipientCustomerType === "INDIVIDUAL" ? ord.recipientName : ord.customer?.name;
        return cleanMatrizText(rawName || "");
      };

      const driverId = order.driverId;
      const assignedDriver = driverId ? drivers.find((d: any) => d.id === driverId) : null;
      const liveDriverPos = driverId ? activeDriverPositions[driverId] : null;

      const warehouse = sedes.find((s: any) => s.id === order.originBranchId) || sedes[0];
      const warehouseCoords = warehouse?.latitude && warehouse?.longitude
        ? { lat: Number(warehouse.latitude), lng: Number(warehouse.longitude) }
        : null;

      // Resolver coordenadas de origen del chofer o sucursal
      const originCoords = liveDriverPos
        ? { lat: liveDriverPos.lat, lng: liveDriverPos.lng }
        : (order.originLatitude && order.originLongitude)
          ? { lat: Number(order.originLatitude), lng: Number(order.originLongitude) }
          : (assignedDriver && assignedDriver.latitude && assignedDriver.longitude)
            ? { lat: Number(assignedDriver.latitude), lng: Number(assignedDriver.longitude) }
            : warehouseCoords;

      // SI EXISTEN COORDENADAS: Dibujar paradas y polilínea
      if (originCoords) {
        if (driverId) {
          const existingTruck = markersRef.current.find((m) => {
            const pos = m.position;
            return pos && Math.abs(pos.lat - originCoords.lat) < 0.0001 && Math.abs(pos.lng - originCoords.lng) < 0.0001;
          });

          if (!existingTruck) {
            const driverName = assignedDriver?.name ?? liveDriverPos?.name ?? "Sin nombre";
            const statusColor = liveDriverPos?.statusColor || "#EF4444";
            const truckMarker = createAdvancedMarker({
              position: originCoords,
              map: googleMap,
              title: `🚚 ${driverName}`,
              htmlContent: TRUCK_MARKER_HTML(statusColor),
            });
            markersRef.current.push(truckMarker);
          }

          // Obtener únicamente los pedidos pendientes o en tránsito del chofer para el día
          const activeDriverOrders = allTodayOrders.filter((o: any) => {
            const rawSt = String(o.status || "PENDING").toUpperCase();
            const isFinished = rawSt === "DELIVERED" || rawSt === "FAILED" || rawSt === "OBSERVED";
            return (
              o.driverId === driverId &&
              !isFinished &&
              o.latitude !== null &&
              o.latitude !== undefined &&
              o.longitude !== null &&
              o.longitude !== undefined
            );
          });

          const sortedPendingOrders = activeDriverOrders.sort((a: any, b: any) => (a.sequenceIndex || 0) - (b.sequenceIndex || 0));

          const routeWaypoints: Array<{ lat: number; lng: number }> = [originCoords];

          const points = [
            originCoords,
            ...sortedPendingOrders.map((o: any) => ({ lat: Number(o.latitude), lng: Number(o.longitude) })),
          ];
          drawMultiStopRoute(points);

          // Renderizar los marcadores de destino
          sortedPendingOrders.forEach((actOrd: any, idx: number) => {
            const pt = { lat: Number(actOrd.latitude), lng: Number(actOrd.longitude) };
            routeWaypoints.push(pt);

            const statusDetail = ORDER_STATUS_DETAILS[actOrd.status] || ORDER_STATUS_DETAILS.PENDING;
            const clienteNombre = getClientName(actOrd);

            const destMarker = createAdvancedMarker({
              position: pt,
              map: googleMap,
              title: `📍 Parada ${idx + 1}: ${actOrd.code}`,
              htmlContent: DESTINATION_MARKER_HTML(statusDetail.color),
            });

            destMarker.addListener("gmp-click", () => {
              infoWindow.setContent(`
                <div style="color: #111; padding: 6px 8px; font-family: sans-serif; font-size: 13px;">
                  <p style="margin: 0 0 3px 0; color: #333;">Parada ${idx + 1} - Cliente: <b>${clienteNombre}</b></p>
                  <p style="margin: 0; color: #333;">Estado: <b style="color:${statusDetail.color}">${statusDetail.label}</b></p>
                </div>
              `);
              infoWindow.open(googleMap, destMarker);
            });

            markersRef.current.push(destMarker);
          });
        } else {
          const routeWaypoints: Array<{ lat: number; lng: number }> = [originCoords];
          routeWaypoints.push(destPos);

          const statusDetail = ORDER_STATUS_DETAILS[order.status] || ORDER_STATUS_DETAILS.PENDING;
          const clienteNombre = getClientName(order);

          const destMarker = createAdvancedMarker({
            position: destPos,
            map: googleMap,
            title: `📍 Pedido: ${order.code}`,
            htmlContent: DESTINATION_MARKER_HTML(statusDetail.color),
          });

          destMarker.addListener("gmp-click", () => {
            infoWindow.setContent(`
              <div style="color: #111; padding: 6px 8px; font-family: sans-serif; font-size: 13px;">
                <p style="margin: 0 0 3px 0; color: #333;">Cliente: <b>${clienteNombre}</b></p>
                <p style="margin: 0; color: #333;">Estado: <b style="color:${statusDetail.color}">${statusDetail.label}</b></p>
              </div>
            `);
            infoWindow.open(googleMap, destMarker);
          });

          markersRef.current.push(destMarker);
        }

        // Trazar la polilínea multiparada
        if (routeWaypoints.length >= 2) {
          drawMultiStopRoute(routeWaypoints);
        }
      } else {
        // CHOFER SIN UBICACIÓN REGISTRADA: Mostrar únicamente la parada de destino (📍)
        const statusDetail = ORDER_STATUS_DETAILS[order.status] || ORDER_STATUS_DETAILS.PENDING;
        const clienteNombre = getClientName(order);

        const destMarker = createAdvancedMarker({
          position: destPos,
          map: googleMap,
          title: `📍 Parada: ${order.code}`,
          htmlContent: DESTINATION_MARKER_HTML(statusDetail.color),
        });

        destMarker.addListener("gmp-click", () => {
          infoWindow.setContent(`
            <div style="color: #111; padding: 6px 8px; font-family: sans-serif; font-size: 13px;">
              <p style="margin: 0 0 3px 0; color: #333;">Cliente: <b>${clienteNombre}</b></p>
              <p style="margin: 0; color: #333;">Estado: <b style="color:${statusDetail.color}">${statusDetail.label}</b></p>
            </div>
          `);
          infoWindow.open(googleMap, destMarker);
        });

        markersRef.current.push(destMarker);
      }
    }
  }, [googleMap, selectedOrder, locations, drivers, allTodayOrders, timeTick]);

  const activeMapId = "DEMO_MAP_ID";

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <GoogleMapView
        mapId={activeMapId}
        onMapLoad={(map) => setGoogleMap(map)}
      />
    </div>
  );
};

export default MapView;
