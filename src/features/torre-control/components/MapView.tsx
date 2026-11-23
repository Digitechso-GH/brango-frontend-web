"use client";

import React, { useState, useEffect, useRef } from "react";
import { GoogleMapView } from "@/shared/integrations/google/components/GoogleMapView";
import { useDriverTrackingSocket } from "../hooks/useDriverTrackingSocket";
import { useMapRoute } from "../hooks/useMapRoute";
import { useDriversQuery, usePedidosTodayQuery, useSedesQuery } from "@/features/pedidos/hooks/usePedidosQueries";
import { ORDER_STATUS_DETAILS, ORDER_STATUS, FRONTEND_TO_BACKEND_STATUS_MAP, isOrderUnassignedForToday } from "@/shared/constants/order-status";
import { ORDER_STATUS_COLORS, VEHICLE_MARKER_COLOR, ORDER_VALIDITY_COLORS } from "@/shared/constants/status-colors";
import { getOrderValidity } from "@/shared/utils/orderValidity.utils";
import { getLocalTodayString } from "@/shared/utils/date";

import {
  getClientName,
  getJitteredPosition,
  createAdvancedMarker,
  bindTooltipHover,
  TRUCK_MARKER_HTML,
  DESTINATION_MARKER_HTML,
  VALIDITY_ORDER_MARKER_HTML,
  cleanupMarkers,
} from "../utils/mapMarkers.builder";

interface MapViewProps {
  focusedOrder?: any | null;
  selectedOrderIds?: string[];
  extraOrders?: any[];
  onSelectOrderForRoute?: (id: string) => void;
  onClearFocus?: () => void;
  selectedRouteId?: string;
  selectedStatus?: string;
  onSelectOrder?: (id: string) => void;
  isBuildingRoute?: boolean;
}

export const MapView: React.FC<MapViewProps> = ({
  focusedOrder,
  selectedOrderIds = [],
  extraOrders = [],
  onSelectOrderForRoute,
  onClearFocus,
  selectedRouteId = "all",
  selectedStatus = "all",
  onSelectOrder,
  isBuildingRoute = false,
}) => {
  const [googleMap, setGoogleMap] = useState<google.maps.Map | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [timeTick, setTimeTick] = useState(0); 

  const { locations } = useDriverTrackingSocket();
  const { data: drivers = [] } = useDriversQuery();
  const { data: ordersResponse } = usePedidosTodayQuery();
  const { data: sedesResponse } = useSedesQuery();
  const allTodayOrders = ordersResponse?.data || [];
  const sedes = sedesResponse?.data || [];
  const { drawMultiStopRoute, clearRoute } = useMapRoute(googleMap);

  const markersRef = useRef<any[]>([]);
  const lastCenteredOrderIdRef = useRef<string | null>(null);
  const lastDrawnRouteIdsRef = useRef<string>("");

  const [mapZoom, setMapZoom] = useState<number>(12);

  useEffect(() => {
    if (!googleMap) return;
    // Escuchar únicamente 'idle' (cuando el usuario termina de hacer zoom o pan)
    // Esto evita re-renderizados costosos mientras el usuario gira la rueda del ratón
    const listener = googleMap.addListener("idle", () => {
      const z = googleMap.getZoom();
      if (z !== undefined) {
        setMapZoom((prev) => (prev !== z ? z : prev));
      }
    });
    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [googleMap]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeTick((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setSelectedOrder(focusedOrder || null);
    if (!focusedOrder) {
      lastCenteredOrderIdRef.current = null;
    }
  }, [focusedOrder, googleMap]);

  // Renderizar marcadores de choferes (🚚) y pedidos activos en el mapa
  useEffect(() => {
    if (!googleMap) return;

    if (selectedOrder && selectedOrderIds.length < 2) {
      clearRoute();
    }

    // Limpiar marcadores anteriores con liberación explícita de referencias
    cleanupMarkers(markersRef.current);
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
        let statusColor: string = ORDER_STATUS_COLORS.OBSERVED;
        let lastSeenText = "Sin señal reciente";

        if (livePos?.updatedAt) {
          const diffMs = Date.now() - new Date(livePos.updatedAt).getTime();
          const minutes = Math.floor(diffMs / 60000);

          if (minutes < 5) {
            statusColor = VEHICLE_MARKER_COLOR;
            lastSeenText = minutes === 0 ? "hace instantes" : `hace ${minutes} min`;
          } else if (minutes <= 15) {
            statusColor = ORDER_STATUS_COLORS.IN_TRANSIT;
            lastSeenText = `hace ${minutes} min`;
          } else {
            statusColor = ORDER_STATUS_COLORS.OBSERVED;
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

    // Dibujar Chofer(es): si hay un pedido enfocado, mostrar únicamente su chofer asignado
    const driversToRender = selectedOrder
      ? selectedOrder.driverId
        ? Object.entries(activeDriverPositions).filter(([id]) => id === selectedOrder.driverId)
        : []
      : Object.entries(activeDriverPositions);

    driversToRender.forEach(([id, posInfo]) => {
      const truckMarker = createAdvancedMarker({
        position: { lat: posInfo.lat, lng: posInfo.lng },
        map: googleMap,
        title: "",
        htmlContent: TRUCK_MARKER_HTML(posInfo.statusColor, posInfo.name, posInfo.lastSeenText),
      });

      truckMarker.addEventListener("gmp-click", () => {
        infoWindow.setContent(`
          <div style="font-family: Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 4px 6px; text-align: left; min-width: 120px;">
            <div style="font-size: 13px; font-weight: 700; color: #202124; line-height: 1.3; margin-bottom: 2px;">
              ${posInfo.name}
            </div>
            <div style="font-size: 11px; font-weight: 500; color: #5f6368; line-height: 1.2;">
              Última posición: <span style="font-weight: 600; color: ${posInfo.statusColor};">${posInfo.lastSeenText}</span>
            </div>
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
        const routeWaypoints: Array<{ lat: number; lng: number }> = [originCoords];
        
        if (driverId) {
          const existingTruck = markersRef.current.find((m) => {
            const pos = m.position;
            return pos && Math.abs(pos.lat - originCoords.lat) < 0.0001 && Math.abs(pos.lng - originCoords.lng) < 0.0001;
          });

          if (!existingTruck) {
            const driverName = assignedDriver?.name ?? liveDriverPos?.name ?? "Sin nombre";
            const statusColor = liveDriverPos?.statusColor || ORDER_STATUS_COLORS.OBSERVED;
            const truckMarker = createAdvancedMarker({
              position: originCoords,
              map: googleMap,
              title: "",
              htmlContent: TRUCK_MARKER_HTML(statusColor, driverName, liveDriverPos?.lastSeenText),
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
          const isSelectedFinished = order.status === "DELIVERED" || order.status === "OBSERVED" || order.status === "FAILED";

          // Trazar ruta únicamente si el pedido seleccionado está activo/en tránsito
          if (!isSelectedFinished && sortedPendingOrders.length > 0) {
            const points = [
              originCoords,
              ...sortedPendingOrders.map((o: any) => ({ lat: Number(o.latitude), lng: Number(o.longitude) })),
            ];
            drawMultiStopRoute(points);
          }

          // Renderizar los marcadores de destino de paradas pendientes si no es un pedido finalizado
          if (!isSelectedFinished) {
            sortedPendingOrders.forEach((actOrd: any, idx: number) => {
              const pt = { lat: Number(actOrd.latitude), lng: Number(actOrd.longitude) };
              routeWaypoints.push(pt);

              const statusDetail = ORDER_STATUS_DETAILS[actOrd.status] || ORDER_STATUS_DETAILS.PENDING;
              const clienteNombre = getClientName(actOrd) || "Cliente";

              const destMarker = createAdvancedMarker({
                position: pt,
                map: googleMap,
                title: "",
                htmlContent: DESTINATION_MARKER_HTML(statusDetail.color, `${idx + 1}`, clienteNombre, actOrd.code),
              });

              destMarker.addEventListener("gmp-click", () => {
                infoWindow.setContent(`
                  <div style="font-family: Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 4px 6px; text-align: left; min-width: 120px;">
                    <div style="font-size: 13px; font-weight: 700; color: #202124; line-height: 1.3; margin-bottom: 2px;">
                      ${clienteNombre}
                    </div>
                    <div style="font-size: 11px; font-weight: 500; color: #5f6368; line-height: 1.2;">
                      Pedido: <span style="font-weight: 600; color: #1a73e8;">#${actOrd.code}</span>
                    </div>
                  </div>
                `);
                infoWindow.open(googleMap, destMarker);
              });

              markersRef.current.push(destMarker);
            });
          }

          // Renderizar SIEMPRE el marcador de destino del pedido seleccionado si no está entre los pendientes
          const isSelectedInPending = !isSelectedFinished && sortedPendingOrders.some((o: any) => o.id === selectedOrder.id);
          if (!isSelectedInPending) {
            const statusDetail = ORDER_STATUS_DETAILS[order.status] || ORDER_STATUS_DETAILS.PENDING;
            const clienteNombre = getClientName(order) || "Cliente";
            const badgeText = order.status === "DELIVERED" ? "✓" : "📍";

            const destMarker = createAdvancedMarker({
              position: destPos,
              map: googleMap,
              title: "",
              htmlContent: DESTINATION_MARKER_HTML(statusDetail.color, badgeText, clienteNombre, order.code),
              zIndex: 100,
            });

            destMarker.addEventListener("gmp-click", () => {
              infoWindow.setContent(`
                <div style="font-family: Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 4px 6px; text-align: left; min-width: 120px;">
                  <div style="font-size: 13px; font-weight: 700; color: #202124; line-height: 1.3; margin-bottom: 2px;">
                    ${clienteNombre}
                  </div>
                  <div style="font-size: 11px; font-weight: 500; color: #5f6368; line-height: 1.2;">
                    Pedido: <span style="font-weight: 600; color: #1a73e8;">#${order.code}</span>
                  </div>
                  <div style="font-size: 11px; font-weight: 500; color: ${statusDetail.color}; line-height: 1.2; margin-top: 2px;">
                    Estado: <strong>${statusDetail.label}</strong>
                  </div>
                </div>
              `);
              infoWindow.open(googleMap, destMarker);
            });

            markersRef.current.push(destMarker);
          }

          // Ajustar cámara para mostrar tanto el punto de entrega como la posición del chofer
          // SOLO la primera vez que se enfoca el pedido (para no interrumpir el zoom manual del usuario cuando lleguen sockets)
          const isNewFocus = lastCenteredOrderIdRef.current !== order.id;
          if (isNewFocus) {
            lastCenteredOrderIdRef.current = order.id;
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(destPos);
            if (originCoords && (Math.abs(originCoords.lat - destPos.lat) > 0.0005 || Math.abs(originCoords.lng - destPos.lng) > 0.0005)) {
              bounds.extend(originCoords);
              googleMap.fitBounds(bounds, { top: 90, right: 90, bottom: 90, left: 90 });
            } else {
              googleMap.setCenter(destPos);
              googleMap.setZoom(16);
            }
          }
        } else {
          routeWaypoints.push(destPos);

          const statusDetail = ORDER_STATUS_DETAILS[order.status] || ORDER_STATUS_DETAILS.PENDING;
          const clienteNombre = getClientName(order) || "Cliente";
          const badgeText = order.status === "DELIVERED" ? "✓" : "📍";

          const destMarker = createAdvancedMarker({
            position: destPos,
            map: googleMap,
            title: "",
            htmlContent: DESTINATION_MARKER_HTML(statusDetail.color, badgeText, clienteNombre, order.code),
            zIndex: 100,
          });

          destMarker.addEventListener("gmp-click", () => {
            infoWindow.setContent(`
              <div style="font-family: Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 4px 6px; text-align: left; min-width: 120px;">
                <div style="font-size: 13px; font-weight: 700; color: #202124; line-height: 1.3; margin-bottom: 2px;">
                  ${clienteNombre}
                </div>
                <div style="font-size: 11px; font-weight: 500; color: #5f6368; line-height: 1.2;">
                  Pedido: <span style="font-weight: 600; color: #1a73e8;">#${order.code}</span>
                </div>
                <div style="font-size: 11px; font-weight: 500; color: ${statusDetail.color}; line-height: 1.2; margin-top: 2px;">
                  Estado: <strong>${statusDetail.label}</strong>
                </div>
              </div>
            `);
            infoWindow.open(googleMap, destMarker);
          });

          markersRef.current.push(destMarker);

          if (routeWaypoints.length >= 2) {
            drawMultiStopRoute(routeWaypoints);
          }

          const isNewFocus = lastCenteredOrderIdRef.current !== order.id;
          if (isNewFocus) {
            lastCenteredOrderIdRef.current = order.id;
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(destPos);
            if (originCoords) {
              bounds.extend(originCoords);
              googleMap.fitBounds(bounds, { top: 90, right: 90, bottom: 90, left: 90 });
            } else {
              googleMap.setCenter(destPos);
              googleMap.setZoom(16);
            }
          }
        }
      } else {
        // CHOFER SIN UBICACIÓN REGISTRADA: Mostrar únicamente la parada de destino (📍)
        const statusDetail = ORDER_STATUS_DETAILS[order.status] || ORDER_STATUS_DETAILS.PENDING;
        const clienteNombre = getClientName(order) || "Cliente";
        const badgeText = order.status === "DELIVERED" ? "✓" : "📍";

        const destMarker = createAdvancedMarker({
          position: destPos,
          map: googleMap,
          title: "",
          htmlContent: DESTINATION_MARKER_HTML(statusDetail.color, badgeText, clienteNombre, order.code),
          zIndex: 100,
        });

        destMarker.addEventListener("gmp-click", () => {
          infoWindow.setContent(`
            <div style="font-family: Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 4px 6px; text-align: left; min-width: 120px;">
              <div style="font-size: 13px; font-weight: 700; color: #202124; line-height: 1.3; margin-bottom: 2px;">
                ${clienteNombre}
              </div>
              <div style="font-size: 11px; font-weight: 500; color: #5f6368; line-height: 1.2;">
                Pedido: <span style="font-weight: 600; color: #1a73e8;">#${order.code}</span>
              </div>
              <div style="font-size: 11px; font-weight: 500; color: ${statusDetail.color}; line-height: 1.2; margin-top: 2px;">
                Estado: <strong>${statusDetail.label}</strong>
              </div>
            </div>
          `);
          infoWindow.open(googleMap, destMarker);
        });

        markersRef.current.push(destMarker);

        const isNewFocus = lastCenteredOrderIdRef.current !== order.id;
        if (isNewFocus) {
          lastCenteredOrderIdRef.current = order.id;
          googleMap.setCenter(destPos);
          googleMap.setZoom(16);
        }
      }
    }

    return () => {
      cleanupMarkers(markersRef.current);
      markersRef.current = [];
    };
  }, [googleMap, selectedOrder, locations, drivers, allTodayOrders, timeTick, clearRoute, drawMultiStopRoute]); // REMOVED selectedOrderIds to prevent wiping all drivers

  // Efecto dedicado EXCLUSIVAMENTE al Route Builder y pedidos pendientes
  // Sigue la regla: solo actualiza el HTML de los marcadores existentes, no hace llamadas a Routes API
  const routeMarkersDict = useRef<Record<string, google.maps.marker.AdvancedMarkerElement>>({});

  useEffect(() => {
    if (!googleMap) return;

    const infoWindow = new google.maps.InfoWindow();
    googleMap.addListener("click", () => infoWindow.close());

    const currentIds = new Set<string>();

    // 1. Obtener órdenes del Route Builder o de Torre de Control según filtros
    const allKnownOrders = [
      ...allTodayOrders,
      ...extraOrders.filter((eo: any) => !allTodayOrders.some((ao: any) => ao.id === eo.id)),
    ];

    const selectedOrdersFull = selectedOrderIds
      .map((id) => allKnownOrders.find((o: any) => o.id === id))
      .filter(Boolean);

    const isRouteBuilderActive = isBuildingRoute || selectedOrderIds.length > 0;
    let visibleItems: Array<{ order: any; isRoute: boolean; routeIdx: number }> = [];

    if (isRouteBuilderActive) {
      // Modo Route Builder: respeta las órdenes seleccionadas para armar ruta y las pendientes disponibles
      const availableForDispatch = selectedOrder
        ? []
        : allTodayOrders.filter((o: any) => {
            if (selectedOrderIds.includes(o.id)) return false;
            if (o.status === ORDER_STATUS.OBSERVED) {
              const latestAssignment = o.assignments?.[0];
              if (latestAssignment && latestAssignment.date) {
                const assignmentDateStr = getLocalTodayString(latestAssignment.date);
                if (assignmentDateStr === getLocalTodayString()) {
                  return false; // No mostrar observados del mismo día
                }
              }
              return true;
            }
            if (o.status === ORDER_STATUS.PENDING && !o.driverId) return true;
            return false;
          });

      visibleItems = [
        ...selectedOrdersFull.map((o: any, idx: number) => ({ order: o, isRoute: true, routeIdx: idx })),
        ...availableForDispatch.map((o: any) => ({ order: o, isRoute: false, routeIdx: -1 })),
      ];
    } else {
      // Modo Monitoreo / Torre de Control con Filtros de Rutas y Estado
      const targetStatus = selectedStatus !== "all" ? FRONTEND_TO_BACKEND_STATUS_MAP[selectedStatus] : null;

      const filteredOrders = allTodayOrders.filter((o: any) => {
        // Filtro de ruta
        if (selectedRouteId !== "all") {
          if (selectedRouteId === "unassigned") {
            if (!isOrderUnassignedForToday(o)) return false;
          } else {
            if (o.routeId !== selectedRouteId) return false;
          }
        }

        // Filtro de estado
        if (targetStatus && o.status !== targetStatus) return false;

        return true;
      });

      visibleItems = filteredOrders.map((o: any) => ({
        order: o,
        isRoute: !!o.routeId,
        routeIdx: (o.sequenceIndex ?? 1) - 1,
      }));
    }

    const validVisibleItems = visibleItems.filter(
      (item) => item.order.latitude !== null && item.order.latitude !== undefined &&
                item.order.longitude !== null && item.order.longitude !== undefined
    );

    // 2. Agrupar órdenes visibles para evitar que marcadores en coordenadas idénticas se solapen
    const coordGroups = new Map<string, Array<{ order: any; isRoute: boolean; routeIdx: number }>>();
    validVisibleItems.forEach((item) => {
      const key = `${Number(item.order.latitude).toFixed(4)},${Number(item.order.longitude).toFixed(4)}`;
      if (!coordGroups.has(key)) coordGroups.set(key, []);
      coordGroups.get(key)!.push(item);
    });

    // Ordenamiento canónico e inmutable por código e ID de pedido
    coordGroups.forEach((group) => {
      group.sort((a, b) => {
        const codeA = Number(a.order.code) || 0;
        const codeB = Number(b.order.code) || 0;
        if (codeA !== codeB) return codeA - codeB;
        return a.order.id.localeCompare(b.order.id);
      });
    });

    const currentZoom = googleMap.getZoom() || mapZoom;

    const getPos = (item: { order: any; isRoute: boolean; routeIdx: number }) => {
      const baseLat = Number(item.order.latitude);
      const baseLng = Number(item.order.longitude);
      const key = `${baseLat.toFixed(4)},${baseLng.toFixed(4)}`;
      const group = coordGroups.get(key) || [];
      const idx = group.indexOf(item);
      return getJitteredPosition(baseLat, baseLng, idx >= 0 ? idx : 0, group.length, currentZoom);
    };

    // 3. Renderizar cada marcador visible
    validVisibleItems.forEach((item) => {
      const { order, isRoute, routeIdx } = item;
      const pt = getPos(item);
      const clientName = getClientName(order) || "Cliente";
      const orderCode = String(order.code || "");
      const markerId = isRoute ? `route-${order.id}` : `available-${order.id}`;
      currentIds.add(markerId);

      let htmlContent: string;
      const statusDetail = ORDER_STATUS_DETAILS[order.status] || ORDER_STATUS_DETAILS.PENDING;

      if (isRouteBuilderActive) {
        if (isRoute) {
          // Pedido asignado a la ruta en construcción
          htmlContent = DESTINATION_MARKER_HTML(VEHICLE_MARKER_COLOR, `${routeIdx + 1}`, clientName, orderCode);
        } else {
          // Pedidos disponibles para despacho (SLA / Vigencia)
          const validity = getOrderValidity(order.createdAt, order.dueDate, order.status);
          const markerColor = ORDER_VALIDITY_COLORS[validity.status];
          htmlContent = VALIDITY_ORDER_MARKER_HTML(markerColor, clientName, orderCode);
        }
      } else {
        // Modo Torre de Control
        if (order.status === "DELIVERED") {
          htmlContent = DESTINATION_MARKER_HTML(ORDER_STATUS_COLORS.DELIVERED, "✓", clientName, orderCode);
        } else if (order.routeId) {
          const badgeText = order.sequenceIndex ? `${order.sequenceIndex}` : `${routeIdx + 1}`;
          htmlContent = DESTINATION_MARKER_HTML(statusDetail.color, badgeText, clientName, orderCode);
        } else {
          const validity = getOrderValidity(order.createdAt, order.dueDate, order.status);
          const markerColor = ORDER_VALIDITY_COLORS[validity.status];
          htmlContent = VALIDITY_ORDER_MARKER_HTML(markerColor, clientName, orderCode);
        }
      }

      const handleMarkerAction = () => {
        if (isRouteBuilderActive) {
          if (!isRoute && onSelectOrderForRoute) {
            onSelectOrderForRoute(order.id);
          } else if (isRoute) {
            infoWindow.setContent(`
              <div style="font-family: Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 4px 6px; text-align: left; min-width: 120px;">
                <div style="font-size: 13px; font-weight: 700; color: #202124; line-height: 1.3; margin-bottom: 2px;">
                  Parada ${routeIdx + 1}: ${clientName}
                </div>
                <div style="font-size: 11px; font-weight: 500; color: #5f6368; line-height: 1.2;">
                  Pedido: <span style="font-weight: 600; color: #1a73e8;">#${orderCode}</span>
                </div>
              </div>
            `);
            const targetMarker = routeMarkersDict.current[markerId];
            if (targetMarker) {
              infoWindow.open(googleMap, targetMarker);
            }
          }
        } else {
          // Modo Torre de Control: ventana informativa limpia
          infoWindow.setContent(`
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 6px 8px; text-align: left; min-width: 150px;">
              <div style="font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 2px;">
                ${clientName}
              </div>
              <div style="font-size: 11px; font-weight: 500; color: #64748b; margin-bottom: 3px;">
                Pedido: <strong style="color: #2563eb;">#${orderCode}</strong>
              </div>
              <div style="font-size: 11px; font-weight: 600; color: ${statusDetail.color};">
                ${statusDetail.label}
              </div>
              ${
                order.rawAddress
                  ? `<div style="font-size: 10px; color: #94a3b8; margin-top: 4px; border-top: 1px solid #f1f5f9; padding-top: 3px;">${order.rawAddress}</div>`
                  : ""
              }
            </div>
          `);
          const targetMarker = routeMarkersDict.current[markerId];
          if (targetMarker) {
            infoWindow.open(googleMap, targetMarker);
          }
        }
      };

      if (routeMarkersDict.current[markerId]) {
        const m = routeMarkersDict.current[markerId];
        if (m.position && (m.position.lat !== pt.lat || m.position.lng !== pt.lng)) {
          m.position = pt;
        }
        m.zIndex = isRoute ? 100 + routeIdx : 10;
        const container = m.content as HTMLElement;
        if (container) {
          container.innerHTML = htmlContent.trim();
          bindTooltipHover(container);
          container.onclick = (e) => {
            e.stopPropagation();
            handleMarkerAction();
          };
        }
      } else {
        const newMarker = createAdvancedMarker({
          position: pt,
          map: googleMap,
          htmlContent: htmlContent,
          zIndex: isRoute ? 100 + routeIdx : 10,
        });

        const container = newMarker.content as HTMLElement;
        if (container) {
          container.onclick = (e) => {
            e.stopPropagation();
            handleMarkerAction();
          };
        }

        newMarker.addEventListener("gmp-click", () => {
          handleMarkerAction();
        });

        routeMarkersDict.current[markerId] = newMarker;
      }
    });

    // 4. Limpieza de marcadores que ya no están en las listas
    Object.keys(routeMarkersDict.current).forEach((id) => {
      if (!currentIds.has(id)) {
        const m = routeMarkersDict.current[id];
        if (m.map) m.map = null;
        delete routeMarkersDict.current[id];
      }
    });

    // 5. Dibujar la ruta entre paradas
    if (!selectedOrder) {
      if (selectedOrdersFull.length >= 2) {
        // En construcción de ruta con Route Builder
        const currentRouteKey = selectedOrdersFull.map((o: any) => o.id).join(",");
        if (lastDrawnRouteIdsRef.current !== currentRouteKey) {
          lastDrawnRouteIdsRef.current = currentRouteKey;
          const routePoints = selectedOrdersFull
            .filter((o: any) => o.latitude !== null && o.longitude !== null)
            .map((o: any) => {
              const item = validVisibleItems.find((v) => v.order.id === o.id && v.isRoute);
              return item ? getPos(item) : { lat: Number(o.latitude), lng: Number(o.longitude) };
            });

          if (routePoints.length >= 2) {
            drawMultiStopRoute(routePoints);
          } else {
            clearRoute();
          }
        }
      } else if (!isRouteBuilderActive && selectedRouteId !== "all" && selectedRouteId !== "unassigned") {
        // Visualización de una ruta específica seleccionada en Torre de Control
        const routeStops = validVisibleItems
          .filter((item) => item.isRoute)
          .sort((a, b) => (a.order.sequenceIndex ?? 0) - (b.order.sequenceIndex ?? 0));

        const currentRouteKey = `route-${selectedRouteId}-${routeStops.map((i) => i.order.id).join(",")}`;
        if (routeStops.length >= 2) {
          if (lastDrawnRouteIdsRef.current !== currentRouteKey) {
            lastDrawnRouteIdsRef.current = currentRouteKey;
            drawMultiStopRoute(routeStops.map((item) => getPos(item)));
          }
        } else {
          if (lastDrawnRouteIdsRef.current !== "") {
            lastDrawnRouteIdsRef.current = "";
            clearRoute();
          }
        }
      } else {
        if (lastDrawnRouteIdsRef.current !== "") {
          lastDrawnRouteIdsRef.current = "";
          clearRoute();
        }
      }
    }

    return () => {
      Object.keys(routeMarkersDict.current).forEach((id) => {
        const m = routeMarkersDict.current[id];
        if (m) m.map = null;
      });
      routeMarkersDict.current = {};
    };
  }, [
    googleMap,
    selectedOrderIds,
    isBuildingRoute,
    allTodayOrders,
    extraOrders,
    onSelectOrderForRoute,
    selectedOrder,
    selectedRouteId,
    selectedStatus,
    mapZoom,
    drawMultiStopRoute,
    clearRoute,
  ]);

  const activeMapId = "DEMO_MAP_ID";

  return (
    <div className="relative w-full h-full min-h-[500px]">
      {selectedOrder && (
        <div className="absolute top-4 right-4 z-20 bg-white/95 dark:bg-[#1A1A24]/95 backdrop-blur-md border border-blue-200 dark:border-blue-900/60 shadow-xl rounded-xl px-4 py-2 flex items-center gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Siguiendo: #{selectedOrder.code}
            </span>
          </div>
          <button
            onClick={() => {
              setSelectedOrder(null);
              if (onClearFocus) onClearFocus();
            }}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline cursor-pointer"
          >
            Ver todos los pedidos ✕
          </button>
        </div>
      )}
      <GoogleMapView
        mapId={activeMapId}
        onMapLoad={(map) => setGoogleMap(map)}
      />
    </div>
  );
};

export default MapView;
